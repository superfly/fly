import { expect, assert } from 'chai'
import { FileAppStore } from '../src/file_app_store'
import { App } from '../src/app';


describe('FileAppStore', function () {
  const env = Object.assign({}, process.env);
  before(function () {
    process.env = env
  })
  after(function () {
    process.env = env
  })

  describe('initialize', function () {
    it('throws error when bad working directory path is provided', async () => {
      assert.throws(() => new FileAppStore("badpath"), Error, /Could not find path/)
    })

    it('throws error if no code detected', async () => {
      assert.throws(() => new FileAppStore(__dirname), Error, /no code/)
    })

    // { noWatch: true } is needed to make sure tests exit
    it('loads app with no config file', async () => {
      let store = new FileAppStore(__dirname + '/fixtures/apps/no-config', { noWatch: true })
      expect(store.release.config).to.eql({})
    })

    it('loads app with config file', async () => {
      let store = new FileAppStore(__dirname + '/fixtures/apps/config-no-secrets', { noWatch: true })
      expect(store.release.app).to.equal("config-no-secrets")
    })

    it('interpolates secrets correctly', async () => {
      let store = new FileAppStore(__dirname + '/fixtures/apps/config-and-secrets', { noWatch: true })
      expect(store.release.app).to.equal("config-and-secrets")
      expect(new App(store.release).config).to.eql({
        "option_a": "val_a",
        "password": "sekret"
      })
    })

    it('picks config environment', async () => {
      let store = new FileAppStore(__dirname + '/fixtures/apps/config-multi-env', { noWatch: true, env: 'stage' })
      expect(store.release.app).to.equal("config-multi-env")
      expect(new App(store.release).config).to.eql({
        "option_a": "val_a",
        "password": "sekret"
      })
      expect(store.release.env).to.equal("stage")
    })
  })
})