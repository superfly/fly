const htmlparser = require('htmlparser2')
const {
	getOuterHTML,
	getText,
	getInnerHTML,
	replaceElement
} = require('domutils')

const WritableParser = htmlparser.WritableStream

const css = require('css-select')

class Document {
	constructor(dom) {
		this._dom = dom
	}

	getElementById(id) {
		return this.querySelector(`#${id}`)
	}

	querySelector(selector) {
		let found = css.selectOne(selector, this._dom)
		if (!found)
			return null
		return new Element(this._withParent(found))
	}

	querySelectorAll(selector) {
		return css.selectAll(selector, this._dom)
			.map(d => new Element(this._withParent(d)))
	}

	_withParent(node) {
		node.parent || (node.parent = this)
		return node
	}

	set children(children) {
		this._dom = children
	}

	get children() {
		return this._dom
	}

	get documentElement() {
		return new Element(this._dom)
	}
}

class Element {
	constructor(dom) {
		this._dom = dom
		console.debug("made element", this._dom.attribs)
	}

	get id() {
		return this._dom.id
	}

	get textContent() {
		console.debug("get text content!")
		console.debug("element?", this instanceof Element)
		return getText(this._dom)
	}

	get innerHTML() {
		return getInnerHTML(this._dom)
	}
	get outerHTML() {
		return getOuterHTML(this._dom)
	}

	replaceWith(html) {
		if (html instanceof Element) {
			replaceElement(this._dom, html._dom)
			return
		}
		replaceElement(this._dom, parseDOMSync(html)[0])
	}
}

Document.parse = function documentParse(html) {
	return new Document(parseDOMSync(html))
}

class DocumentParser {
	constructor() {
		this.parser = parseDOMStreaming(this.onElement.bind(this))
		this.selectors = []
	}
	querySelector(selector, callback) {
		this.selectors.push({
			fn: css.compile(selector),
			callback
		})
	}
	onElement(elem) {
		let found = this.selectors.find((s) => s.fn(elem))
		if (found)
			found.callback(new Element(elem))
	}
	async parse(stream) {
		let fullyRead = false

		if (stream instanceof ReadableStream)
			stream = stream.getReader()

		while (!fullyRead) {
			const { done, value } = await stream.read()
			if (done) {
				fullyRead = true
				break
			}
			this.parser.write(Buffer.from(value))
		}
		this.parser.end()
		// console.debug("done parsing!", dom.attribs)
	}
}

Document.Parser = DocumentParser

module.exports = Document

function parseDOMSync(html) {
	let handler = new htmlparser.DomHandler()
	new htmlparser.Parser(handler)
		.end(html)
	return handler.dom
}

function parseDOMStreaming(elemCb) {
	let handler = new htmlparser.DomHandler(() => {
		console.debug("done parsing dom")
	}, undefined, (elem) => {
		console.debug("got an element!", elem.attribs)
		elemCb(elem)
	})
	return new WritableParser(handler)
}
