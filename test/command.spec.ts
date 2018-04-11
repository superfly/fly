import { expect, assert } from 'chai'
import { root, getToken } from '../src/cmd/root';

describe('Commman Tests', () => {
  describe('All apps options and commands work', () => {
    expect(testWith(['', '', 'apps'])).not.to.throw
    expect(testWith(['', '', 'apps', 'create', 'foo']).name).to.equal('foo')

    expect(() => testWith(['', '', 'server', 'create', 'foo'])).to.throw()
  })
  describe('All orgs options and commands work', () => {
    expect(testWith(['', '', 'orgs'])).not.to.throw
  })
  describe('All deploy options and commands work', () => {
    expect(testWith(['', '', 'deploy'])).not.to.throw
  })
  describe('All releases options and commands work', () => {
    expect(testWith(['', '', 'releases'])).not.to.throw
  })
  describe('All secrets options and commands work', () => {
    expect(testWith(['', '', 'secrets'])).not.to.throw
    expect(testWith(['', '', 'secrets', 'set', 'foo']).key).to.equal('foo')
    expect(testWith(['', '', 'secrets', '--from-file', 'foo']).filename).to.equal('foo')

    expect(() => testWith(['', '', 'server', 'set', 'foo'])).to.throw()
    expect(() => testWith(['', '', 'server', '--from-file', 'foo'])).to.throw()
  })
  describe('All test options and commands work', () => {
    expect(testWith(['', '', 'test'])).not.to.throw
    expect(testWith(['', '', 'test', '--path', 'foo']).path).to.equal('foo')

    expect(() => testWith(['', '', 'server', '--path', 'foo'])).to.throw()
  })
  describe('All server options and commands work', () => {
    expect(testWith(['', '', 'server'])).not.to.throw
    expect(testWith(['', '', 'server', '--port', 'foo']).port).to.equal('foo')
    expect(testWith(['', '', 'server', '--uglify']).uglify).to.equal(true)
    expect(testWith(['', '', 'server', '--inspect']).inspect).to.equal(true)

    expect(() => testWith(['', '', 'secrets', '--port', 'foo'])).to.throw()
    expect(() => testWith(['', '', 'secrets', '--uglify'])).to.throw()
    expect(() => testWith(['', '', 'secrets', '--inspect'])).to.throw()
  })
  describe('All hostnames options and commands work', () => {
    expect(testWith(['', '', 'hostnames'])).not.to.throw
    expect(testWith(['', '', 'hostnames', 'add', 'foo']).hostname).to.equal('foo')

    expect(() => testWith(['', '', 'server', 'add', 'foo'])).to.throw()
  })
  describe('All login options and commands work', () => {
    expect(() => testWith(['', '', 'login'])).not.to.throw
  })
  describe('All fetch options and commands work', () => {
    expect(() => testWith(['', '', 'fetch'])).not.to.throw
  })
  describe('All logs options and commands work', () => {
    expect(() => testWith(['', '', 'logs'])).not.to.throw
  })
})

function testWith(args:string[]) {
  require("../src/cmd/apps");
  require("../src/cmd/orgs");
  require("../src/cmd/deploy");
  require("../src/cmd/releases");
  require("../src/cmd/secrets");
  require("../src/cmd/test");
  require("../src/cmd/server");
  require("../src/cmd/hostnames");
  require("../src/cmd/login");
  require("../src/cmd/fetch");
  require("../src/cmd/logs");

  root.setArgs(args)
  return root.getOptions(false, true)
}
