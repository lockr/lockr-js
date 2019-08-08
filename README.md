# lockr-client

Client for Lockr secrets management.

## Basic Usage

```ts
import {FileSecretInfo, Lockr}, lockr from 'lockr-client';

const settings = await lockr.createSettings({
  cert_path: './path/to/client.crt',
  key_path: './path/to/client.key',
});
const info = await FileSecretInfo.create('./lockr-secret-info.yml');
const client = new Lockr(settings, info);

// Gets info about this client. `env`, `label`, etc.
const clientInfo = await client.getInfo();

// Gets the value of a secret previously stored in Lockr.
const value = await client.getSecretValue('secret_name');
```
