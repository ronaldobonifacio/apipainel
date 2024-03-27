const express = require('express');
const mssql = require('mssql');
const {createDBConfig} = require('../dataUtils.js');

const router = express.Router();
const config = createDBConfig();


router.get('', async (req, res) => {
    try {
        const pool = await mssql.connect(config);
        const consulta = `
SELECT ROW_NUMBER() OVER(ORDER BY DATAIMPORTACAO DESC) _ID, 
        NUMERODOPEDIDO, 
        FORNECEDOR, 
        FILIAL, 
        DATAIMPORTACAO, 
        DEPARTAMENTO, 
        DI 
 FROM (
     SELECT ZW7_NPEDIT AS NUMERODOPEDIDO, 
            ZW7_FORNE AS FORNECEDOR, 
            CASE WHEN TRIM(ZW7_CNPJDI) = '' OR ZW7_CNPJDI = '03636036000154' OR ZW7_CNPJDI = '03636036000740' THEN 'AL' ELSE 'SE' END FILIAL, 
            TRIM(FORMAT(CONVERT(DATE, CONVERT(VARCHAR(8), ZW7_DTIMP), 112), 'dd/MM/yy')) AS DATAIMPORTACAO, 
            ZW7_NUMDI AS DI, 
            TTT.T09_DPTDES DEPARTAMENTO 
     FROM V_ACOMP_OL (NOLOCK) 
     OUTER APPLY (
         SELECT  TOP 1 * FROM (
             SELECT T09_DPTDES, 
                    T09_SEQUENCIA, 
                    SEQ=ROW_NUMBER() OVER (ORDER BY T09_SEQUENCIA DESC) 
             FROM gnc.dbo.T09_NCMOV P (NOLOCK) 
             WHERE T09_NUMERO = ZW7_NUMDI
         ) TT 
         ORDER BY T09_SEQUENCIA DESC
         
     ) TTT 
     WHERE ZW7_NUMDI <> ''  AND ZW7_ENVIO = ''
     GROUP BY ZW7_NPEDIT, 
              ZW7_FORNE, 
              ZW7_DTIMP, 
              DATAIMPORTACAO, 
              ZW7_CNPJDI, 
              ZW7_NUMDI, 
              T09_DPTDES
 ) RR 
 GROUP BY NUMERODOPEDIDO, 
          FORNECEDOR, 
          FILIAL, 
          DATAIMPORTACAO, 
          DI, 
          DEPARTAMENTO 
 ORDER BY DI DESC`;
        console.log('Consulta executada:', consulta);
        const result = await pool
            .request()
            .query(consulta);

        console.log(result.query);

        const pedidosFormatados = result.recordset.map((pedido) => ({
            id: pedido._ID,
            numpedido: pedido.NUMERODOPEDIDO,
            fornecedor: pedido.FORNECEDOR,
            filial: pedido.FILIAL,
            di: pedido.DI,
            data: pedido.DATAIMPORTACAO,
            departamento: pedido.DEPARTAMENTO,
        }));

        res.json(pedidosFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro interno do servidor');
    }
});

module.exports = router;
