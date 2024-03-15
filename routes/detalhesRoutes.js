const express = require('express');
const mssql = require('mssql');
const { createDBConfig } = require('../dataUtils.js'); // Importe a função obterDataAAAAMMDD

const router = express.Router();
const config = createDBConfig();

router.get('/:numpedido', async (req, res) => {
  try {
    const pool = await mssql.connect(config);
    const consulta = `
    SELECT 
    ROW_NUMBER() OVER(ORDER BY ZW7_CODPRO DESC) AS _ID, 
    ZW7_CODPRO,
    NUMERODOPEDIDO, 
    FORNECEDOR,
    CASE 
        WHEN D2_DOC <> '' OR D2_DOC IS NOT NULL THEN 'FATURADO'
        WHEN C9_CARGA <> '' OR C9_CARGA IS NOT NULL THEN 'EM CARGA'
        WHEN C9_QTDLIB > 0  THEN 'LIBERADO'
        WHEN C9_BLEST = '02' OR C9_BLCRED='01' THEN 'BLOQ. FINANCEIRO/ESTOQUE'
        WHEN C5_BLQ = 'S' THEN 'PEDIDO BLOQUEADO'
        WHEN C6_BLQ = 'S' THEN 'ITEM BLOQUEADO'
        WHEN C5_NUM <> '' THEN 'IMPORTADO'
        WHEN ZW7_NUMDI <> '' AND C5_NUM IS NULL THEN 'FALHA NA IMPORTACAO'
        ELSE 'ERRO'
    END AS STATUS,
    C5_NUM,
    C5_FILIAL,
    FILIAL, 
    DATAIMPORTACAO,
    T09_DPTDES,
    ZW7_NUMDI,
    REPLACE(REPLACE(C6_DESCRI, SUBSTRING(C6_DESCRI, PATINDEX('%[~,@,#,$,%,&,*,(,),",\,.,!,",/,\\,:,;,<,>,|,?,+]%', C6_DESCRI), 1), ''), 'caractere_a_ser_removido', '') AS C6_DESC,
    ZW7_QTDPRO,
    C9_QTDLIB,
    D2_SERIE,
    D2_DOC,
    C9_CARGA
FROM (
    SELECT 
        C9_CARGA,
        C6_BLQ,
        C5_BLQ,
        C5_NUM,
        C5_FILIAL,
        C9_BLCRED,
        C9_BLEST,
        D2_SERIE,
        D2_DOC,
        ZW7_NUMDI,
        ZW7_QTDPRO,
        C9_QTDLIB,
        C6_DESCRI,
        T09_DPTDES,
        ZW7_CODPRO,
        ZW7_NPEDIT AS NUMERODOPEDIDO, 
        ZW7_FORNE AS FORNECEDOR, 
        CASE WHEN TRIM(ZW7_CNPJDI) = '' OR ZW7_CNPJDI = '03636036000154' OR ZW7_CNPJDI = '03636036000740' THEN 'AL' ELSE 'SE' END FILIAL, 
        TRIM(FORMAT(CONVERT(DATE, CONVERT(VARCHAR(8), ZW7_DTIMP), 112), 'dd/MM/yy')) AS DATAIMPORTACAO
    FROM 
        V_ACOMP_OL (NOLOCK) 
    OUTER APPLY (
        SELECT 
            TOP 1 
            T09_DPTDES, 
            T09_SEQUENCIA, 
            SEQ=ROW_NUMBER() OVER (ORDER BY T09_SEQUENCIA DESC) 
        FROM 
            gnc.dbo.T09_NCMOV P (NOLOCK) 
        WHERE 
            T09_NUMERO = CASE WHEN ZW7_NUMDI IS NULL OR TRIM(ZW7_NUMDI) = '' THEN '99' ELSE  ZW7_NUMDI END
    ) TTT 
    WHERE 
        ZW7_NPEDIT = @numpedido
    GROUP BY 
        ZW7_NPEDIT, 
        ZW7_FORNE, 
        ZW7_NUMDI,
        ZW7_DTIMP, 
        DATAIMPORTACAO,
        C6_DESCRI,
        ZW7_CODPRO,
        C9_CARGA,
        C6_BLQ,
        C5_BLQ,
        C5_NUM,
        C5_FILIAL,
        ZW7_CNPJDI,
        T09_DPTDES,
        ZW7_QTDPRO,
        C9_QTDLIB,
        C9_BLCRED,
        C9_BLEST,
        D2_SERIE,
        D2_DOC
) RR 
GROUP BY 
    NUMERODOPEDIDO, 
    FORNECEDOR, 
    FILIAL, 
    DATAIMPORTACAO, 
    C9_CARGA,
    C6_BLQ,
    C5_BLQ,
    C5_NUM,
    C5_FILIAL,
    ZW7_CODPRO,
    T09_DPTDES,
    ZW7_NUMDI,
    C6_DESCRI,
    ZW7_QTDPRO,
    C9_QTDLIB,
    C9_BLCRED,
    C9_BLEST,
    D2_SERIE,
    D2_DOC
ORDER BY 
    ZW7_CODPRO DESC `;

    const result = await pool
      .request()
      .input('numpedido', mssql.VarChar, req.params.numpedido) // Inserir o valor do parâmetro na query
      .query(consulta);

    console.log(result.query);

    const pedidosFormatados = result.recordset.reduce((acc, pedido) => {
      if (!acc[pedido.NUMERODOPEDIDO]) {
        acc[pedido.NUMERODOPEDIDO] = [];
      }
      acc[pedido.NUMERODOPEDIDO].push({        id: pedido._ID,
        codpro: pedido.ZW7_CODPRO,
        numpedido: pedido.NUMERODOPEDIDO,
        fornecedor: pedido.FORNECEDOR,
        status: pedido.STATUS,
        c5num: pedido.C5_NUM,
        c5filial: pedido.C5_FILIAL,
        filial: pedido.FILIAL,
        data: pedido.DATAIMPORTACAO,
        departamento: pedido.T09_DPTDES,
        numdi: pedido.ZW7_NUMDI,
        c6desc: pedido.C6_DESC,
        qtdpro: pedido.ZW7_QTDPRO,
        qtdlib: pedido.C9_QTDLIB,
        d2serie: pedido.D2_SERIE,
        d2doc: pedido.D2_DOC,
        cargac9: pedido.C9_CARGA,
        pedpalm: pedido.ZW7_PEDPALM
      });
      return acc;
    }, {});

    res.json(pedidosFormatados);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro interno do servidor');
  }
});

module.exports = router;