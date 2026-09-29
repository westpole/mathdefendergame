const PASSWORD_PREFIX = 'enc:v1:';
const ENCRYPTION_KEY = 'math-defender-store-password-key-v1';

/**
 * Converts a byte value into a two-character hexadecimal string.
 *
 * @param value - Byte value to encode.
 * @returns Two-character lowercase hexadecimal representation.
 */
function toHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}

/**
 * Parses a two-character hexadecimal pair from a string at a given index.
 *
 * @param hex - Source hexadecimal string.
 * @param startIndex - Starting index of the two-character pair.
 * @returns Parsed byte value as a number.
 */
function fromHexPair(hex: string, startIndex: number): number {
  return Number.parseInt(hex.slice(startIndex, startIndex + 2), 16);
}

/**
 * Applies repeating-key XOR to the provided byte array.
 *
 * @param data - Input bytes to transform.
 * @param key - Key bytes that repeat across the input.
 * @returns New byte array containing XOR output.
 */
function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  const output = new Uint8Array(data.length);

  for (let index = 0; index < data.length; index += 1) {
    output[index] = data[index] ^ key[index % key.length];
  }

  return output;
}

/**
 * Identifies whether a stored password uses the encrypted-at-rest format.
 *
 * @param storedPassword - Stored password value from profile state.
 * @returns True when the value starts with the known encryption prefix.
 */
export function isEncryptedPassword(storedPassword: string): boolean {
  return storedPassword.startsWith(PASSWORD_PREFIX);
}

/**
 * Encrypts a plaintext password into a deterministic encrypted-at-rest string.
 *
 * @param password - Plaintext password input.
 * @returns Encrypted password string with versioned prefix.
 */
export function encryptPassword(password: string): string {
  if (isEncryptedPassword(password)) {
    return password;
  }

  const passwordBytes = new TextEncoder().encode(password);
  const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
  const encryptedBytes = xorBytes(passwordBytes, keyBytes);
  const encryptedHex = Array.from(encryptedBytes, toHex).join('');

  return `${PASSWORD_PREFIX}${encryptedHex}`;
}

/**
 * Decrypts an encrypted-at-rest password back to plaintext.
 *
 * @param storedPassword - Stored profile password value.
 * @returns Plaintext password, original value for legacy plaintext, or null when malformed.
 */
export function decryptPassword(storedPassword: string): string | null {
  if (!isEncryptedPassword(storedPassword)) {
    return storedPassword;
  }

  const encryptedHex = storedPassword.slice(PASSWORD_PREFIX.length);

  if (encryptedHex.length % 2 !== 0) {
    return null;
  }

  const encryptedBytes = new Uint8Array(encryptedHex.length / 2);

  for (let index = 0; index < encryptedHex.length; index += 2) {
    const parsed = fromHexPair(encryptedHex, index);

    if (Number.isNaN(parsed)) {
      return null;
    }

    encryptedBytes[index / 2] = parsed;
  }

  const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
  const decryptedBytes = xorBytes(encryptedBytes, keyBytes);

  return new TextDecoder().decode(decryptedBytes);
}

/**
 * Compares a candidate plaintext password with a stored profile password value.
 *
 * @param candidatePassword - Plaintext password entered by the player.
 * @param storedPassword - Stored password from profile state.
 * @returns True when decrypted stored password equals the candidate.
 */
export function verifyPassword(candidatePassword: string, storedPassword: string): boolean {
  const decrypted = decryptPassword(storedPassword);

  if (decrypted === null) {
    return false;
  }

  return decrypted === candidatePassword;
}
