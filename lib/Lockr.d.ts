import LockrClient from './LockrClient';
import { CsrSubject, SecretInfoStorage } from './types';
export default class Lockr {
    private client;
    private info;
    constructor(client: LockrClient, info: SecretInfoStorage);
    createCertClient(client_token: string, dn?: CsrSubject): Promise<{
        cert_text: string;
        key_text: string;
        env: string;
    }>;
}
