
fly.http.respondWith( async function( req ) {

    const url = new URL(req.url);

    if( url.pathname.startsWith( '/auth_callback' ) ) {

        const payload = await JSON.stringify({
            client_id: app.config.clientId,
            client_secret: app.config.clientSecret,
            code: url.searchParams.get('code')
        });

        //send post to get token form github, send cookie back to client & close window
        const ghToken = await fetch( 'https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: payload
        });

        if( ghToken.status === 200 ) {
            const ghTokenJSON = await ghToken.json();
            console.log( "\n\n", ghTokenJSON, "\n\n" );
            return new Response( "<html><p>Success! Just a second...</p><script>window.setTimeout(function(){window.close();},1000);</script></html>", { status: 200, headers: { "Set-Cookie": "gh_user_token=" + ghTokenJSON.access_token + "; Max-Age=604800;" } } );
        } else {
            return new Response( "<html><p>RUH ROH. Something went wrong...please try again.</p><script>window.setTimeout(function(){window.close();},1500);</script></html>", { status: 500, headers: { "Set-Cookie": "gh_user_token=null; Max-Age=0;" } } );
        }
    }
});