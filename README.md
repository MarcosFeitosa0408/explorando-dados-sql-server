# Explorando Dados — SQL Server

Projeto de portfólio de Marcos Feitosa sobre aprovação de pagamentos e estornos por canal, com dados fictícios.

- `index.html` abre o dashboard interativo.
- `sql.html` mostra os códigos T-SQL em cinco etapas e o resultado esperado.
- `style.css` contém os estilos das duas páginas.
- `app.js` calcula e apresenta os indicadores da demonstração no navegador.
- `sql.js` habilita a cópia dos trechos de código.
- `explorando-dados.sql` contém a base de exemplo e a consulta completa para executar no SQL Server Management Studio (SSMS).

## Publicação

Nome sugerido para o repositório: `explorando-dados-sql-server`.

Coloque os arquivos extraídos na raiz do repositório e configure o GitHub Pages para publicar a raiz da branch escolhida. A página principal é `index.html` e a apresentação SQL fica em `sql.html`. O site é estático e usa caminhos relativos, sem instalação de dependências.

## Conferência

1. Abra o dashboard e confirme que ele mostra 7 tentativas, 42,86% de aprovação e R$ 335,00 após estornos.
2. Clique em **Códigos SQL** para abrir a apresentação.
3. Clique em **Baixar script completo (.sql)**. Para reproduzir a análise, execute o arquivo inteiro em uma janela do SSMS e compare a saída com a tabela de resultado esperado.
