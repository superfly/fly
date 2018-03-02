import { expect } from 'chai'

describe('Response', () => {
  it('can be instantiated', () => {
    expect(new Response('ahoyahoy')).not.to.throw
  })

  describe('cookies', () => {
    it('are parsed correctly', () => {
      const r = new Response('ahoyahoy', {
        headers: [
          [ 'Set-Cookie', 'id=a3fWa; Expires=Wed, 21 Oct 2025 07:28:00 GMT; Secure=true; HttpOnly=true'],
          [  'Set-Cookie', 'ahoyahoy=1']
        ]
      })

      expect(r.cookies.get('id').name).to.equal('id')
      expect(r.cookies.get('id').value).to.equal('a3fWa')
      expect(r.cookies.get('id').Expires).to.equal('Wed, 21 Oct 2025 07:28:00 GMT')
      expect(r.cookies.get('id').Secure).to.equal('true')
      expect(r.cookies.get('id').HttpOnly).to.equal('true')
      expect(r.cookies.get('ahoyahoy').name).to.equal('ahoyahoy')
      expect(r.cookies.get('ahoyahoy').value).to.equal('1')
      expect(r.cookies.get('badcookie')).to.be.null
    })
  })
})