import { logger } from '../logger'

export default function registerSession() {
  registerMiddleware("session", function () {
    return async function (req, next) {
      const sessCookie = this.settings.get("session_cookie");
      if (!sessCookie) {
        logger.debug("(session-router) no session cookie")
        return next(req);
      }

      const cookie = req.cookies.get(sessCookie)

      if (cookie) {
        logger.debug("(session-cookie) we have session cookie! ", cookie)
        session.set('loggedIn', true)
      }

      return next(req);
    };
  }())
}
