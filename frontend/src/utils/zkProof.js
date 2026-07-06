import { Buffer } from 'buffer';



export const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};


export const generateSalt = () => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};


export const hashField = async (key, value, salt) => {
  return await sha256(`${key}:${value}:${salt}`);
};


export const createVerifiablePayload = async (fields) => {
  const salts = {};
  const fieldHashes = {};
  const keys = Object.keys(fields).sort(); 

  for (const key of keys) {
    salts[key] = generateSalt();
    fieldHashes[key] = await hashField(key, fields[key], salts[key]);
  }

  
  const combinedString = keys.map(k => fieldHashes[k]).join('|');
  const rootHash = await sha256(combinedString);

  return {
    rootHash,
    salts,
    fieldHashes
  };
};


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
