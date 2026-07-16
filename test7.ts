import https from 'https';

https.get('https://pncp.gov.br/api/pncp/v1/orgaos/63025530000104/compras/2025/4720/itens/1/resultados', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log(data.substring(0, 1000));
  });
});
