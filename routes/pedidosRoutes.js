const express = require('express');
const mssql = require('mssql');
const { obterDataAAAAMMDD,createDBConfig } = require('../dataUtils.js'); // Importe a função obterDataAAAAMMDD

const router = express.Router();
const dataFormatada = obterDataAAAAMMDD(); // Use a função obterDataAAAAMMDD para obter a data formatada
const config = createDBConfig();

router.get('', async (req, res) => {
    try {
        const pool = await mssql.connect(config);
        const consulta = `
            SELECT ROW_NUMBER() OVER(ORDER BY CAST(HORAIMPORTACAO AS datetime) DESC) AS _ID, 
                   NUMERODOPEDIDO, 
                   FORNECEDOR, 
                   FILIAL, 
                   SUM(VALOR) AS VALOR, 
                   DATAIMPORTACAO, 
                   HORAIMPORTACAO, 
                   STATUS_ AS STATUS 
            FROM (
                SELECT ZW7_NPEDIT AS NUMERODOPEDIDO, 
                       ZW7_FORNE AS FORNECEDOR, 
                       CASE WHEN TRIM(ZW7_CNPJDI) = '' OR ZW7_CNPJDI = '03636036000154' OR ZW7_CNPJDI = '03636036000740' THEN 'AL' ELSE 'SE' END FILIAL, 
                       SUM(ZW7_QTDPRO * ZW7_VLRUNT) AS VALOR, 
                       TRIM(FORMAT(CONVERT(DATE, CONVERT(VARCHAR(8), ZW7_DTIMP), 112), 'dd/MM/yy')) AS DATAIMPORTACAO, 
                       REPLACE(SUBSTRING(CAST(DATAIMPORTACAO AS VARCHAR), 13, 19), ' ', '0') AS HORAIMPORTACAO, 
                       MAX(CASE WHEN ZW7_ENVIO2 = 'S' THEN '7' WHEN D2_DOC IS NOT NULL THEN '6' WHEN ZW7_ENVIO = 'S' THEN '5' WHEN C9_BLEST IS NOT NULL AND C5_TIPO <> 'A' THEN '4' WHEN C5_TIPO <> 'A' THEN '3' WHEN C5_NUM IS NOT NULL THEN '2' WHEN ZW7_NUMDI <> '' OR ZW7_NUMDI IS NOT NULL THEN '1' END) AS STATUS_
                FROM V_ACOMP_OL (NOLOCK) 
                WHERE ZW7_DTIMP = @dataformatada AND DATAIMPORTACAO IS NOT NULL 
                GROUP BY ZW7_NPEDIT, 
                         ZW7_FORNE, 
                         ZW7_DTIMP, 
                         DATAIMPORTACAO, 
                         ZW7_CNPJDI, 
                         ZW7_ENVIO2, 
                         D2_DOC, 
                         ZW7_ENVIO, 
                         C9_BLEST, 
                         C5_TIPO, 
                         C5_NUM, 
                         ZW7_NUMDI
            ) RR 
            GROUP BY NUMERODOPEDIDO, 
                     FORNECEDOR, 
                     FILIAL, 
                     DATAIMPORTACAO, 
                     HORAIMPORTACAO, 
                     STATUS_ 
            ORDER BY CAST(HORAIMPORTACAO AS datetime) DESC`;

        console.log('Consulta executada:', consulta);
        const result = await pool
            .request()
            .input('dataformatada', mssql.VarChar, dataFormatada) // Use VarChar para o tipo de entrada
            .query(consulta);

        console.log(result.query);

        const pedidosFormatados = result.recordset.map((pedido) => ({
            id: pedido._ID,
            numpedido: pedido.NUMERODOPEDIDO,
            fornecedor: pedido.FORNECEDOR,
            filial: pedido.FILIAL,
            valor: pedido.VALOR,
            data: pedido.DATAIMPORTACAO,
            hora: pedido.HORAIMPORTACAO,
            status: pedido.STATUS,
        }));

        res.json(pedidosFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro interno do servidor');
    }
});

module.exports = router;