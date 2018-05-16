import * as path from 'path';
import * as YAML from 'js-yaml';
import * as fs from 'fs-extra';
import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import * as glob from 'glob';

import log from '../log';
import { Release } from '../app';

const secretsFile = '.fly.secrets.yml';
const configFile = '.fly.yml';

const releases: { [key: string]: LocalRelease } = {};

export interface LocalReleaseOptions {
  noWatch?: boolean;
}

export function getLocalRelease(
  cwd: string = process.cwd(),
  env: string = getEnv(),
  options: LocalReleaseOptions = {}
) {
  const key = `${cwd}:${env}:${JSON.stringify(options)}`;
  if (releases[key]) {
    return releases[key];
  }
  const release = new LocalRelease(cwd, env, options);
  releases[key] = release;
  return release;
}

export interface FlyConfig {
  app?: string;
  app_id?: string; // legacy
  config?: any;
  files?: string[];
}

export class LocalRelease extends EventEmitter implements Release {
  cwd: string;
  env: string;

  app: string;
  version: number;
  source: string;
  source_hash: string;
  source_map?: string;
  hash?: string;
  config: any;
  secrets: any;
  files: string[];

  constructor(
    cwd: string = process.cwd(),
    env: string = getEnv(),
    options: LocalReleaseOptions = {}
  ) {
    super();
    this.cwd = cwd;
    this.env = env || getEnv();

    const conf = this.getConfig();
    this.config = conf.config || {};
    this.secrets = this.getSecrets();

    this.app = conf.app || conf.app_id || cwd;
    this.version = 0;
    this.source = '';
    this.hash = '';
    this.source_hash = '';
    this.files = [];

    this.getFiles();

    if (!options.noWatch) this.watchConfig();
  }

  getConfig(): FlyConfig {
    const localConfigPath = path.join(this.cwd, configFile);
    let config: any = {};
    if (fs.existsSync(localConfigPath)) {
      config = YAML.load(fs.readFileSync(localConfigPath).toString());
    }

    config = config[this.env] || config || {};
    config.app = config.app_id || config.app;

    return config;
  }

  getSecrets() {
    const localSecretsPath = path.join(this.cwd, secretsFile);
    let secrets = {};

    if (fs.existsSync(localSecretsPath))
      secrets = YAML.load(fs.readFileSync(localSecretsPath).toString());

    return secrets;
  }

  watchConfig() {
    const watcher = chokidar.watch([configFile, secretsFile], {
      cwd: this.cwd
    });
    watcher.on('add', this.update.bind(this, 'add'));
    watcher.on('change', this.update.bind(this, 'change'));
  }

  update(event: string, path: string) {
    log.info(`Config watch (${event}: ${path})`);
    if (path.endsWith(configFile)) {
      const conf = this.getConfig();
      this.config = conf.config;
      this.app = conf.app || conf.app_id || '';
      this.getFiles();
    } else if (path.endsWith(secretsFile)) {
      this.secrets = this.getSecrets();
    }
    this.emit('update', this);
  }

  private getFiles() {
    const conf = this.getConfig();
    if (conf.files)
      conf.files.forEach(file => {
        if (!this.isIn(this.files, file)) this.files.push(file);
      });

    this.files.forEach(file => {
      glob(this.cwd + '/' + file, {}, (error, filesFound) => {
        if (error) throw error;

        filesFound.map(e => this.removePrefix(e)).forEach(file => {
          if (!this.isIn(this.files, file)) this.files.push(file);
        });
      });
    });
  }

  private isIn(array: string[], name: string) {
    array.forEach(e => {
      if (e === name) return true;
    });
    return false;
  }

  private removePrefix(file: string) {
    return file.replace(this.cwd + '/', '').replace('./', '');
  }
}

export function getEnv() {
  return process.env.FLY_ENV || process.env.NODE_ENV || 'development';
}
