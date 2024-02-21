const express = require('express');
const routes = require('./routes.js');

const app = express();
const port = 3001;

app.use(routes);

app.listen(port, () => {
  console.log(`Servidor ouvindo na porta ${port}`);
});
