import { expect } from 'chai'

const html = `
<html>
  <p something="yo">hello</p>
</html>
`

describe("Document", () => {
  it('exists', () => {
    expect(typeof Document).to.equal('function')
  })

  it("parses html into a queryable dom tree", function () {
    const dom = Document.parse(html)
    expect(dom).to.be.instanceof(Document)
    const p = dom.querySelector("p")
    expect(p).to.be.instanceof(Element)
    expect(p.getAttribute("something")).to.equal("yo")
  })

  it('can stringify a DOM', () => {
    const doc = Document.parse(html)
    expect(doc.documentElement.outerHTML).to.equal(html)
  })

  it('can replace elements', () => {
    const doc = Document.parse(html)
    doc.querySelector("p").replaceWith("<div>booya</div>")
    expect(doc.querySelector("div").textContent).to.equal("booya")
    expect(doc.querySelector("p")).to.equal(null)
  })

  it('can append elements', () => {
    const doc = Document.parse(html)
    doc.querySelector("p").appendChild("<div>booya</div>")
    const div = doc.querySelector("p div")
    expect(div.textContent).to.equal("booya")

    const span = doc.createElement("span")
    doc.appendChild(span)
    expect(doc.querySelector("html > span")).to.not.be.null
  })
})