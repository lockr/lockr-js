import * as crypto from 'crypto';

export interface Cipherdata {
  readonly ciphertext: Buffer;
  readonly wrapping_key: string;
}

export interface KeyWrapper {
  readonly prefix: string;
  encrypt(plain: Buffer): Promise<Cipherdata>;
  reencrypt(plain: Buffer, wrapping_key: string): Promise<Cipherdata>;
  decrypt(cipher: Buffer, wrapping_key: string): Buffer;
}

export const Aes256CbcSha256Raw: KeyWrapper = (() => {
  const prefix = '$2$';
  const method = 'aes-256-cbc';
  const key_len = 32;
  const iv_len = 16;
  const hmac_key_len = 32;

  const doHmac = (iv: Buffer, ct: Buffer, key: Buffer): Buffer => {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(prefix);
    hmac.update(method);
    hmac.update(iv);
    hmac.update(ct);
    return hmac.digest();
  };

  const splitKey = (key: Buffer): [Buffer, Buffer] => {
    const hash = crypto.createHash('sha512');
    hash.update(key);
    const buf = hash.digest();
    return [buf.slice(0, key_len), buf.slice(key_len)];
  };

  const doEncrypt = (plain: Buffer, key: Buffer, iv: Buffer): Cipherdata => {
    const [enc_key, hmac_key] = splitKey(key);
    const cipher = crypto.createCipheriv(method, enc_key, iv);
    const up_buf = cipher.update(plain);
    const fin_buf = cipher.final();
    const ct_len = up_buf.length + fin_buf.length;
    const ct = Buffer.concat([up_buf, fin_buf], ct_len);
    const hmac = doHmac(iv, ct, hmac_key);
    const total_len = iv.length + ct.length + hmac.length;
    return {
      ciphertext: Buffer.concat([iv, ct, hmac], total_len),
      wrapping_key: prefix + key.toString('base64'),
    };
  };

  return {
    prefix,
    async encrypt(plain: Buffer): Promise<Cipherdata> {
      const key = await randomBytes(key_len);
      const iv = await randomBytes(iv_len);
      return doEncrypt(plain, key, iv);
    },
    async reencrypt(plain: Buffer, wrapping_key: string): Promise<Cipherdata> {
      wrapping_key = wrapping_key.slice(prefix.length);
      const key = Buffer.from(wrapping_key, 'base64');
      const iv = await randomBytes(16);
      return doEncrypt(plain, key, iv);
    },
    decrypt(ct: Buffer, wrapping_key: string): Buffer {
      wrapping_key = wrapping_key.slice(prefix.length);
      const [enc_key, hmac_key] = splitKey(Buffer.from(wrapping_key, 'base64'));
      const iv = ct.slice(0, iv_len);
      const hmac0 = ct.slice(-hmac_key_len);
      ct = ct.slice(iv_len, -hmac_key_len);
      const hmac1 = doHmac(iv, ct, hmac_key);
      if (!crypto.timingSafeEqual(hmac0, hmac1)) {
        throw new Error('HMAC validation failed');
      }
      const cipher = crypto.createDecipheriv(method, enc_key, iv);
      const up_buf = cipher.update(ct);
      const fin_buf = cipher.final();
      const plain_len = up_buf.length + fin_buf.length;
      return Buffer.concat([up_buf, fin_buf], plain_len);
    },
  };
})();

const randomBytes = (n: number): Promise<Buffer> => {
  return new Promise((res, rej) => {
    crypto.randomBytes(n, (err, buf) => {
      if (err) {
        rej(err);
      } else {
        res(buf);
      }
    });
  });
};
