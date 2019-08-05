/// <reference types="node" />
import * as http2 from 'http2';
export interface CsrSubject {
    readonly country: string;
    readonly state: string;
    readonly locality: string;
    readonly organization: string;
}
export interface GraphQLQuery {
    query: string;
    variables?: {
        [name: string]: any;
    };
    operationName?: string;
}
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
