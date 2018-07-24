import { expect } from 'chai'

describe('FormData', () => {
  it('exists', () => {
    expect(typeof FormData).to.equal('function')
  })

  it('can be instantiated', () => {
    const fd = new FormData()
    expect(fd).to.be.instanceof(FormData)
  })

  it('can get/set params', () => {
    const fd = new FormData()
    fd.set('param1', 'value1234')
    expect(fd.get('param1')).to.equal('value1234')
  })

  it('can delete params', () => {
    const fd = new FormData()
    fd.set('param1', 'value1234')
    fd.set('param2', 'val431')
    fd.delete('param1')
    expect(fd.get('param1')).to.be.null
    expect(fd.get('param2')).to.not.be.null
  })

  it('can getAll/set/append params', () => {
    const fd = new FormData()
    fd.set('param1', 'value1234')
    fd.append('param1', 'morevals')
    fd.set('param2', 'val431')
    fd.append('param3', 'someval')
    fd.set('param3', 'override')

    expect(fd.getAll('param1')).to.eql(['value1234', 'morevals'])
    expect(fd.getAll('param2')).to.eql(['val431'])
    expect(fd.getAll('param3')).to.eql(['override'])
  })

  it('gracefully handle non-existant keys', () => {
    const fd = new FormData()

    expect(fd.getAll('badparam')).to.eql([])
    expect(fd.get('badparam2')).to.be.null
  })

  it('keys() are iterable', () => {
    const fd = new FormData()
    fd.set('param1', 'value1234')
    fd.set('param2', 'val431')


    // TODO: figure how to import `chai-iterator`
    // expect(fd.keys()).to.be.iterable
    // expect(fd.keys()).to.iterate.over(['param1', 'param2'])
    expect(fd.keys()).to.not.be.null
    expect(typeof fd.keys()[Symbol.iterator]).to.equal('function')

    let keys = []
    for(let key of fd.keys()) {
      keys.push(key)
    }
    expect(keys).to.eql(['param1', 'param2'])
  })

  it('values() are iterable', () => {
    const fd = new FormData()
    fd.set('param1', 'value1234')
    fd.append('param1', 'anothervalue')
    fd.set('param2', 'val431')


    expect(fd.values()).to.not.be.null
    expect(typeof fd.values()[Symbol.iterator]).to.equal('function')

    let values = []
    for(let val of fd.values()) {
      values.push(val)
    }
    expect(values).to.eql(['value1234', 'anothervalue', 'val431'])
  })

  it('entries() are iterable', () => {
    const fd = new FormData()
    fd.set('param1', 'value1234')
    fd.append('param1', 'anothervalue')
    fd.set('param2', 'val431')


    expect(fd.entries()).to.not.be.null
    expect(typeof fd.entries()[Symbol.iterator]).to.equal('function')

    let entries = []
    for(let entry of fd.entries()) {
      entries.push(entry)
    }
    expect(entries).to.eql([
      ['param1', ['value1234', 'anothervalue']],
      ['param2', ['val431']]
    ])
  })

  it('has()', () => {
    const fd = new FormData()
    fd.set('param1', 'value1234')

    expect(fd.has('param1')).to.be.true
    expect(fd.has('badkey')).to.be.false
  })

  describe('toString()', () => {
    it('returns empty string', () => {
      const fd = new FormData()
      expect(fd.toString()).to.be.empty
    })

    it('stringifies simple params', () => {
      const fd = new FormData()
      fd.append('param1', 'value1')
      fd.append('param2', 'value2')
      expect(fd.toString()).to.equal('param1=value1&param2=value2')
    })

    it('escapes special symbols', () => {
      const fd = new FormData()
      fd.append('w', '中文')
      fd.append('foo', 'bar')
      expect(fd.toString()).to.equal('w=%E4%B8%AD%E6%96%87&foo=bar')
    })
  })
})
