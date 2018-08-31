import Database = require("better-sqlite3")
import { mkdirpSync } from "fs-extra";
import { DataStore, CollectionStore } from "./data_store";
import log from "./log";
import { Runtime } from "./runtime";
import * as Path from "path"

export class Collection implements CollectionStore {
  name: string
  db: Database

  constructor(db: Database, name: string) {
    this.db = db
    this.name = name
  }

  put(rt: Runtime, key: string, obj: string) {
    try {
      const info = this.db.prepare(`INSERT OR REPLACE INTO ${this.name} VALUES (?, ?)`).run(key, obj)
      return Promise.resolve(info.changes > 0)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  get(rt: Runtime, key: string) {
    try {
      const data = this.db.prepare(`SELECT obj FROM ${this.name} WHERE key == ?`).get(key)
      return Promise.resolve(data)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  del(rt: Runtime, key: string) {
    try {
      const info = this.db.prepare(`DELETE FROM ${this.name} WHERE key == ?`).run(key)
      return Promise.resolve(info.changes > 0)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

export class SQLiteDataStore implements DataStore {
  db: Database
  constructor(appName: string, env: string) {
    // FIXME: use correct cwd, for now: using default.
    mkdirpSync(Path.join(".fly", "data"))
    appName = appName.split(Path.sep).join("-") // useful in our own testing environment
    this.db = new Database(Path.join(".fly", "data", `${appName}-${env}.db`))
  }

  collection(rt: Runtime, name: string) {
    log.debug("creating coll (table) name:", name)
    try {
      this.db.prepare(`CREATE TABLE IF NOT EXISTS ${name} (key TEXT PRIMARY KEY NOT NULL, obj JSON NOT NULL)`).run()
      return Promise.resolve(new Collection(this.db, name))
    } catch (err) {
      log.error("error creating coll:", err)
      return Promise.reject(err)
    }
  }

  dropCollection(rt: Runtime, name: string) {
    log.debug("drop coll", name)
    try {
      this.db.prepare(`DROP TABLE IF EXISTS ${name}`).run()
      return Promise.resolve()
    } catch (err) {
      log.error("error creating coll:", err)
      return Promise.reject(err)
    }
  }
}