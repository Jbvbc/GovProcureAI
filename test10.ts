import https from 'https';
import http from 'http';

http.get('http://compras.dados.gov.br/materiais/v1/materiais.json?descricao=computador', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log(data.substring(0, 1000));
  });
});
