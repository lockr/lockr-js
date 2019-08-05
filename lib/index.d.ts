import { Settings } from './types';
export interface CreateSettingsOptions {
    readonly cert_path?: string;
    readonly key_path?: string;
    readonly key_pw?: string;
    readonly hostname?: string;
}
export declare const createSettings: ({ cert_path, key_path, key_pw, hostname }: CreateSettingsOptions) => Promise<Settings>;
