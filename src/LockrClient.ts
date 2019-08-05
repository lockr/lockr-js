import * as http2 from 'http2';

import {GraphQLQuery, Settings} from './types';

const user_agent = `node/${process.version} LockrClient/0.1.0`;

export class LockrClient {
  private settings: Settings;
  private _session?: http2.ClientHttp2Session;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  public close(): void {
    if (this._session !== void 0) {
      this._session.close();
    }
  }

  public query(data: GraphQLQuery): Promise<any> {
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
    if (this._session !== void 0) {
      return this._session;
    }
    return http2.connect(`https://${this.settings.hostname}`, {
      ...this.settings.options,
    });
  }
}

export default LockrClient;
