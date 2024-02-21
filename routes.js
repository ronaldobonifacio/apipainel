const express = require('express');
const cors = require('cors');
const mssql = require('mssql');
const pedidosRoutes = require('./routes/pedidosRoutes');
const detalhesRoutes = require('./routes/detalhesRoutes');
const errosRoutes = require('./routes/errosRoutes');

const router = express.Router();

router.use(cors());
router.use('/pedidos', pedidosRoutes);
router.use('/detalhes', detalhesRoutes);
router.use('/erros', errosRoutes);

module.exports = router;
