/**
 * Abstracts a raw cryptographic hash into a masked, user-friendly format.
 * Example: '0xABCD••••••••1234'
 * 
 * @param {string} hash - The raw hash string (e.g., IPFS CID or SHA-256 hash).
 * @param {number} prefixLength - Number of characters to show at the start.
 * @param {number} suffixLength - Number of characters to show at the end.
 * @returns {string} - The masked hash.
 */
export const abstractHash = (hash, prefixLength = 6, suffixLength = 6) => {
  if (!hash) return '';
  if (hash.length <= prefixLength + suffixLength) return hash;

  const prefix = hash.slice(0, prefixLength);
  const suffix = hash.slice(-suffixLength);
  
  // Ensure the "0x" prefix is added if it's a raw hex string and doesn't have it
  const isHex = /^[0-9a-fA-F]+$/.test(hash);
  const displayPrefix = (isHex && !hash.startsWith('0x')) ? `0x${prefix}` : prefix;

  return `${displayPrefix}••••••••${suffix}`;
};
