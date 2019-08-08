/// <reference types="node" />
import { Client, CsrSubject, SecretInfoStorage, Settings } from './types';
export declare class Lockr {
    private info;
    private settings;
    private _session?;
    constructor(settings: Settings, info: SecretInfoStorage);
    createCertClient(client_token: string, dn?: CsrSubject): Promise<{
        cert_text: string;
        key_text: string;
        env: string;
    }>;
    createPantheonClient(client_token: string): Promise<void>;
    getInfo(): Promise<Client>;
    createSecretValue(name: string, value: Buffer, label?: string, sovereignty?: string): Promise<string>;
    getSecretValue(name: string): Promise<Buffer>;
    deleteSecretValue(name: string): Promise<void>;
    generateKey(size?: number): Promise<Buffer>;
    exportSecretData(): Promise<string>;
    importSecretData(info_yaml: string): Promise<void>;
    close(): void;
    private query;
    private readonly session;
}
export default Lockr;
