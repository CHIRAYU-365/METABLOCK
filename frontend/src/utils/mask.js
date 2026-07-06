
export const abstractHash = (hash, prefixLength = 6, suffixLength = 6) => {
  if (!hash) return '';
  if (hash.length <= prefixLength + suffixLength) return hash;

  const prefix = hash.slice(0, prefixLength);
  const suffix = hash.slice(-suffixLength);
  
  
  const isHex = /^[0-9a-fA-F]+$/.test(hash);
  const displayPrefix = (isHex && !hash.startsWith('0x')) ? `0x${prefix}` : prefix;

  return `${displayPrefix}••••••••${suffix}`;
};
