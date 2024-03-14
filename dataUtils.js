require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

// Função para obter a data no formato AAAAMMDD
function obterDataAAAAMMDD() {
    return new Date().getFullYear().toString() + (new Date().getMonth() + 1).toString().padStart(2, '0') + new Date().getDate().toString().padStart(2, '0');
}



// Função para criar configuração do banco de dados
function createDBConfig() {
    return  config={
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

// Exporte as funções em um único objeto
module.exports = {
    obterDataAAAAMMDD,
    createDBConfig,
};