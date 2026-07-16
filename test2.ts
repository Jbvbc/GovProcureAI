import https from 'https';

const testType = (type) => {
  https.get(`https://pncp.gov.br/api/search/?q=computador&tipos_documento=${type}`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Type: ${type} - Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log(data.substring(0, 500));
      } else {
        console.log(data);
      }
    });
  });
};

['compra', 'item', 'contrato', 'ata', '1', '2', 'contratacao', 'edital'].forEach(testType);
