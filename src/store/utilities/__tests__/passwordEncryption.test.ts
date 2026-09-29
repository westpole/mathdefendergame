import { describe, expect, it } from 'vitest';

import {
  decryptPassword,
  encryptPassword,
  isEncryptedPassword,
  verifyPassword,
} from '../passwordEncryption';

describe('passwordEncryption', () => {
  it('encrypts and decrypts passwords symmetrically', () => {
    const encrypted = encryptPassword('Abc12345');

    expect(encrypted).not.toBe('Abc12345');
    expect(isEncryptedPassword(encrypted)).toBe(true);
    expect(decryptPassword(encrypted)).toBe('Abc12345');
  });

  it('verifies both encrypted and legacy plaintext passwords', () => {
    expect(verifyPassword('Abc12345', encryptPassword('Abc12345'))).toBe(true);
    expect(verifyPassword('Abc12345', 'Abc12345')).toBe(true);
    expect(verifyPassword('Abc12345', 'Abc12344')).toBe(false);
  });

  it('rejects malformed encrypted values', () => {
    expect(decryptPassword('enc:v1:0')).toBeNull();
    expect(verifyPassword('Abc12345', 'enc:v1:zz')).toBe(false);
  });
});
