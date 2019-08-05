import test from 'ava';

import {Aes256CbcSha256Raw} from '../src/key-wrapper';

test('encrypts data', async t => {
    const text = Buffer.from('abcd');
    const {ciphertext, wrapping_key} = await Aes256CbcSha256Raw.encrypt(text);
    const plain = Aes256CbcSha256Raw.decrypt(ciphertext, wrapping_key);
    t.is(plain.toString(), text.toString());
});

test('reencrypts data', async t => {
    const init = Buffer.from('aaaa');
    const {wrapping_key} = await Aes256CbcSha256Raw.encrypt(init);
    const text = Buffer.from('abcd');
    const {ciphertext} = await Aes256CbcSha256Raw.reencrypt(text, wrapping_key);
    const plain = Aes256CbcSha256Raw.decrypt(ciphertext, wrapping_key);
    t.is(plain.toString(), text.toString());
});
