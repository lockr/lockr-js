import { Settings } from './types';
export { Client, Keyring, ClientAuth, CsrSubject, SecretInfo, SecretInfoStorage, Settings, } from './types';
export { LockrClient } from './LockrClient';
export { Lockr } from './Lockr';
export interface CreateSettingsOptions {
    readonly cert_path?: string;
    readonly key_path?: string;
    readonly key_pw?: string;
    readonly hostname?: string;
}
export declare const createSettings: ({ cert_path, key_path, key_pw, hostname }?: CreateSettingsOptions) => Promise<Settings>;
