import { logger } from '../logger'

export default function registerGoogleAnalytics() {
  registerMiddleware("google-analytics", function () {
    const gaCollectURL = "http://www.google-analytics.com/collect",
      gaURLParams = {
        utm_source: "cs",
        utm_name: "cn",
        utm_medium: "cm",
        utm_term: "ck",
        utm_content: "cc",
        utm_id: "ci",
        gclid: "gclid",
        dclid: "dclid"
      },
      ignoreCookie = /(__utm.|utmctr|utmcmd.|utmccn.|_ga|_gat|_gid|has_js|__gads)/,
      ignoreQueryParam = /[&?](utm_(campaign|content|medium|source|term)|gclid|cx|ie|cof|siteurl|zanpid|origin)=([A-z0-9_\\-\\.%25]+)/;

    const bodyEndTagRegex = /(<\/body>)/;
    const htmlContentType = /^text\/html/;

    return async function (req, next) {
      logger.debug("INSIDE GA MIDDLEWARE", typeof this, this.constructor.name)
      logger.debug("settings:", typeof this.settings, this.settings.constructor.name, JSON.stringify(this.settings))
      const trackingID = this.settings.get("tracking_id");
      logger.debug("got tracking id", trackingID)
      if (!trackingID) {
        // logger.debug("no tracking id bro")
        return next(req);
      }

      let sess = this.session;
      logger.debug("session", typeof this.session)

      const userID = sess.userID,
        clientID = sess.clientID;

      // TODO
      let cache = this.cache;
      cache.ignoreCookie(ignoreCookie);
      cache.ignoreQueryParam(ignoreQueryParam);

      const fullURL = req.url; // original url
      logger.debug("full url:", fullURL)

      // addEventListener(
      //   "fetchEnd",
      //   fetchEnd(fullURL, trackingID, clientID, userID)
      // );

      logger.debug("(ga) awaiting response")
      let err = null;
      let res = null;
      try {
        res = await next(req);
        logger.debug("(ga) got res", typeof res, res instanceof Response)

        // TODO: implement
        // if (htmlContentType.test(res.headers.get("content-type"))) {
        //   logger.debug("MATCHED TEXT/HTML")
        //   addEventListener("responseChunk", responseChunk(trackingID, clientID, userID))
        //   let html = await res.text()
        //   if (bodyEndTagRegex.test(html)) {
        //     res.body = html.replace("</body>", `${gaJS(trackingID, clientID, userID)}</body>`)
        //   }
        // }

        return res;
      } catch (e) {
        err = e
        throw e
      } finally {
        setTimeout(fetchEnd(req, res, err, fullURL, trackingID, clientID, userID), 1)
      }
    };

    function responseChunk(trackingID, clientID, userID) {
      return function (event) {
        let chunk = event.chunk;

        if (bodyEndTagRegex.test(chunk)) {
          event.rewrite(
            chunk.toString().replace("</body>", `${gaJS(trackingID, clientID, userID)}</body>`)
          );
        }
      };
    }

    function fetchEnd(req, res, err, fullURL, trackingID, clientID, userID) {
      return async function () {
        logger.debug("in fetch end")
        // throw new Error("waaaaaa")
        const success = res.ok,
          ua = req.headers.get("user-agent"),
          remoteAddr = req.remoteAddr.split(":")[0];

        logger.debug("made it after assignments")

        if (err)
          logger.debug("got event.error", err)

        logger.debug("ua:", ua)
        if (!ua) return;

        let lang = req.headers.get("accept-language");
        if (!!lang) lang = lang.toLowerCase().split(",")[0];

        logger.debug("got lang:", lang)

        let form = new FormData();

        logger.debug("made it past form data creation")

        form.set("v", 1);
        form.set("t", "pageview");
        form.set("tid", trackingID);
        form.set("cid", clientID);
        form.set("uip", remoteAddr);
        form.set("ul", lang);
        form.set("dr", req.referrer);
        form.set("dl", fullURL);
        form.set("ds", "fly.io");
        form.set("ua", ua);

        logger.debug("got all kinds of form data set!")

        if (userID != "") form.set("uid", userID);

        if (!success) {
          form.set("t", "exception");
          form.set("exd", res.status);
        }

        logger.debug("form to string", form.toString())

        let u;
        try {
          u = new URL(fullURL);
          logger.debug("new URL!", typeof u)
        } catch (err) {
          logger.debug("error making URL:", err.toString())
        }

        const sp = u.searchParams;
        for (let k of sp.keys()) {
          logger.debug("sp key:", k);
          const gaName = gaURLParams[k];
          if (gaName) {
            form.set(gaName, sp.get(k));
          }
        }

        await fetch(gaCollectURL, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded"
          },
          body: form
        });
      };
    }

    function gaJS(trackingID, clientID, userID) {
      return `<!-- Google Analytics --><script>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    ga('create', '${trackingID}', 'auto', {"clientID":"${clientID}","userID":"${
        userID
        }"})
    </script><!-- End Google Analytics -->`;
    }

  }())
}
