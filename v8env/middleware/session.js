module.exports = function () {
  registerMiddleware("session", function () {
    return async function (req, next) {
      const sessCookie = this.settings.get("session_cookie");
      if (!sessCookie) {
        console.debug("(session-router) no session cookie")
        return next(req);
      }

      const cookie = req.cookies.get(sessCookie)

      if (cookie) {
        console.debug("(session-cookie) we have session cookie! ", cookie)
        session.set('loggedIn', true)
      }

      return next(req);
    };
  }())
}
