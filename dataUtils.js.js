// dataUtils.js
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env


function obterDataAAAAMMDD() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const dia = hoje.getDate().toString().padStart(2, '0');
    const dataAAAAMMDD = `${ano}${mes}${dia}`;
    return dataAAAAMMDD;
  }
  
  // Exporte a função para que ela possa ser utilizada em outros arquivos
  module.exports = obterDataAAAAMMDD;

  const createDBConfig = () => {
    return {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_DATABASE,
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // Converte para booleano
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true', // Converte para booleano
      },
    };
  };
  
  module.exports = createDBConfig;
  