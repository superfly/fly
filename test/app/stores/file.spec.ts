import { expect, assert } from 'chai'
import { FileStore } from '../../../src/app/stores/file'


describe('FileStore', function () {
  const env = Object.assign({}, process.env);
  before(async function () {
    process.env = env
  })
  after(function (done) {
    process.env = env
    done()
  })

  describe('initialize', () => {
    it('throws error when bad working directory path is provided', async () => {
      assert.throws(() => new FileStore("badpath"), Error, /Could not find path/)
    })

    it('throws error if no code detected', async () => {
      assert.throws(() => new FileStore(__dirname), Error, /no code/)
    })

    // { noWatch: true } is needed to make sure tests exit
    it('loads app with no config file', async () => {
      let store = new FileStore(__dirname + '/testdata/no-config', { noWatch: true })
      expect(store.releaseInfo.config).to.eql({})
    })

    it('loads app with config file', async () => {
      let store = new FileStore(__dirname + '/testdata/config-no-secrets', { noWatch: true })
      expect(store.releaseInfo.app).to.equal("config-no-secrets")
    })

    it('interpolates secrets correctly', async () => {
      let store = new FileStore(__dirname + '/testdata/config-and-secrets', { noWatch: true })
      expect(store.releaseInfo.app).to.equal("config-and-secrets")
      expect(store.releaseInfo.config).to.eql({
        "option_a": "val_a",
        "password": "sekret"
      })
    })

    it('picks config environment', async () => {
      process.env.FLY_ENV = 'stage'
      let store = new FileStore(__dirname + '/testdata/config-multi-env', { noWatch: true })
      expect(store.releaseInfo.app).to.equal("config-multi-env")
      expect(store.releaseInfo.config).to.eql({
        "option_a": "val_a",
        "password": "sekret"
      })
      expect(store.releaseInfo.env).to.equal("stage")
    })
  })
})