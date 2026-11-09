-- EXPLORANDO DADOS | Marcos Feitosa
-- Execute o script inteiro no SQL Server Management Studio.
-- Base ficticia. Somente tabelas temporarias sao utilizadas.
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#EDCanais') IS NOT NULL DROP TABLE #EDCanais;
IF OBJECT_ID('tempdb..#EDTransacoes') IS NOT NULL DROP TABLE #EDTransacoes;
IF OBJECT_ID('tempdb..#EDEventos') IS NOT NULL DROP TABLE #EDEventos;
IF OBJECT_ID('tempdb..#EDEstornos') IS NOT NULL DROP TABLE #EDEstornos;

CREATE TABLE #EDCanais (
    CanalID int PRIMARY KEY,
    Canal nvarchar(20) NOT NULL
);
CREATE TABLE #EDTransacoes (
    TransacaoID int PRIMARY KEY,
    CanalID int NOT NULL,
    Criacao date NOT NULL,
    Valor decimal(12,2) NOT NULL
);
CREATE TABLE #EDEventos (
    EventoID int PRIMARY KEY,
    TransacaoID int NOT NULL,
    Ocorrencia datetime2(0) NOT NULL,
    StatusEvento varchar(12) NOT NULL
);
CREATE TABLE #EDEstornos (
    EstornoID int PRIMARY KEY,
    TransacaoID int NOT NULL,
    Confirmacao date NULL,
    Valor decimal(12,2) NOT NULL
);

INSERT INTO #EDCanais VALUES (1,N'Site'),(2,N'App'),(3,N'Balcão');
INSERT INTO #EDTransacoes VALUES
    (101,1,'20260305',200),(102,1,'20260310',100),(103,1,'20260331',300),
    (201,2,'20260308',150),(202,2,'20260312',50),(203,2,'20260315',100),
    (204,2,'20260331',80);
INSERT INTO #EDEventos VALUES
    (1,101,'2026-03-05T08:01:00','Pendente'),
    (2,101,'2026-03-06T10:00:00','Aprovada'),
    (3,101,'2026-03-07T10:00:00','Aprovada'),
    (4,102,'2026-03-10T08:01:00','Pendente'),
    (5,102,'2026-03-10T08:01:00','Recusada'),
    (6,103,'2026-03-31T20:01:00','Pendente'),
    (7,103,'2026-04-01T00:00:00','Aprovada'),
    (8,201,'2026-03-08T08:01:00','Aprovada'),
    (9,202,'2026-03-12T08:01:00','Aprovada'),
    (10,203,'2026-03-15T08:01:00','Recusada');
INSERT INTO #EDEstornos VALUES
    (1,101,'20260320',20),(2,101,'20260325',30),(3,101,NULL,10),
    (4,101,'20260401',40),(5,201,'20260326',15);

DECLARE @InicioED date = '20260301';
DECLARE @CorteED date = '20260401';

;WITH EventosNoFechamento AS (
    -- Filtre antes de ordenar para preservar o retrato de março.
    SELECT TransacaoID, StatusEvento,
        ROW_NUMBER() OVER (
            PARTITION BY TransacaoID ORDER BY Ocorrencia DESC, EventoID DESC
        ) AS Ordem
    FROM #EDEventos
    WHERE Ocorrencia < @CorteED
),
EstornosConfirmados AS (
    -- Uma linha por transação antes do JOIN com o valor aprovado.
    SELECT TransacaoID, SUM(Valor) AS ValorEstornado
    FROM #EDEstornos
    WHERE Confirmacao < @CorteED
    GROUP BY TransacaoID
),
PorCanal AS (
    SELECT c.CanalID, c.Canal,
        COUNT(t.TransacaoID) AS Tentativas,
        SUM(CASE WHEN e.StatusEvento = 'Aprovada' THEN 1 ELSE 0 END) AS Aprovadas,
        SUM(CASE WHEN t.TransacaoID IS NOT NULL AND e.StatusEvento IS NULL
                 THEN 1 ELSE 0 END) AS SemEvento,
        CAST(SUM(CASE WHEN e.StatusEvento = 'Aprovada' THEN t.Valor ELSE 0 END)
            AS decimal(18,2)) AS ValorAprovado,
        CAST(SUM(CASE WHEN e.StatusEvento = 'Aprovada' THEN COALESCE(s.ValorEstornado,0)
                      ELSE 0 END) AS decimal(18,2)) AS ValorEstornado
    FROM #EDCanais AS c
    LEFT JOIN #EDTransacoes AS t
        ON t.CanalID = c.CanalID AND t.Criacao >= @InicioED AND t.Criacao < @CorteED
    LEFT JOIN EventosNoFechamento AS e
        ON e.TransacaoID = t.TransacaoID AND e.Ordem = 1
    LEFT JOIN EstornosConfirmados AS s ON s.TransacaoID = t.TransacaoID
    GROUP BY c.CanalID, c.Canal
)
SELECT Canal, Tentativas, Aprovadas, SemEvento, ValorAprovado, ValorEstornado,
    ValorAprovado - ValorEstornado AS ValorAposEstornos,
    CAST(100.0 * Aprovadas / NULLIF(Tentativas,0) AS decimal(8,2)) AS TaxaAprovacaoPct,
    CAST(100.0 * ValorEstornado / NULLIF(ValorAprovado,0) AS decimal(8,2)) AS TaxaEstornoPct
FROM PorCanal
ORDER BY Canal;
