import { Settings } from './types';
export { Client, Keyring, ClientAuth, CsrSubject, SecretInfo, SecretInfoStorage, Settings, } from './types';
export { Lockr } from './Lockr';
export { FileSecretInfo } from './FileSecretInfo';
export interface CreateSettingsOptions {
    readonly cert_path?: string;
    readonly key_path?: string;
    readonly key_pw?: string;
    readonly hostname?: string;
}
export declare const createSettings: ({ cert_path, key_path, key_pw, hostname }?: CreateSettingsOptions) => Promise<Settings>;
