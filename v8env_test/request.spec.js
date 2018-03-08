import { expect } from 'chai'

describe('Request', () => {
  it('can be instantiated', () => {
    expect(new Request('http://example.com')).not.to.throw
  })

  it('sets body properly from intializing request', () => {
    const r = new Request('https://example.com', { body: 'ahoyhoy', method: 'post'})
    const req = new Request(r)

    expect(req.bodySource).to.eq(r.bodySource)
  })

  describe('cookies', () => {
    it('are parsed correctly', () => {
      const r = new Request('https://example.com', {
        headers: {
          'Cookie': 'id=a3fWa; ahoyahoy=1; logged_in=true'
        }
      })

      expect(r.cookies.get('id').name).to.equal('id')
      expect(r.cookies.get('id').value).to.equal('a3fWa')
      expect(r.cookies.get('ahoyahoy').name).to.equal('ahoyahoy')
      expect(r.cookies.get('ahoyahoy').value).to.equal('1')
      expect(r.cookies.get('badcookie')).to.be.null
    })
  })
})