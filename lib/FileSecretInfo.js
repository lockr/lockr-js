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
const yaml = require("js-yaml");
class FileSecretInfo {
    static createFromFile(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield new Promise((res, rej) => {
                fs.readFile(path, { encoding: 'utf-8' }, (err, content) => {
                    if (err) {
                        rej(err);
                    }
                    else {
                        res(content);
                    }
                });
            });
            return new FileSecretInfo(path, yaml.safeLoad(content));
        });
    }
    constructor(path, data) {
        this.path = path;
        this.data = data;
    }
    getSecretInfo(name) {
        return Promise.resolve(this.data[name]);
    }
    setSecretInfo(name, info) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data[name] = info;
            yield new Promise((res, rej) => {
                fs.writeFile(this.path, yaml.safeDump(this.data), err => {
                    if (err) {
                        rej(err);
                    }
                    else {
                        res();
                    }
                });
            });
        });
    }
    getAllSecretInfo() {
        return Promise.resolve(this.data);
    }
}
exports.FileSecretInfo = FileSecretInfo;
