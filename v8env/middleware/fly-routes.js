module.exports = function () {
	registerMiddleware("fly-routes", function () {
		return async function (req, next) {

			const rule = _matchRules(req)
			if (!rule) {
				return new Response('', {
					status: 404
				})
			}

			let url = new URL(req.url)

			if (rule.action_type == "redirect") {
				const redirectURL = rewriteRedirectURL(rule, url)

				return new Response('', {
					status: 302,
					headers: {
						location: redirectURL.toString()
					}
				})
			}

			const b = getBackendByID(rule.backend_id)
			url = rewriteURL(rule, url)

			let newReq = new Request(req)
			newReq.url = url.toString()
			return Middleware.run("fly-backend", { backend: b }, newReq)
		}

		function _matchRules(req) {
			if (!app.rules)
				return null
			return app.rules.sort((a, b) => a.priority - b.priority).find((rule) => matchesRule(rule, req))
		}

		function matchesRule(rule, req) {
			const u = new URL(req.url)
			if (!(rule instanceof Object)) {
				return false
			}

			if (rule.match_scheme && rule.match_scheme != u.protocol.slice(0, -1)) {
				return false
			}

			if (rule.hostname && rule.hostname != u.hostname) {
				return false
			}

			/*
			       This section is really annoying, but now we can nicely support rules for
			       logged-in users using `global.session` and session middleware.
			       Some rules in production might still rely on the header value, though.
			      */
			if (rule.http_header_key == 'Fly-User-Id') {
				if (!global.session.get('loggedIn')) {
					return false
				}
			} else if (rule.http_header_key && rule.http_header_value_regex) {
				const header = req.headers.get(rule.http_header_key)

				if (!header) {
					return false
				}

				if (!header.match(rule.http_header_value_regex)) {
					return false
				}
			}

			if (rule.path_pattern && !u.pathname.match(rule.path_pattern)) {
				return false
			}

			return true
		}

		function rewriteURL(rule, url) {
			if (!(rule instanceof Object) ||
				!rule.path_pattern ||
				!rule.path_replacement_pattern) {
				return url
			}
			url.pathname = url.pathname.replace(new RegExp(rule.path_pattern), rule.path_replacement_pattern)
			return url
		}

		function rewriteRedirectURL(rule, url) {
			if (!(rule instanceof Object) ||
				!rule.path_pattern ||
				!rule.redirect_url) {
				return url
			}
			const redirectURL = url.pathname.replace(new RegExp(rule.path_pattern), rule.redirect_url)
			try {
				const newURL = new URL(redirectURL)
				url = newURL
			} catch (err) {
				// not an absolute path
				url.pathname = redirectURL
			}
			return url
		}

		function getBackendByID(id) {
			if (!(app.backends instanceof Array)) {
				return null
			}
			return app.backends.find((backend) => {
				return backend.id == id
			})
		}
	}())
}
