import { Buffer } from 'buffer';

// Simple SHA-256 implementation on string (using Web Crypto API or simple js logic)
// Since we are running in browser environment, window.crypto.subtle works perfectly and is standard.
export const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generates a random salt (hex string)
export const generateSalt = () => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Creates a salted hash for a key-value pair
 */
export const hashField = async (key, value, salt) => {
  return await sha256(`${key}:${value}:${salt}`);
};

/**
 * Generates the root hash for a set of fields
 * @param {Object} fields - { name: 'John', gpa: '3.9', ... }
 * @returns {Promise<Object>} - { rootHash, salts: { field: salt }, fieldHashes: { field: hash } }
 */
export const createVerifiablePayload = async (fields) => {
  const salts = {};
  const fieldHashes = {};
  const keys = Object.keys(fields).sort(); // Sort keys to guarantee deterministic order

  for (const key of keys) {
    salts[key] = generateSalt();
    fieldHashes[key] = await hashField(key, fields[key], salts[key]);
  }

  // Combine hashes to generate the root hash
  const combinedString = keys.map(k => fieldHashes[k]).join('|');
  const rootHash = await sha256(combinedString);

  return {
    rootHash,
    salts,
    fieldHashes
  };
};

/**
 * Verifies if the disclosed fields match the root hash
 * @param {string} rootHash - The on-chain root hash
 * @param {Object} disclosedFields - { name: 'John' }
 * @param {Object} disclosedSalts - { name: 'salt1' }
 * @param {Object} hiddenFieldHashes - { gpa: 'hash_of_gpa' }
 * @returns {Promise<boolean>}
 */
export const verifySelectiveDisclosure = async (rootHash, disclosedFields, disclosedSalts, hiddenFieldHashes) => {
  const keys = [...Object.keys(disclosedFields), ...Object.keys(hiddenFieldHashes)].sort();
  const calculatedHashes = [];

  for (const key of keys) {
    if (disclosedFields[key] !== undefined) {
      const hash = await hashField(key, disclosedFields[key], disclosedSalts[key]);
      calculatedHashes.push(hash);
    } else {
      calculatedHashes.push(hiddenFieldHashes[key]);
    }
  }

  const combinedString = calculatedHashes.join('|');
  const calculatedRoot = await sha256(combinedString);

  return calculatedRoot === rootHash;
};
