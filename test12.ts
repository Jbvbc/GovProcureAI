import https from 'https';

https.get('https://compras.dados.gov.br/materiais/v1/materiais.json?descricao=computador', (res) => {
  console.log('Location:', res.headers.location);
});
