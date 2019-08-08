import * as http2 from 'http2';
import * as yaml from 'js-yaml';
import {md, pki} from 'node-forge';

import {Aes256CbcSha256Raw} from './key-wrapper';
import {
  Client,
  CsrSubject,
  GraphQLQuery,
  SecretInfoStorage,
  Settings,
} from './types';

const default_dn = {
  country: 'US',
  state: 'Washington',
  locality: 'Tacoma',
  organization: 'Lockr',
};

const user_agent = `node/${process.version} LockrClient/0.1.0`;

export class Lockr {
  private info: SecretInfoStorage;
  private settings: Settings;
  private _session?: http2.ClientHttp2Session;

  constructor(settings: Settings, info: SecretInfoStorage) {
    this.settings = settings;
    this.info = info;
  }

  public async createCertClient(
    client_token: string,
    dn: CsrSubject = default_dn,
  ): Promise<{cert_text: string, key_text: string, env: string}> {
    const key = await new Promise<pki.rsa.KeyPair>((res, rej) => {
      pki.rsa.generateKeyPair({bits: 2048}, (err, key) => {
        if (err) {
          rej(err);
        } else {
          res(key);
        }
      });
    });
    const csr = pki.createCertificationRequest();
    csr.setSubject([
      {name: 'C', value: dn.country},
      {name: 'ST', value: dn.state},
      {name: 'L', value: dn.locality},
      {name: 'O', value: dn.organization},
    ]);
    csr.publicKey = key.publicKey;
    csr.sign(key.privateKey, md.sha256.create());
    const csr_text = pki.certificationRequestToPem(csr);
    const query = `
    mutation CreateCertClient($input: CreateCertClient!) {
      createCertClient(input: $input) {
        env
        auth {
          ... on LockrCert {
            certText
          }
        }
      }
    }
    `;
    const resp = await this.query({
      query,
      variables: {
        input: {
          token: client_token,
          csrText: csr_text,
        },
      },
    });
    return {
      key_text: pki.privateKeyToPem(key.privateKey),
      cert_text: resp.createCertClient.auth.certText,
      env: resp.createCertClient.env,
    };
  }

  public async createPantheonClient(client_token: string): Promise<void> {
    const query = `
    mutation CreatePantheonClient($input: CreatePantheonClient!) {
      createPantheonClient(input: $input) {
        id
      }
    }
    `;
    await this.query({
      query,
      variables: {
        input: {
          token: client_token,
        },
      },
    });
  }

  public async getInfo(): Promise<Client> {
    const query = `
    {
      self {
        env
        label
        keyring {
          id
          label
          hasCreditCard
          trialEnd
        }
        auth {
          ... on LockrCert {
            expires
          }
        }
      }
    }
    `;
    return await this.query({query});
  }

  public async createSecretValue(
    name: string,
    value: Buffer,
    label?: string,
    sovereignty?: string,
  ): Promise<string> {
    const info = await this.info.getSecretInfo(name);
    const {ciphertext, wrapping_key} = await (info === void 0
      ? Aes256CbcSha256Raw.encrypt(value)
      : Aes256CbcSha256Raw.reencrypt(value, info.wrapping_key));
    const query = `
    mutation EnsureSecret($input: EnsureSecretValue!) {
      ensureSecretValue(input: $input) {
        id
      }
    }
    `;
    const [data, _] = await Promise.all([
      this.query({
        query,
        variables: {
          input: {
            name,
            label: label === void 0 ? '' : label,
            value: ciphertext.toString('base64'),
            sovereignty,
          },
        },
      }),
      this.info.setSecretInfo(name, {wrapping_key}),
    ]);
    return data.ensureSecretValue.id;
  }

  public async getSecretValue(name: string): Promise<Buffer> {
    const query = `
    query LatestSecretValue($name: String!) {
      self {
        secret(name: $name) {
          latest {
            value
          }
        }
      }
    }
    `;
    const [data, info] = await Promise.all([
      this.query({
        query,
        variables: {name},
      }),
      this.info.getSecretInfo(name),
    ]);
    let value = Buffer.from(data.self.secret.latest.value, 'base64');
    if (info !== void 0) {
      value = Aes256CbcSha256Raw.decrypt(value, info.wrapping_key);
    }
    return value;
  }

  public async deleteSecretValue(name: string): Promise<void> {
    const query = `
    mutation Delete($input: DeleteClientVersions!) {
      deleteClientVersions(input: $input)
    }
    `;
    await this.query({
      query,
      variables: {input: {secretName: name}},
    });
  }

  public async generateKey(size: number = 256): Promise<Buffer> {
    const query = `
    query RandomKey($size: KeySize) {
      randomKey(size: $size)
    }
    `;
    const data = await this.query({
      query,
      variables: {size: `AES${size}`},
    });
    return Buffer.from(data.randomKey, 'base64');
  }

  public async exportSecretData(): Promise<string> {
    const data = await this.info.getAllSecretInfo();
    return yaml.safeDump(data);
  }

  public async importSecretData(info_yaml: string): Promise<void> {
    const data = yaml.safeLoad(info_yaml);
    for (const [name, info] of data.entries()) {
      await this.info.setSecretInfo(name, info);
    }
  }

  public close(): void {
    if (this._session !== void 0) {
      this._session.close();
    }
  }

  private query(data: GraphQLQuery): Promise<any> {
    const body = JSON.stringify(data);
    const stream = this.session.request({
      ':method': 'POST',
      ':path': '/graphql',
      'accept': 'application/json',
      'user-agent': user_agent,
      'content-type': 'application/json',
      'content-length': body.length,
    });
    stream.end(body);
    return new Promise((res, rej) => {
      stream.on('response', (headers, flags) => {
        const chunks: Buffer[] = [];
        let len = 0;
        stream.on('data', chunk => {
          chunks.push(chunk);
          len += chunk.length;
        });
        stream.on('end', () => {
          const data = Buffer.concat(chunks, len).toString();
          try {
            const body = JSON.parse(data);
            const status = headers[':status'];
            if (status === void 0 || status >= 400) {
              rej(new Error(`Error status: ${status}`));
            } else {
              res(body.data);
            }
          } catch (e) {
            rej(e);
          }
        });
      });
    });
  }

  private get session(): http2.ClientHttp2Session {
    if (this._session === void 0) {
      this._session = http2.connect(`https://${this.settings.hostname}`, {
        ...this.settings.options,
      });
      this._session.on('error', err => {
        this._session = void 0;
      });
    }
    return this._session;
  }
}

export default Lockr;
