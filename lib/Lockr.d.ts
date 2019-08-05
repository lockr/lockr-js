/// <reference types="node" />
import LockrClient from './LockrClient';
import { Client, CsrSubject, SecretInfoStorage } from './types';
export default class Lockr {
    private client;
    private info;
    constructor(client: LockrClient, info: SecretInfoStorage);
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
}
