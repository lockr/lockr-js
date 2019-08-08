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
const http2 = require("http2");
const yaml = require("js-yaml");
const node_forge_1 = require("node-forge");
const key_wrapper_1 = require("./key-wrapper");
const default_dn = {
    country: 'US',
    state: 'Washington',
    locality: 'Tacoma',
    organization: 'Lockr',
};
const user_agent = `node/${process.version} LockrClient/0.1.0`;
class Lockr {
    constructor(settings, info) {
        this.settings = settings;
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
            const resp = yield this.query({
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
    createPantheonClient(client_token) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
    mutation CreatePantheonClient($input: CreatePantheonClient!) {
      createPantheonClient(input: $input) {
        id
      }
    }
    `;
            yield this.query({
                query,
                variables: {
                    input: {
                        token: client_token,
                    },
                },
            });
        });
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
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
            return yield this.query({ query });
        });
    }
    createSecretValue(name, value, label, sovereignty) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield this.info.getSecretInfo(name);
            const { ciphertext, wrapping_key } = yield (info === void 0
                ? key_wrapper_1.Aes256CbcSha256Raw.encrypt(value)
                : key_wrapper_1.Aes256CbcSha256Raw.reencrypt(value, info.wrapping_key));
            const query = `
    mutation EnsureSecret($input: EnsureSecretValue!) {
      ensureSecretValue(input: $input) {
        id
      }
    }
    `;
            const [data, _] = yield Promise.all([
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
                this.info.setSecretInfo(name, { wrapping_key }),
            ]);
            return data.ensureSecretValue.id;
        });
    }
    getSecretValue(name) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const [data, info] = yield Promise.all([
                this.query({
                    query,
                    variables: { name },
                }),
                this.info.getSecretInfo(name),
            ]);
            let value = Buffer.from(data.self.secret.latest.value, 'base64');
            if (info !== void 0) {
                value = key_wrapper_1.Aes256CbcSha256Raw.decrypt(value, info.wrapping_key);
            }
            return value;
        });
    }
    deleteSecretValue(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
    mutation Delete($input: DeleteClientVersions!) {
      deleteClientVersions(input: $input)
    }
    `;
            yield this.query({
                query,
                variables: { input: { secretName: name } },
            });
        });
    }
    generateKey(size = 256) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
    query RandomKey($size: KeySize) {
      randomKey(size: $size)
    }
    `;
            const data = yield this.query({
                query,
                variables: { size: `AES${size}` },
            });
            return Buffer.from(data.randomKey, 'base64');
        });
    }
    exportSecretData() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.info.getAllSecretInfo();
            return yaml.safeDump(data);
        });
    }
    importSecretData(info_yaml) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yaml.safeLoad(info_yaml);
            for (const [name, info] of data.entries()) {
                yield this.info.setSecretInfo(name, info);
            }
        });
    }
    close() {
        if (this._session !== void 0) {
            this._session.close();
        }
    }
    query(data) {
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
                const chunks = [];
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
                        }
                        else {
                            res(body.data);
                        }
                    }
                    catch (e) {
                        rej(e);
                    }
                });
            });
        });
    }
    get session() {
        if (this._session === void 0) {
            this._session = http2.connect(`https://${this.settings.hostname}`, Object.assign({}, this.settings.options));
            this._session.on('error', err => {
                this._session = void 0;
            });
        }
        return this._session;
    }
}
exports.Lockr = Lockr;
exports.default = Lockr;
