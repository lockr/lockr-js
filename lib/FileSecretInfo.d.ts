import { SecretInfo, SecretInfoStorage } from './types';
export declare class FileSecretInfo implements SecretInfoStorage {
    static createFromFile(path: string): Promise<FileSecretInfo>;
    private path;
    private data;
    constructor(path: string, data: {
        [name: string]: SecretInfo;
    });
    getSecretInfo(name: string): Promise<SecretInfo | undefined>;
    setSecretInfo(name: string, info: SecretInfo): Promise<void>;
    getAllSecretInfo(): Promise<{
        [name: string]: SecretInfo;
    }>;
}
