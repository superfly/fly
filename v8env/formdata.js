const logger = require('./logger')

module.exports = function (ivm, dispatch) {
	function FormData(form) {
		this._data = [];
		if (!form) return;
		for (var i = 0; i < form.elements.length; ++i) {
			var element = form.elements[i];
			if (element.name !== '')
				this.append(element.name, element.value);
		}
	}

	FormData.prototype = {
		append: function (name, value /*, filename */) {
			if ('Blob' in global && value instanceof global.Blob)
				throw TypeError("Blob not supported");
			name = String(name);
			this._data.push([name, value]);
		},

		get: function get(name) {
			name = name.toLowerCase();
			for (var index = 0; index < this._data.length; ++index) {
				if (this._data[index][0] === name)
					return this._data[index][1];
			}
			return null;
		},

		getAll: function getAll(name) {
			var sequence = [];
			for (var index = 0; index < this._data.length; ++index) {
				if (this._data[index][0] === name)
					sequence.push(this._data[index][1]);
			}
			return sequence;
		},

		set: function set(name, value) {
			for (var index = 0; index < this._data.length; ++index) {
				if (this._data[index][0] === name) {
					this._data[index++][1] = value;
					while (index < this._data.length) {
						if (this._data[index][0] === name)
							this._data.splice(index, 1);
						else
							++index;
					}
					return;
				}
			}
			this._data.push([name, value]);
		},

		toString: function () {
			return this._data.map(function (pair) {
				return encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]);
			})
				.join('&');
		}
	};

	FormData.parse = function (req) {
		return new Promise(function (resolve, reject) {
			let fd = new FormData()
			dispatch.apply(undefined, ["parseFormData", req, new ivm.Reference(function (name, ...args) {
				switch (name) {
					case "end":
						resolve(fd)
						break
					case "close":
						resolve(fd)
						break
					case "error":
						reject(new Error(args[0]))
						break
					case "part":
						logger.debug("got a part! from v8")
						fd.append(args[0], args[1])
				}
			})])
		})
	}

	return FormData
}