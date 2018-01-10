module.exports = function(ivm, dispatch) {
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
		append: function(name, value /*, filename */ ) {
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

		toString: function() {
			return this._data.map(function(pair) {
					return encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]);
				})
				.join('&');
		}
	};

	FormData.parse = function(req) {
		return new Promise(function(resolve, reject) {
			let fd = new FormData()
			dispatch.apply(undefined, ["parseFormData", req, new ivm.Reference(function(name, ...args) {
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
						console.log("got a part! from v8")
						fd.append(args[0], args[1])
				}
			})])
		})
	}

	return FormData
}

// FormData.parse = function (body, contentType) {
//   let fd = new FormData()
//   var parts = contentType.split('boundary=');
//   var boundary = parts[1];
//   console.log("before multipart parsing...", body, contentType)
//   try {
//     console.log("multipart parse", JSON.stringify(parseMultiparts(unicodeStringToTypedArray(body), boundary)))
//   } catch (err) {
//     console.log("error parsing multipart:", err.toString())
//   }

//   // Examples for content types:
//   //      multipart/form-data; boundary="----7dd322351017c"; ...
//   //      multipart/form-data; boundary=----7dd322351017c; ...
//   var m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

//   if (!m) {
//     throw new Error('Bad content-type header, no multipart boundary');
//   }

//   var boundary = m[1] || m[2];

//   function Header_parse(header) {
//     var headerFields = {};
//     var matchResult = header.match(/^.*name="([^"]*)"$/);
//     if (matchResult) headerFields.name = matchResult[1];
//     return headerFields;
//   }

//   function rawStringToBuffer(str) {
//     var idx, len = str.length, arr = new Array(len);
//     for (idx = 0; idx < len; ++idx) {
//       arr[idx] = str.charCodeAt(idx) & 0xFF;
//     }
//     return new Uint8Array(arr).buffer;
//   }

//   // \r\n is part of the boundary.
//   var boundary = '\r\n--' + boundary;

//   var isRaw = typeof (body) !== 'string';

//   var s

//   if (isRaw) {
//     var view = new Uint8Array(body);
//     s = String.fromCharCode.apply(null, view);
//   } else {
//     s = body;
//   }

//   // Prepend what has been stripped by the body parsing mechanism.
//   s = '\r\n' + s;

//   var parts = s.split(new RegExp(boundary))

//   // First part is a preamble, last part is closing '--'
//   for (var i = 1; i < parts.length - 1; i++) {
//     var subparts = parts[i].split('\r\n\r\n');
//     var headers = subparts[0].split('\r\n');
//     var fieldName
//     for (var j = 1; j < headers.length; j++) {
//       var headerFields = Header_parse(headers[j]);
//       if (headerFields.name) {
//         fieldName = headerFields.name;
//       }
//     }

//     fd.set(fieldName, isRaw ? rawStringToBuffer(subparts[1]) : subparts[1]);
//   }

//   return fd;
// }

// function Parser(arraybuf, boundary) {
//   this.array = arraybuf;
//   this.token = null;
//   this.current = null;
//   this.i = 0;
//   this.boundary = boundary;
// }

// Parser.prototype.skipPastNextBoundary = function () {
//   console.log("in skipPastNextBoundary")
//   var boundaryIndex = 0;
//   var isBoundary = false;

//   while (!isBoundary) {
//     if (this.next() === null) {
//       return false;
//     }

//     console.log("in boundary loop", this.boundary, boundaryIndex)

//     if (this.current === this.boundary[boundaryIndex]) {
//       boundaryIndex++;
//       if (boundaryIndex === this.boundary.length) {
//         isBoundary = true;
//       }
//     } else {
//       boundaryIndex = 0;
//     }
//   }

//   return true;
// }

// Parser.prototype.parseHeader = function () {
//   var header = '';
//   var _this = this;
//   var skipUntilNextLine = function () {
//     header += _this.next();
//     while (_this.current !== '\n' && _this.current !== null) {
//       header += _this.next();
//     }
//     if (_this.current === null) {
//       return null;
//     }
//   };

//   var hasSkippedHeader = false;
//   while (!hasSkippedHeader) {
//     skipUntilNextLine();
//     header += this.next();
//     if (this.current === '\r') {
//       header += this.next(); // skip
//     }

//     if (this.current === '\n') {
//       hasSkippedHeader = true;
//     } else if (this.current === null) {
//       return null;
//     }
//   }

//   return header;
// }

// Parser.prototype.next = function () {
//   if (this.i >= this.array.byteLength) {
//     this.current = null;
//     return null;
//   }

//   this.current = String.fromCharCode(this.array[this.i]);
//   this.i++;
//   return this.current;
// }

// function buf2String(buf) {
//   var string = '';
//   buf.forEach(function (byte) {
//     string += String.fromCharCode(byte);
//   });
//   return string;
// }

// function processSections(arraybuf, sections) {
//   for (var i = 0; i !== sections.length; ++i) {
//     var section = sections[i];
//     console.log("section:", JSON.stringify(section))
//     if (section.header['content-type'] === 'text/plain') {
//       section.text = buf2String(arraybuf.slice(section.bodyStart, section.end));
//     } else {
//       var imgData = arraybuf.slice(section.bodyStart, section.end);
//       section.file = new Blob([imgData], {
//         type: section.header['content-type']
//       });
//       var fileNameMatching = (/\bfilename\=\"([^\"]*)\"/g).exec(section.header['content-disposition']) || [];
//       section.fileName = fileNameMatching[1] || '';
//     }
//     var matching = (/\bname\=\"([^\"]*)\"/g).exec(section.header['content-disposition']) || [];
//     section.name = matching[1] || '';

//     delete section.headerStart;
//     delete section.bodyStart;
//     delete section.end;
//   }

//   return sections;
// }

// function parseMultiparts(arraybuf, boundary) {
//   boundary = '--' + boundary;
//   var parser = new Parser(arraybuf, boundary);
//   console.log("made parser")

//   var sections = [];
//   while (parser.skipPastNextBoundary()) {
//     console.log("looping")
//     var header = parser.parseHeader();

//     if (header !== null) {
//       var headerLength = header.length;
//       var headerParts = header.trim().split('\n');

//       var headerObj = {};
//       for (var i = 0; i !== headerParts.length; ++i) {
//         var parts = headerParts[i].split(':');
//         headerObj[parts[0].trim().toLowerCase()] = (parts[1] || '').trim();
//       }

//       sections.push({
//         'bodyStart': parser.i,
//         'header': headerObj,
//         'headerStart': parser.i - headerLength
//       });
//     }
//   }

//   // add dummy section for end
//   sections.push({
//     'headerStart': arraybuf.byteLength - boundary.length - 2 // 2 hyphens at end
//   });
//   for (var i = 0; i !== sections.length - 1; ++i) {
//     sections[i].end = sections[i + 1].headerStart - boundary.length;

//     if (String.fromCharCode(arraybuf[sections[i].end]) === '\r' || '\n') {
//       sections[i].end -= 1;
//     }
//     if (String.fromCharCode(arraybuf[sections[i].end]) === '\r' || '\n') {
//       sections[i].end -= 1;
//     }
//   }
//   // remove dummy section
//   sections.pop();

//   sections = processSections(arraybuf, sections);

//   return sections;
// }

// function unicodeStringToTypedArray(s) {
//   var escstr = encodeURIComponent(s);
//   var binstr = escstr.replace(/%([0-9A-F]{2})/g, function (match, p1) {
//     return String.fromCharCode('0x' + p1);
//   });
//   var ua = new Uint8Array(binstr.length);
//   Array.prototype.forEach.call(binstr, function (ch, i) {
//     ua[i] = ch.charCodeAt(0);
//   });
//   return ua;
// }
