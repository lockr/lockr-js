import {md, pki} from 'node-forge';

import {Aes256CbcSha256Raw} from './key-wrapper';
import LockrClient from './LockrClient';
import {Client, CsrSubject, SecretInfoStorage} from './types';

const default_dn = {
  country: 'US',
  state: 'Washington',
  locality: 'Tacoma',
  organization: 'Lockr',
};

export default class Lockr {
  private client: LockrClient;
  private info: SecretInfoStorage;

  constructor(client: LockrClient, info: SecretInfoStorage) {
    this.client = client;
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
    const resp = await this.client.query({
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
    await this.client.query({
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
    return await this.client.query({query});
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
      this.client.query({
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
      this.client.query({
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
}
