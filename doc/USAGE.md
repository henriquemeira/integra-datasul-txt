# Uso e notas do parser

- Arquivos de layout estão em `doc/layout-txt-integracao-datasul.ods` (consulte o ODS para posições completas e regras de casas decimais).
- As posições implementadas atualmente (exemplos do requisito):
  - Tipo 1 (Geral): Estabelecimento 1-3, Série 10-12, Número Documento 14-22, UF 23-24, Natureza 25-30, Emitente 51-60
  - Tipo 2 (Itens): Item 14-30, Quantidade 61-75 (assume 2 casas decimais), Preço Unitário 76-90 (assume 2 casas decimais)
  - Tipo 8 (Extras): Lote 14-53, Data Validade 54-61 (formato ddmmyyyy)
  - Tipo 4 (Duplicatas): Parcela 14-15, Vencimento 16-23, Valor 33-47 (assume 2 casas decimais)

- Observação: se precisar ajustar o número de casas decimais (quantidade/preço/valor), edite `src/utils/parser.js` na função `parseNumberField` (parâmetro `decimals`).

- Execução:
  1. npm install
  2. npm run dev
  3. Acesse o app e arraste o arquivo `.txt` (use o exemplo `doc/arquivo-exemplo-importacao.txt` para testes).

- Feedback: erros de parse aparecem como mensagem vermelha. JSON resultante pode ser baixado com o botão "Download JSON".
