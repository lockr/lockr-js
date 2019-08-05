import * as fs from 'fs';
import * as http2 from 'http2';
import * as tls from 'tls';

import {Settings} from './types';

export {
  Client,
  Keyring,
  ClientAuth,
  CsrSubject,
  SecretInfo,
  SecretInfoStorage,
  Settings,
} from './types';
export {Lockr} from './Lockr';

export interface CreateSettingsOptions {
  readonly cert_path?: string;
  readonly key_path?: string;
  readonly key_pw?: string;
  readonly hostname?: string;
}

export const createSettings = async (
  {cert_path, key_path, key_pw, hostname}: CreateSettingsOptions,
): Promise<Settings> => {
  const options: http2.SecureClientSessionOptions = {};
  if (cert_path !== void 0 && key_path !== void 0) {
    const [cert, key] = await Promise.all([
      readFile(cert_path),
      readFile(key_path),
    ]);
    options.secureContext = tls.createSecureContext({
      cert,
      key,
      passphrase: key_pw,
    });
  }
  return {
    hostname: hostname || 'api.lockr.io',
    options,
  };
};

const readFile = (path: string): Promise<Buffer> => {
  return new Promise((res, rej) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        rej(err);
      } else {
        res(data);
      }
    });
  });
};
