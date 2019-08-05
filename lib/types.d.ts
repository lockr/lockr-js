/// <reference types="node" />
import * as http2 from 'http2';
export interface SecretInfo {
    readonly wrapping_key: string;
}
export interface SecretInfoStorage {
    getSecretInfo(name: string): Promise<SecretInfo>;
    setSecretInfo(name: string, info: SecretInfo): Promise<void>;
    getAllSecretInfo(): Promise<{
        [name: string]: SecretInfo;
    }>;
}
export interface Settings {
    readonly hostname: string;
    readonly options: http2.SecureClientSessionOptions;
}
