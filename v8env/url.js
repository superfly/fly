const urlParse = require("url-parse")
const URLSearchParams = require("url-search-params")

module.exports = URL

function URL(path, base) {
	let instance = urlParse(path, base)
	let queryObject = new URLSearchParams(instance.query)
	// Object.defineProperty(this, "_inst", {
	//   value: ,
	//   enumerable: false
	// })

	Object.defineProperties(this, {
		href: {
			get: function() { return instance.href; },
			set: function(v) { instance.href = v;
				tidy_instance();
				update_steps(); },
			enumerable: true,
			configurable: true
		},
		origin: {
			get: function() {
				if ('origin' in instance) return instance.origin;
				return this.protocol + '//' + this.host;
			},
			enumerable: true,
			configurable: true
		},
		protocol: {
			get: function() { return instance.protocol; },
			set: function(v) { instance.protocol = v; },
			enumerable: true,
			configurable: true
		},
		username: {
			get: function() { return instance.username; },
			set: function(v) { instance.username = v; },
			enumerable: true,
			configurable: true
		},
		password: {
			get: function() { return instance.password; },
			set: function(v) { instance.password = v; },
			enumerable: true,
			configurable: true
		},
		host: {
			get: function() {
				// IE returns default port in |host|
				var re = { 'http:': /:80$/, 'https:': /:443$/, 'ftp:': /:21$/ }[instance.protocol];
				return re ? instance.host.replace(re, '') : instance.host;
			},
			set: function(v) { instance.host = v; },
			enumerable: true,
			configurable: true
		},
		hostname: {
			get: function() { return instance.hostname; },
			set: function(v) { instance.hostname = v; },
			enumerable: true,
			configurable: true
		},
		port: {
			get: function() { return instance.port; },
			set: function(v) { instance.port = v; },
			enumerable: true,
			configurable: true
		},
		pathname: {
			get: function() {
				// IE does not include leading '/' in |pathname|
				if (instance.pathname.charAt(0) !== '/') return '/' + instance.pathname;
				return instance.pathname;
			},
			set: function(v) { instance.pathname = v; },
			enumerable: true,
			configurable: true
		},
		search: {
			get: function() { return instance.search; },
			set: function(v) {
				if (instance.search === v) return;
				instance.search = v;
				tidy_instance();
				update_steps();
			},
			enumerable: true,
			configurable: true
		},
		searchParams: {
			get: function() { return queryObject; },
			enumerable: true,
			configurable: true
		},
		hash: {
			get: function() { return instance.hash; },
			set: function(v) { instance.hash = v;
				tidy_instance(); },
			enumerable: true,
			configurable: true
		},
		toString: {
			value: function() {
				instance.set("query", queryObject.toString())
				return instance.toString();
			},
			enumerable: false,
			configurable: true
		},
		valueOf: {
			value: function() { return instance.valueOf(); },
			enumerable: false,
			configurable: true
		}
	})

	function tidy_instance() {
		var href = instance.href.replace(/#$|\?$|\?(?=#)/g, '');
		if (instance.href !== href)
			instance.href = href;
	}

	function update_steps() {
		queryObject._setList(instance.search ? urlencoded_parse(instance.search.substring(1)) : []);
		queryObject._update_steps();
	};
}

function urlencoded_parse(input, isindex) {
	var sequences = input.split('&');
	if (isindex && sequences[0].indexOf('=') === -1)
		sequences[0] = '=' + sequences[0];
	var pairs = [];
	sequences.forEach(function(bytes) {
		if (bytes.length === 0) return;
		var index = bytes.indexOf('=');
		if (index !== -1) {
			var name = bytes.substring(0, index);
			var value = bytes.substring(index + 1);
		} else {
			name = bytes;
			value = '';
		}
		name = name.replace(/\+/g, ' ');
		value = value.replace(/\+/g, ' ');
		pairs.push({ name: name, value: value });
	});
	var output = [];
	pairs.forEach(function(pair) {
		output.push({
			name: decodeURIComponent(pair.name),
			value: decodeURIComponent(pair.value)
		});
	});
	return output;
}
