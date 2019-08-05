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
const crypto = require("crypto");
exports.Aes256CbcSha256Raw = (() => {
    const prefix = '$2$';
    const method = 'aes-256-cbc';
    const key_len = 32;
    const iv_len = 16;
    const hmac_key_len = 32;
    const doHmac = (iv, ct, key) => {
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(prefix);
        hmac.update(method);
        hmac.update(iv);
        hmac.update(ct);
        return hmac.digest();
    };
    const splitKey = (key) => {
        const hash = crypto.createHash('sha512');
        hash.update(key);
        const buf = hash.digest();
        return [buf.slice(0, key_len), buf.slice(key_len)];
    };
    const doEncrypt = (plain, key, iv) => {
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
        encrypt(plain) {
            return __awaiter(this, void 0, void 0, function* () {
                const key = yield randomBytes(key_len);
                const iv = yield randomBytes(iv_len);
                return doEncrypt(plain, key, iv);
            });
        },
        reencrypt(plain, wrapping_key) {
            return __awaiter(this, void 0, void 0, function* () {
                wrapping_key = wrapping_key.slice(prefix.length);
                const key = Buffer.from(wrapping_key, 'base64');
                const iv = yield randomBytes(16);
                return doEncrypt(plain, key, iv);
            });
        },
        decrypt(ct, wrapping_key) {
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
const randomBytes = (n) => {
    return new Promise((res, rej) => {
        crypto.randomBytes(n, (err, buf) => {
            if (err) {
                rej(err);
            }
            else {
                res(buf);
            }
        });
    });
};
