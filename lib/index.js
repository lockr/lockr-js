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
const fs = require("fs");
const tls = require("tls");
exports.createSettings = ({ cert_path, key_path, key_pw, hostname }) => __awaiter(this, void 0, void 0, function* () {
    const options = {};
    if (cert_path !== void 0 && key_path !== void 0) {
        const [cert, key] = yield Promise.all([
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
});
const readFile = (path) => {
    return new Promise((res, rej) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                rej(err);
            }
            else {
                res(data);
            }
        });
    });
};
