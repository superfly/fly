import { request, GraphQLClient } from 'graphql-request';
import polarity from 'polarity-webpack';

fly.http.respondWith( async function( req ) {

    let data, status, contentType;
    const url = new URL(req.url);

    if( req.method === 'POST' ) {
        ({ data, status, contentType } = await getGitHubData( req, url ));
    } else {
        ({ data, status, contentType } = await serveGUI( url ));
    }

    return new Response( data, { status: status, headers: { 'content-type': contentType } } );
});

/****
 * send html, css, and js
 * for gui
 */

async function serveGUI( url ) {
    
    let res, fileType;
    const headerContentTypes = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css'
    }

    const pathname = ( url.pathname === '/' ) ? '/index.html' : url.pathname;
    res = await fetch( 'file://build' + pathname );
    
    fileType = pathname.split('.').pop();
    if( res.status === 200 && Object.keys( headerContentTypes ).includes( fileType ) ) {
        let fileText = await res.text();
        return { data: fileText, status: 200, contentType: headerContentTypes[ fileType ] };
    }

    return { data: "<p>Not found.</p>", status: 404, contentType: "text/html" };
}

/****
 * serve api data; we only validate fields if query 
 * is not coming from the gui
 */

async function getGitHubData( req, url ) {

    let cacheKey = "", queryString = "";
    let reqString = await req.text();

    const client = new GraphQLClient( 'https://api.github.com/graphql', {
        headers: {
            'User-Agent': req.headers.get('User-Agent') || app.config.userAgent,
            'Authorization': req.headers.get('Authorization') || 'Bearer ' + app.config.userToken
        }
    });

    //only requests from gui are json; non-gui requests use graphql syntax
    if( url.pathname === '/standard' ) {
        let reqStringJSON = await JSON.parse( reqString );
        cacheKey = reqStringJSON.org + "-" + reqStringJSON.repo;
        queryString = reqStringJSON.query;
    } else {
        queryString = addRequiredQueryFields( reqString );
    }

    const { dataString, status } = await getIssues( queryString, client, cacheKey );

    return { data: dataString, status: status, contentType: "application/json" };
}

/****
 * add missing query fields (if any) for custom queries;
 * we need id, number, title, and bodyText to deliver sentiment
 */

function addRequiredQueryFields( query ) {

    let stringCondensed = query.replace(/\s+/g, " ");
    let starti = stringCondensed.indexOf('node {') + 6;
    let endi = stringCondensed.indexOf('}', starti);
    let currentParams = ( stringCondensed.substring(starti, endi) ).split(" ");
    const requiredParams = [ "id", "number", "title", "bodyText" ];
    requiredParams.forEach( function( p ) {
        if( !currentParams.includes( p ) ) { currentParams.push(p) }
    });
    currentParams = currentParams.join(" ");

    return stringCondensed.substr(0, starti) + currentParams + stringCondensed.substr(endi);
}

    

/****
 * send user's request to github OR
 * retrieve from cache if possible
 */

async function getIssues( query, client, cacheKey ) {

    let data, dataString, dataJson, status, cachedResponse = null;

    if( cacheKey ) { cachedResponse = await fly.cache.getString( cacheKey ); }
    if( cachedResponse !== null ) {
        status = 200;
        dataString = cachedResponse;
        return { dataString, status };
    } else {
        //get issue details
        try {

            data = await client.request( query );   //query github

            dataString = await JSON.stringify( data );
            dataJson = await JSON.parse( dataString );

            dataJson = getSentiment( dataJson );

            status = 200;
        
        } catch( err ) {

            //remove github status before returning because it seems to return 200 no matter what
            dataString = await JSON.stringify( err );
            dataJson = await JSON.parse( dataString );
            delete dataJson.response.status;

            status = 500; 
        }

        dataString = await JSON.stringify( dataJson );

        if( cacheKey && ( status !== 500 ) ) {
            fly.cache.set( cacheKey, dataString, 172800 );   //cache for 2 days (only non-custom requests)
        }

        return { dataString, status };
    }
}


/****
 * analyze issue(s) and 'stitch' sentiment into github response;
 * return updated response
 */

function getSentiment( response ) {
    
    const issuesToEvaluate = response.repository.issues.edges;
    
    for( let i = issuesToEvaluate.length - 1; i >= 0; i-- ) {
        let sent = polarity( ( issuesToEvaluate[i].node.title + " " + issuesToEvaluate[i].node.bodyText ).split(" ") );
        issuesToEvaluate[i].node.sentiment = sent;
    };

    return response;
}