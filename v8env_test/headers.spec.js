import { expect } from 'chai'

describe('Headers', () => {
  it('exist', () => {
    expect(typeof Headers).to.equal('function')
  })

  it('can be instantiated', () => {
    const hs = new Headers()
    expect(hs).to.be.instanceof(Headers)
  })

  it('can be filled with Object', () => {
    const headers = {
      'Content-Type': 'text/xml',
      'Breaking-Bad': '<3'
    }
    const hs = new Headers(headers)
    expect(hs.get('Content-Type')).to.equal('text/xml')
    expect(hs.get('Breaking-Bad')).to.equal('<3')
  })

  it('can be filled with Object (multi-headers)', () => {
    const headers = {
      'Content-Type': 'text/xml',
      'Breaking-Bad': ['<3', 'yeah']
    }
    const hs = new Headers(headers)
    expect(hs.get('Content-Type')).to.equal('text/xml')
    expect(hs.get('Breaking-Bad')).to.equal('<3, yeah')
  })


  it('can be filled with Array', () => {
    const headers = [
      ['Content-Type', 'text/xml'],
      ['Breaking-Bad', '<3'],
      ['Breaking-Bad', 'yeah']
    ]
    const hs = new Headers(headers)
    expect(hs.get('Content-Type')).to.equal('text/xml')
    expect(hs.get('Breaking-Bad')).to.equal('<3, yeah')
  })

  it('are iterable', () => {
    const hs = new Headers()
    hs.set('Content-Type', 'text/xml')
    hs.set('Breaking-Bad', '<3')


    // TODO: figure how to import `chai-iterator`
    // expect(h).to.be.iterable
    // expect(h).to.iterate.over([['Content-Type', 'text/xml'], ['Breaking-Bad', '<3']])
    expect(hs).to.not.be.null
    expect(typeof hs[Symbol.iterator]).to.equal('function')

    let hpairs = []
    for(let hpair of hs) {
      hpairs.push(hpair)
    }
    expect(hpairs).to.eql([['content-type', 'text/xml'], ['breaking-bad', '<3']])
  })

  it('can get/set params', () => {
    const hs = new Headers()
    hs.set('My-Custom-Header', 'value1234')
    expect(hs.get('My-Custom-Header')).to.equal('value1234')
  })

  it('can delete params', () => {
    const hs = new Headers()
    hs.set('Content-Type', 'text/plain')
    hs.set('Server', 'Fly.io')
    hs.delete('Content-Type')
    expect(hs.get('Content-Type')).to.be.null
    expect(hs.get('Server')).to.not.be.null
  })

  it('can get/set/append params', () => {
    const hs = new Headers()
    hs.set('Vary', 'Current-Org-Id')
    hs.append('Vary', 'User-Logged-In')
    hs.set('Server', 'Fly.io')
    hs.append('X-Cache', 'HIT')
    hs.set('X-Cache', 'REFRESH')

    expect(hs.get('Vary')).to.eql('Current-Org-Id, User-Logged-In')
    expect(hs.get('Server')).to.eql('Fly.io')
    expect(hs.get('X-Cache')).to.eql('REFRESH')
  })

  it('gracefully handle non-existant keys', () => {
    const hs = new Headers()

    expect(hs.get('Bad-Header-2')).to.be.null
  })

  it('has()', () => {
    const hs = new Headers()
    hs.set('Server', 'Fly.io')

    expect(hs.has('Server')).to.be.true
    expect(hs.has('Bad-Header')).to.be.false
  })
})
