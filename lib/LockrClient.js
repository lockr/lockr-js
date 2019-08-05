"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http2 = require("http2");
const user_agent = `node/${process.version} LockrClient/0.1.0`;
class LockrClient {
    constructor(settings) {
        this.settings = settings;
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
        if (this._session !== void 0) {
            return this._session;
        }
        return http2.connect(this.settings.hostname, Object.assign({}, this.settings.options));
    }
}
exports.default = LockrClient;
