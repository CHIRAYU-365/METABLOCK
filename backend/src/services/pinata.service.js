const { PinataSDK } = require('pinata-web3');
const { Blob, File } = require('buffer');

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});

const uploadDocument = async (fileBuffer, originalname, mimetype, metadata) => {
  const blob = new Blob([fileBuffer]);
  const fileForPinata = new File([blob], originalname, { type: mimetype });
  
  const pinataRes = await pinata.upload.file(fileForPinata).addMetadata({
    name: originalname,
    keyValues: metadata
  });
  
  return pinataRes.IpfsHash;
};

const listDocumentsByKeyValue = async (key, value) => {
  const files = await pinata.listFiles().keyValue(key, value);
  return files;
};

const listAllDocuments = async () => {
  const files = await pinata.listFiles();
  return files;
};

const updateDocumentMetadata = async (ipfsCid, keyValues) => {
  const axios = require('axios');
  const response = await axios.put(
    'https://api.pinata.cloud/pinata/hashMetadata',
    {
      ipfsPinHash: ipfsCid,
      keyvalues: keyValues
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

module.exports = {
  uploadDocument,
  listDocumentsByKeyValue,
  listAllDocuments,
  updateDocumentMetadata
};
