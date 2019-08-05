"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_forge_1 = require("node-forge");
const default_dn = {
    country: 'US',
    state: 'Washington',
    locality: 'Tacoma',
    organization: 'Lockr',
};
class Lockr {
    constructor(client, info) {
        this.client = client;
        this.info = info;
    }
    createCertClient(client_token, dn = default_dn) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = yield new Promise((res, rej) => {
                node_forge_1.pki.rsa.generateKeyPair({ bits: 2048 }, (err, key) => {
                    if (err) {
                        rej(err);
                    }
                    else {
                        res(key);
                    }
                });
            });
            const csr = node_forge_1.pki.createCertificationRequest();
            csr.setSubject([
                { name: 'C', value: dn.country },
                { name: 'ST', value: dn.state },
                { name: 'L', value: dn.locality },
                { name: 'O', value: dn.organization },
            ]);
            csr.publicKey = key.publicKey;
            csr.sign(key.privateKey, node_forge_1.md.sha256.create());
            const csr_text = node_forge_1.pki.certificationRequestToPem(csr);
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
            const resp = yield this.client.query({
                query,
                variables: {
                    input: {
                        token: client_token,
                        csrText: csr_text,
                    },
                },
            });
            return {
                key_text: node_forge_1.pki.privateKeyToPem(key.privateKey),
                cert_text: resp.createCertClient.auth.certText,
                env: resp.createCertClient.env,
            };
        });
    }
}
exports.default = Lockr;
