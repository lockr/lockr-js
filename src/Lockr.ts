import {md, pki} from 'node-forge';

import LockrClient from './LockrClient';
import {CsrSubject, SecretInfoStorage} from './types';

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
}
