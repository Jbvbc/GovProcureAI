import https from 'https';

https.get('https://pncp.gov.br/api/pncp/v1/orgaos/07172424000182/compras/2026/8/itens', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log(data.substring(0, 1000));
  });
});
