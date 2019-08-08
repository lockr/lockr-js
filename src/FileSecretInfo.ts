import * as fs from 'fs';

import * as yaml from 'js-yaml';

import {SecretInfo, SecretInfoStorage} from './types';

export class FileSecretInfo implements SecretInfoStorage {
  public static async createFromFile(path: string): Promise<FileSecretInfo> {
    const content = await new Promise<string>((res, rej) => {
      fs.readFile(path, {encoding: 'utf-8'}, (err, content) => {
        if (err) {
          rej(err);
        } else {
          res(content);
        }
      });
    });
    return new FileSecretInfo(path, yaml.safeLoad(content));
  }

  private path: string;
  private data: {[name: string]: SecretInfo};

  constructor(path: string, data: {[name: string]: SecretInfo}) {
    this.path = path;
    this.data = data;
  }

  public getSecretInfo(name: string): Promise<SecretInfo | undefined> {
    return Promise.resolve(this.data[name]);
  }

  public async setSecretInfo(name: string, info: SecretInfo): Promise<void> {
    this.data[name] = info;
    await new Promise((res, rej) => {
      fs.writeFile(this.path, yaml.safeDump(this.data), err => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    });
  }

  public getAllSecretInfo(): Promise<{[name: string]: SecretInfo}> {
    return Promise.resolve(this.data);
  }
}
