const https = require('https');
https.get('https://unique-analysis-production-17f7.up.railway.app/api/documents', (res) => {
  console.log('Status Code:', res.statusCode);
}).on('error', (e) => {
  console.error(e);
});
