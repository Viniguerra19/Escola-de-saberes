# Escola de Saberes — diagnóstico da reformulação

Data: 27/09/2026. Escopo: código local do front-end e Apps Script, documentação e amostras visuais da gravação de 84 segundos fornecida pelo responsável. Não houve acesso autenticado à produção, à planilha nem ao Apps Script implantado. O código implantado pode diferir do código local. As contagens do vídeo são um retrato daquele momento, não uma consulta atual ao banco.

Este diagnóstico registra o estado encontrado antes da primeira etapa de implementação. Algumas falhas descritas aqui já receberam correções no código local; o estado atualizado está no registro de `03-plano-de-execucao.md`. Nenhuma mudança foi publicada nem aplicada aos dados reais.

**Decisão posterior do responsável:** o acesso deve continuar só com e-mail cadastrado, sem token ou verificação de identidade. As recomendações históricas de autenticação abaixo não fazem mais parte do plano. É possível entrar usando o e-mail de outra pessoa, inclusive o do administrador; portanto não se pode prometer confidencialidade de cursos, privacidade de progresso ou autoria comprovada de alterações.

## Decisão recomendada

Reformar em etapas, preservando inicialmente Vite e JavaScript. Separar três frentes: confiabilidade e acesso; navegação e experiência mobile; administração completa. Não iniciar com uma troca de framework ou migração integral do banco. Profissionalizar significa tornar as operações confiáveis, rápidas e administráveis, além de melhorar a aparência.

## O que já existe

- Catálogo de cursos por acesso/turma, módulos recolhíveis e acompanhamento manual de conclusão.
- Vídeo, áudio, PDF, imagens, carrosséis e flashcards CSV.
- Painel com cursos, aulas, cadastro de alunos, edição de acessos e relatório de progresso para impressão.
- Backend Google Apps Script com Google Sheets. Front-end com quatro páginas principais e roteamento por hash.

No vídeo, aproximadamente em 74 s, um curso aparece com **18 módulos e 72 aulas**; outro com 8 módulos e 27 aulas. Aos 21–42 s, diferentes mídias aparecem como itens independentes na lateral. Aos 63 s, o painel mostra 117 alunos e 4 cursos. Isso já justifica busca, organização por assunto e edição mais eficiente; não demonstra por si só necessidade de trocar de banco.

## Achados e prioridades

P0: acesso e integridade antes de ampliar uso. P1: operação cotidiana e experiência. P2: evolução.

| Prioridade | Evidência no código | Consequência e correção |
|---|---|---|
| P0 | `Code.gs`, `doLogin` (linha 154): basta e-mail existente para emitir token; `requireAdmin` confia no papel desse usuário | Quem conhece um e-mail cadastrado pode obter a identidade correspondente, inclusive administrativa, se a implantação usar este código. Adotar comprovação de identidade, expiração, revogação e limitação de tentativas. |
| P0 | `getCourseContent` (300) valida token, mas não matrícula; `toggleLessonComplete` (347) não valida vínculo da aula com curso autorizado | A filtragem do catálogo não protege a API. Centralizar autorização por curso e aplicá-la a conteúdo, recursos e progresso. |
| P0 | Interpolação de nomes, títulos, URLs, erros e CSV em `innerHTML` nas páginas e navbar | Risco de injeção de HTML/script. Usar `textContent`, propriedades de elementos e validação de URL; sanitização somente para texto rico deliberadamente permitido. Não foi feito teste de exploração em produção. |
| P1 | `doLogin` armazena um token por usuário; validação sem validade temporal | Login em outro dispositivo substitui a sessão; falta gerenciamento de sessões e bloqueio. Criar sessões independentes, com expiração e revogação. |
| P1 | `LoginPage.js` injeta estilos para `.login-container` e `.login-card`; `player.css` também define esses seletores | Altura de 100vh no contêiner interno somada ao padding externo; regras mobile disputam com o estilo inserido depois. Consolidar em `login.css`, um único contêiner de altura mínima e medidas fluidas. Confirmar em navegador. |
| P1 | `layout.css:197`: módulo aberto tem `max-height:2000px` e `overflow:hidden` | Módulos extensos podem ter aulas cortadas. Remover teto arbitrário e testar lista longa. |
| P1 | `CoursePlayerPage.js`, `renderSidebar` reconstrói todas as aulas; `selectLesson` redefine expansão | Custo de renderização cresce com catálogo; estado de navegação se perde. Mostrar índice de módulos e apenas aulas do módulo escolhido. |
| P1 | `CoursePlayerPage.js:183,433`: erros ao salvar conclusão são ignorados | O aluno pode ver uma conclusão que não foi salva. Exibir estado salvando/salvo/erro, restaurar estado ou permitir nova tentativa; impedir corridas. |
| P1 | `CoursePlayerPage.js:732`: seleciona somente a primeira aula do primeiro módulo | Não retoma estudo. Primeiro módulo vazio pode produzir mensagem de curso vazio mesmo com outras aulas. Selecionar aula válida e persistir última aula. |
| P1 | `AdminPage.js:12` contém cliente HTTP próprio; `api.js` contém outro, com contratos divergentes | Não trocar simplesmente os imports. Inventariar ações e padronizar parâmetros antes de unificar. Painel atual usa majoritariamente o cliente interno, portanto os wrappers divergentes não provam que seus botões estejam quebrados hoje. |
| P1 | `adminUpdateCourse` e `adminUpdateLesson` atualizam campos com `if(params.campo)` | Limpar descrição/capa/URL pode não persistir. Diferenciar ausente de vazio, respeitando obrigatoriedade por campo. |
| P1 | Módulos possuem criação, mas não edição/exclusão/reordenação implementadas no backend | O administrador continua dependente de operações manuais. Completar CRUD, movimentação e ordenação pelo painel. |
| P1 | Exclusão de curso apaga só sua linha; exclusão de aula não remove progresso; IDs usam `Date.now()` | Possíveis órfãos e colisões concorrentes. Preferir arquivamento/restauração, IDs estáveis e validação de relações. |
| P1 | Escritas sem `LockService`, checagem de versão ou idempotência | Duplicação de progresso/criação e sobrescrita entre editores. Proteger seção crítica, verificar duplicatas e conflitos. |
| P1 | Leitura integral das abas por requisição; relatório com filtros repetidos; leitura de cache desativada em `api.js` | Trabalho cresce com dados. Ler em lote, indexar em memória por chamada, paginar administração e cachear somente com escopo e invalidação definidos. |
| P1 | PDF.js importado na página e página importada estaticamente em `main.js` | Dependência de PDF entra no grafo inicial mesmo no login. Carregar página e renderizador sob demanda; medir bundle antes/depois. |
| P1 | `_cleanupKeyboard` criado no PDF (600), sem chamada de descarte; marcação reconstrói mídia | Eventos podem sobreviver à troca de aula; concluir pode reiniciar o player. Implementar ciclo de montagem/desmontagem e atualizar apenas o estado de conclusão. |
| P1 | Flashcards passam por proxy público; links de materiais são fornecidos diretamente ao navegador | Dependência externa e política de acesso ao arquivo separada da matrícula. Inventariar público/restrito; recursos restritos precisam de entrega autenticada. Não presumir proteção porque botão de download está oculto. |
| P1 | Cards, títulos de módulos e itens clicáveis são `div`; drawer não gerencia foco/Escape | Uso por teclado/leitor de tela incompleto. Usar elementos semânticos, nomes acessíveis, foco e navegação previsíveis. |
| P2 | README descreve PWA e “upload”; não há manifesto/service worker no código revisado; formulários recebem URLs | Documentação superestima capacidades. Corrigir descrição e tratar upload real/PWA como trabalho futuro. |

## Divergências de contrato identificadas

| Wrapper de `src/api.js` | Backend local | Situação |
|---|---|---|
| `get_progress` | Não há case | Wrapper sem endpoint |
| `admin_update_course`/`admin_delete_course` com `course_id` | Espera `courseId` | Parâmetro divergente |
| `admin_create_module` com `course_id` | Espera `courseId` | Parâmetro divergente; `order` não é aplicado |
| `admin_create_lesson` com `module_id` | Espera `moduleId` | Parâmetro divergente |
| `admin_bulk_create_lessons` | `admin_create_bulk_lessons`, cada item com `moduleId` | Nome e estrutura divergentes |
| Atualizar/excluir aula com `lesson_id` | Espera `lessonId` | Parâmetro divergente |
| `admin_toggle_access` | `admin_update_user_access` com `email`, `turma`, `coursesStr` | Ação e estrutura divergentes |
| `admin_reorder`, `admin_import_users`, `admin_export_users`, `admin_block_user`, `admin_engagement` | Sem cases correspondentes | Não considerar implementados; parte do relatório vem de `admin_dashboard` |

Outros detalhes: cabeçalhos são normalizados de maneira diferente entre leitura e escrita; permissões usam títulos/slugs e texto de turma, com correspondência parcial. O front-end restringe administrador também a um e-mail fixo; o servidor usa apenas papel. `respond()` recebe status/headers, mas não os aplica ao `TextOutput`: não documentar esses argumentos como resposta HTTP efetiva.

## O que falta para um LMS profissional

| Área | Entrega necessária | Fase |
|---|---|---|
| Confiança | Identidade verificada, permissões no servidor, sessões, progresso persistente e auditoria | Essencial |
| Estudo | Continuar de onde parou, busca, módulos navegáveis, anterior/próxima, recursos associados e bom uso mobile | Essencial |
| Conteúdo | Editar/mover/ordenar/duplicar, rascunho/publicação, prévia de aluno, arquivar/restaurar, importar com validação | Essencial |
| Pessoas | Editar cadastro, turmas, matrículas por ID, bloqueio/revogação e ações em lote | Essencial |
| Configuração | Nome, identidade visual, contato de suporte, regras de conclusão e modelos de aula pelo painel | Essencial, após acesso seguro |
| Operação | Erros acionáveis, histórico de mudanças, atualização sem perda de dados, ambiente de teste e procedimento de recuperação | Essencial |
| Ensino | Questionários, atividades, feedback e pré-requisitos quando o método pedagógico pedir | Evolução |
| Comunicação | Avisos por turma, lembretes configuráveis e preferência de recebimento | Evolução |
| Reconhecimento | Certificados com critérios e verificação, se houver necessidade institucional | Opcional |
| Interoperabilidade | SCORM/xAPI/LTI, app nativo, pagamentos e gamificação | Adiar até existir demanda concreta |

O percentual atual mede **marcação de conclusão**, não aprendizado comprovado, tempo assistido ou presença. Relatórios devem nomear a métrica corretamente. Questionários e certificados não corrigem uma base de acesso/progresso inconsistente.

## Limites e validação pendente

- Revisão estática não equivale a auditoria de segurança completa. Confirmar versão implantada, permissões reais dos arquivos, esquema das abas e regras de turma.
- A gravação é desktop. Comportamento em iPhone/Android, teclado virtual, baixa conectividade e leitores de tela ainda precisa de teste.
- Nenhuma alteração de planilha ou chamada autenticada foi feita; nenhum dado pessoal do vídeo foi copiado para fixtures.
- A validação do build e suas limitações estão registradas no plano de execução. Não há suíte de testes declarada no `package.json`.

## Fontes técnicas consultadas

- [Google — quotas do Apps Script](https://developers.google.com/apps-script/guides/services/quotas): há limites e interrupção por quota; não assumir crescimento ilimitado ou fixar capacidade pelo número de alunos.
- [Google — boas práticas](https://developers.google.com/apps-script/guides/support/best-practices): reduzir chamadas a serviços, usar operações em lote e cache quando apropriado.
- [OWASP — autenticação](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): fundamentação para verificação de identidade e proteção do processo de login.
- [W3C — referência WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/): referência para teclado, foco, contraste, reflow e mensagens de estado. O projeto ainda não foi avaliado para conformidade.
