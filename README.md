# Escola de Saberes 2.0

LMS em JavaScript/Vite e Google Apps Script, com Google Planilhas como banco. Entrada deliberadamente apenas por e-mail cadastrado, sem autenticação de identidade.

## Publicação

Use `entrega/hospedagem.zip` e `entrega/Code.gs` (ou a cópia idêntica `code.js`). Instruções completas em [docs/PUBLICAR.md](docs/PUBLICAR.md). O pacote da hospedagem já está compilado. Para mudar a implantação, edite `config.js`, sem recompilar.

## Desenvolvimento

Node 22.12+ ou 24. O ambiente de validação usou Node 24.11.1.

```sh
npm ci
npm test
npm run build
npm run release
```

`npm run release` compila e prepara ZIPs e checksums em `entrega/`. `npm run dev` inicia o Vite. Para uma prévia com dados fictícios, execute também `node scripts/preview-api.mjs` e abra `/tests/preview.html`. Essa prévia usa dados em memória e não chama a planilha real.

## Código

- `google-apps-script/Code.gs`: backend autocontido, adaptador de cabeçalhos, permissões, publicação, CRUD, manutenção e relatórios.
- `src/pages/`: entrada, catálogo, player e painel.
- `src/media/`: renderizadores e PDF sob demanda.
- `tests/`: serviços Google simulados e testes de comportamento.
- `docs/ENTREGA-2.0.md`: escopo, verificações e limites.

A interface não é um PWA offline. O upload é de arquivos até 5 MB para Drive com link público; arquivos maiores são cadastrados por URL. Sem autenticação, conhecer o e-mail administrativo permite usar suas funções. Relatórios de conclusão não comprovam presença nem tempo assistido.
