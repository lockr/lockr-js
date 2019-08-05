import * as http2 from 'http2';

export interface Client {
  readonly env: string;
  readonly label: string;
  readonly keyring: Keyring;
  readonly auth: ClientAuth;
}

export interface Keyring {
  readonly id: string;
  readonly label: string;
  readonly hasCreditCard: boolean;
  readonly trialEnd?: string;
}

export interface ClientAuth {
  readonly expires?: string;
}

export interface CsrSubject {
  readonly country: string;
  readonly state: string;
  readonly locality: string;
  readonly organization: string;
}

export interface GraphQLQuery {
  query: string;
  variables?: {[name: string]: any};
  operationName?: string;
}

export interface SecretInfo {
  readonly wrapping_key: string;
}

export interface SecretInfoStorage {
  getSecretInfo(name: string): Promise<SecretInfo | undefined>;
  setSecretInfo(name: string, info: SecretInfo): Promise<void>;
  getAllSecretInfo(): Promise<{[name: string]: SecretInfo}>;
}

export interface Settings {
  readonly hostname: string;
  readonly options: http2.SecureClientSessionOptions;
}
