/// <reference types="node" />
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
export declare const Aes256CbcSha256Raw: KeyWrapper;
