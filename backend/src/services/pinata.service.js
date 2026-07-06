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

module.exports = {
  uploadDocument,
  listDocumentsByKeyValue
};
