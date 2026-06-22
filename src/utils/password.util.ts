import bcrypt from 'bcrypt';

/**
 * bcrypt work factor.
 * 12 is currently considered a good balance between security and server performance.
 * It takes roughly 250-500ms per hash depending on hardware.
 */
const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param password The plaintext password to hash
 * @returns A Promise resolving to the hashed string
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Securely compares a plaintext password against a hash.
 *
 * @param password The plaintext password provided during login
 * @param hash The bcrypt hash stored in the database
 * @returns A Promise resolving to a boolean indicating a match
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
