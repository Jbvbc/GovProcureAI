import https from 'https';

const fetchAndPrint = (type) => {
  https.get(`https://pncp.gov.br/api/search/?q=computador&tipos_documento=${type}&tam_pagina=1`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`\n--- Type: ${type} ---`);
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json.items[0], null, 2));
      } catch (e) {
        console.log(data);
      }
    });
  });
};

['ata', 'contrato'].forEach(fetchAndPrint);
