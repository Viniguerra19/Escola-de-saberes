> **Atualização: entrega 2.0 consolidada.** Consulte `../ENTREGA-2.0.md` para a implementação atual e `../PUBLICAR.md` para publicação. O registro abaixo documenta a etapa anterior e foi mantido como histórico.

# Plano executável — Escola de Saberes

Estado em 27/09/2026: diagnóstico e especificação concluídos; a implementação está em andamento. O Google Planilhas permanece como banco. O responsável decidiu manter entrada somente por e-mail cadastrado, sem token ou verificação de identidade. Consultar o registro de continuidade ao fim do documento.

## Como executar com pouco contexto

Uma tarefa por conversa/entrega. Fornecer apenas este documento, a seção relevante da especificação e os arquivos indicados. Não pedir “reforme o sistema inteiro” a cada rodada. Ler dependências concluídas no registro; atualizar o registro ao finalizar. Tarefas de identidade, autorização e migração exigem revisão cuidadosa mesmo quando a implementação é pequena.

Prompt reutilizável:

> Execute somente a tarefa **Txx** de `docs/reformulacao/03-plano-de-execucao.md`. Leia a seção correspondente de `02-experiencia-e-arquitetura.md` e os arquivos indicados. Verifique as dependências no registro. Preserve dados, IDs, progresso e contratos existentes; não migre nem publique em produção nesta tarefa. Faça a implementação, rode as verificações relevantes e atualize o registro com arquivos alterados, testes, resultado e limitações. Não adicione funcionalidades de outras tarefas nem faça refatoração geral. Se faltar uma decisão externa indispensável, conclua a parte independente e registre exatamente o impedimento. Ao terminar, entregue resumo curto e a próxima tarefa pronta para execução.

T01 está concluída no código local. T02, T04a, T05 e T06 tiveram avanços; T03 passou a registrar a decisão de entrada só por e-mail. Próxima sequência: **T00 → concluir T02/T04b/T05/T06 → T07 → T08 → T09 → T10 → T11 → T12 → T13 → T14**. Tarefas com infraestrutura de mídia dependem de levantamento concreto.

## T00 — Base de validação e contratos

**Arquivos:** `src/api.js`, `src/pages/AdminPage.js` (cliente e chamadas), `src/utils/constants.js`, `google-apps-script/Code.gs`, `package.json`; criar fixtures e testes focados.

**Fazer:** mapear action, parâmetros, resposta e autorização; usar tabela do diagnóstico como ponto de partida, conferindo o código. Criar dados fictícios com administrador, aluno matriculado, aluno sem acesso, dois cursos e um primeiro módulo vazio. Preparar harness de Apps Script com serviços simulados para regras puras e instruções para cópia de homologação. Registrar esquema esperado das cinco abas existentes e suas variantes de cabeçalhos. Corrigir README quanto a versão de Node suportada pelo Vite instalado, uploads e PWA.

**Aceite:** fixtures sem dados pessoais; contrato diferencia endpoints funcionais de wrappers órfãos; comando de teste documentado; build passa. Testes simulados não são apresentados como teste do Apps Script real. Identificar um ambiente de homologação antes de qualquer ensaio com dados reais.

**Não fazer:** corrigir todos os endpoints ou adicionar funcionalidades de uma vez.

## T01 — Corrigir login e criar estilos isolados

**Dependência:** nenhuma. **Arquivos:** `src/pages/LoginPage.js`, bloco login de `src/styles/player.css`, `src/main.js`; criar `src/styles/login.css`.

**Fazer:** remover `<style>` injetado e regras duplicadas; centralização com um único contêiner de altura mínima; padding fluido; logo e título legíveis; foco, erro associado, estado de carregamento e redução de movimento. Manter integração atual para não misturar apresentação e identidade. Não anunciar login seguro nesta entrega.

**Aceite:** inspecionar 320/390/768/1440 px e altura reduzida; formulário alcançável com teclado virtual; sem corte/rolagem horizontal; erro não desloca controles para fora da tela; submit duplo bloqueado; `npm run build`. Não criar testes que apenas reproduzam valores CSS; usar inspeção visual e funcional. Registrar quando celular real não foi testado.

## T02 — Autorização de conteúdo e progresso

**Dependência:** T00. **Arquivos:** `Code.gs`, funções `getCourses`, `getCourseContent`, `toggleLessonComplete`, `requireAdmin`; testes de regras.

**Fazer:** extrair uma regra de acesso por curso reutilizada pelo catálogo, conteúdo e progresso. Resolver aula → módulo → curso antes de salvar. Validar existência, IDs e booleano de conclusão. Fechar diferença de autorização entre relatório e catálogo sem ampliar matrículas. Preservar regras legadas até a migração por ID. Não confundir esta correção com autenticação de identidade.

**Aceite:** e-mail não cadastrado falha; matrícula vinculada ao e-mail informado funciona e outra matrícula não aparece para o mesmo e-mail; aula inexistente é rejeitada; requisições repetidas não criam conclusão duplicada. Isso separa dados por e-mail informado, mas não comprova quem o informou. Para concorrência, usar lock e reler dentro da seção crítica. Confirmar comportamento na homologação antes da implantação.

## T03 — Entrada somente por e-mail, sem token

**Dependência:** nenhuma para o código local. **Arquivos:** `src/auth.js`, `src/api.js`, `LoginPage.js`, `Code.gs`, testes e documentação.

**Decisão do responsável:** inserir e-mail cadastrado e entrar, sem comprovante de posse, token, senha ou código. Google Planilhas continua sendo a fonte do cadastro.

**Fazer:** retirar emissão, armazenamento e validação de token do código. Enviar o e-mail selecionado ao Apps Script para consulta da linha real em cada ação; não confiar no papel guardado no navegador para conceder funções administrativas. Limpar tokens de versões anteriores no navegador. Manter a coluna antiga de token na planilha sem uso até existir procedimento de limpeza de dados.

**Aceite:** login com e-mail cadastrado retorna perfil sem token; e-mail ausente falha; cada ação consulta papel e matrícula na planilha; sair remove perfil local. A limitação de segurança deve estar visível para o responsável: qualquer pessoa que conheça o e-mail de outro cadastro poderá agir em seu nome. Não registrar alteração como autoria comprovada.

## T04 — Unificar cliente HTTP e renderização segura

**Dependência:** T00/T02. **Dividir em duas entregas:** T04a cliente/contratos; T04b saída segura.

**Arquivos T04a:** `api.js`, `AdminPage.js`, `constants.js`, `auth.js` e contratos. Unificar URL, transporte e erros; alinhar nomes/parâmetros; retirar ou marcar explicitamente wrappers sem implementação. Timeout/cancelamento e verificação de resposta. Enviar e-mail no corpo POST, evitando colocá-lo na URL. Não repetir automaticamente mutações sem chave de idempotência.

**Arquivos T04b:** páginas, `Navbar.js`, `Toast.js`, `helpers.js`. Converter campos textuais para criação segura de DOM; validar protocolos/origens por tipo de recurso; preservar apenas HTML rico explicitamente suportado e sanitizado. Corrigir renderizações assíncronas antigas sobrescrevendo a rota atual com identificador de render/cancelamento.

**Aceite:** operações administrativas existentes continuam funcionando; títulos com aspas e `<` aparecem como texto; URL executável é recusada; mensagem de erro não vira HTML; falha de rede recuperável; navegar rápido entre rotas não exibe tela anterior. Testar contratos, saída insegura e corrida de navegação.

## T05 — Progresso confiável e ciclo de vida do player

**Dependência:** T02/T04. **Arquivos:** `CoursePlayerPage.js`, `api.js`, `router.js`/`main.js`, `Code.gs`.

**Fazer:** um controlador de conclusão compartilhado entre lateral e aula; atualização otimista com rollback ou estado pendente explícito; serialização/controle de sequência por aula. Atualizar só indicadores, sem reconstruir vídeo/PDF. Descartar listeners e tarefas de mídia ao trocar aula/rota; cancelar PDF anterior. Corrigir módulo inicial vazio. Persistir última aula por usuário/curso e criar rota de aula compatível com URLs atuais.

**Aceite:** concluir não reinicia mídia; erro nunca aparece como salvo; cliques rápidos convergem para último estado persistido; recarregar recupera progresso e última aula autorizada; troca de usuário não reaproveita histórico indevido; múltiplas trocas de PDF não acumulam teclado; módulo vazio inicial não esconde curso.

## T06 — Navegação escalável e mobile

**Dependência:** T04/T05. **Arquivos:** `DashboardPage.js`, `CoursePlayerPage.js`, `layout.css`, `player.css`, `Navbar.js`, `router.js`; extrair componentes conforme usados.

**Fazer:** visão geral do curso com módulos, busca e estados; lateral mostra módulo atual; eliminar `max-height:2000px`; usar botões/links acessíveis; anterior/próxima aula conforme ordem; drawer mobile com rótulo, foco, Escape, fechar e retorno a módulos. Busca inicial por metadados autorizados; não incluir recursos binários no resultado. Preservar URL direta e seleção durante navegação.

**Aceite:** usar massa de 50 módulos/1.000 aulas; toda aula alcançável, sem lista cortada ou montar todos os players; estados de sem resultado e erro; conferir larguras da especificação e teclado. Não inventar paginação apenas visual sobre downloads gigantes: medir resposta e evoluir contrato se necessário.

## T07 — Esquema versionado, IDs e migração segura

**Dependência:** T00/T02/T04. **Arquivos:** backend, documentação de dados, novos scripts de migração e testes. **Dividir:** T07a esquema/diagnóstico; T07b migração em cópia; T07c leitura compatível.

**Fazer:** versão de esquema, IDs estáveis, posições e status; mapear cabeçalhos uma única vez; eliminar escrita em coluna fixa presumida. Relações de matrícula por IDs e unicidade de e-mail. Gerar relatório de órfãos/duplicatas antes de corrigir. Manter adaptador de leitura legado durante transição. Não mesclar turmas/cursos por título.

**Aceite:** dry-run não escreve; reexecutar migração não duplica; contagens e relações reconciliadas; IDs/progresso preservados; conflitos pedem decisão em relatório.

## T08 — CRUD completo, ordem e recuperação

**Dependência:** T03/T04/T07. **Arquivos:** administração, cliente, backend; novos componentes de formulário e serviços.

**Dividir:** T08a editar/arquivar/restaurar módulo; T08b mover/reordenar/duplicar aula; T08c alunos/turmas/matrículas.

**Fazer:** versões para evitar sobrescrita silenciosa; UUIDs e idempotência; validação no servidor; opcionais limpáveis; posições estáveis. Arquivar curso/módulo oculta descendentes da área do aluno sem perder histórico. Não restaurar automaticamente descendente arquivado independentemente. Ordenação por arraste e botões. Duplicação inicia rascunho e não copia progresso. Cadastro com e-mail único, edição, bloqueio e revogação.

**Aceite:** todas as operações sobrevivem a recarga; IDs e vínculos válidos; reordenar em celular/teclado; administrador concorrente recebe conflito recuperável; duplicar gera IDs novos; bloqueado perde acesso na API; arquivar/restaurar preserva progresso. Nenhuma edição manual de planilha para tarefas habituais.

## T09 — Aula com múltiplos recursos

**Dependência:** T05/T07/T08. **Arquivos:** modelos/adaptadores, editor de aula, player e renderizadores.

**Fazer:** separar aula de recurso; conteúdo principal, materiais e revisão; adicionar/editar/ordenar recursos. Compatibilidade: cada aula legada começa com um recurso, preservando ID/progresso. Agrupamento editorial opcional com prévia e mapa antigo→novo; não unir automaticamente por título.

**Aceite:** vídeo/áudio/PDF/imagem/slides/flashcards continuam utilizáveis; regra de conclusão documentada; recursos opcionais não aumentam artificialmente total de aulas; agrupamento preserva mapa e progresso segundo regra aprovada; curso legado permanece íntegro antes de qualquer agrupamento.

## T10 — Biblioteca e entrada em lote

**Dependência:** T03/T04/T09; escolha de armazenamento e acesso público/restrito. **Dividir:** T10a biblioteca de links; T10b upload; T10c lote.

**Fazer:** primeiro catalogar links existentes com prévia/tipo/validação. Depois integrar upload com limites de tipo/tamanho, progresso e credencial temporária; nunca chave privada no navegador. Como o login não verifica identidade, não prometer arquivos privados por matrícula. Substituir proxy público de CSV por origem sob controle do projeto. Importação com prévia, erros por linha, deduplicação e reexecução segura.

**Aceite:** cadastrar material sem copiar fórmulas/editar banco; interrupção de upload tem recuperação e limpeza de órfãos; recurso sem acesso falha claramente; lote misto informa sucessos/falhas sem duplicar; conteúdos reais não são enviados a terceiros sem configuração autorizada. Testar permissões reais no provedor escolhido.

## T11 — Fluxo editorial e configurações

**Dependência:** T08/T09; upload avançado pode esperar T10. **Dividir:** T11a rascunho/publicação/prévia; T11b modelos/configurações.

**Fazer:** rascunho, publicado e arquivado com regras aplicadas no servidor; prévia administrativa; modelos de aula; logo, nome, cores e contato; histórico de edições. Configuração aceita somente chaves permitidas, nunca CSS/JS arbitrário ou segredos. Adiar autosave até existir resolução de conflito.

**Aceite:** aluno nunca lê rascunho nem por ID; publicar disponibiliza somente para matriculados; correção de aula não destrói histórico; modelo reduz preenchimento; alterar suporte/logo reflete na interface; configurações não permitem elevar permissões.

## T12 — Relatórios úteis e manutenção

**Dependência:** T03/T07/T08/T11. **Arquivos:** serviço de relatórios, administração e backend.

**Fazer:** filtros por curso/turma/período, percentual de conclusão, última atividade quando passar a ser registrada e alunos sem início; paginação e exportação. Diferenciar zero de dado não coletado; não atribuir tempo assistido retroativo. Trilha de auditoria. Rotina de links quebrados deve respeitar quotas e tratar resultado inconclusivo de provedores externos.

**Aceite:** métricas reconciliadas com matrículas/progresso, datas históricas ausentes marcadas como indisponíveis; exportação com acentos e neutralização de fórmulas CSV; acesso apenas por papel autorizado; restauração ensaiada e registrada. Lembretes externos ficam para tarefa específica com política de envio definida.

## T13 — Desempenho e acessibilidade

**Dependência:** T06 e funcionalidades entregues até aqui. **Arquivos:** entrada/rotas, renderizadores de mídia, estilos e cliente/cache/backend.

**Fazer:** imports dinâmicos de páginas e PDF.js; worker alinhado à versão instalada; imagens adequadas e lazy loading; cache com chave de usuário/curso/versão, expiração e invalidação por acesso/publicação; reduzir leituras repetidas e indexar relações por requisição. Evitar servir conteúdo privado após revogação apenas porque existe cache. Medir antes/depois sob cenário reproduzível.

**Aceite:** login não baixa PDF.js; registrar bundles, duração das chamadas e carga simulada; sem misturar cache entre e-mails selecionados. Percurso completo por teclado, nomes acessíveis, contraste, reflow e redução de movimento; iOS/Android quando disponíveis. Não prometer nota de Lighthouse ou conformidade WCAG sem medição.

## T14 — Homologação, corte e acompanhamento

**Dependência:** correções P0 e escopo escolhido aprovados em homologação.

**Fazer:** comparar versão local e implantada; checklist de migração; atualizar endpoint/base path conforme ambiente; teste com administrador e alunos de turmas diferentes; plano de rollback com versões compatíveis de dados/front/back. Implantação somente após autorização específica para publicar a versão concreta.

**Corte desta mudança:** o front-end novo chama `get_profile`; o backend antigo só conhece `login` e ainda emite token. Publicar uma versão sem a outra causa falha de entrada, então a troca precisa de janela coordenada e teste imediato. A coluna antiga de token pode ficar intacta e sem uso; não é necessário editar a planilha para a entrada por e-mail funcionar.

**Aceite:** login, matrícula, publicação, mídias, conclusão e administração conferidos; nenhuma perda de dados; responsável consegue executar um ciclo completo sem planilha; logs/alertas de erro acessíveis e responsável definido. Migração de infraestrutura é projeto separado se os gatilhos documentados forem atingidos.

## Definição de pronto para qualquer tarefa

- Escopo pequeno, diff revisável; sem trocar framework por conveniência.
- Build e testes pertinentes passam; não afirmar sucesso de ambiente não executado.
- Estados de carregamento, vazio, erro e nova tentativa quando houver rede.
- Mudança de dados com compatibilidade e rollback de código quando aplicável.
- Registrar limitações concretas e atualizar contratos/documentação afetados.
- Não incluir tokens, alunos reais ou prints com dados pessoais em testes/documentos.

## Linha de base desta auditoria

- Antes da implementação, `npm run build` passou com Node v24.11.1, Vite v8.0.3 e 21 módulos transformados.
- Saída anterior: JS principal 473,42 kB (gzip 138,61 kB); CSS 28,85 kB (gzip 6,05 kB); HTML 0,95 kB. São tamanhos do build, não medição da experiência em celular.
- Vite informou aviso de tempo gasto nos plugins CSS. Tempo reportado de build: 41,76 s; não usar como benchmark de runtime.
- Na primeira etapa, `npm test` foi adicionado. Nesta etapa, dez cenários de contrato da API, autorização, relatório, progresso e edição passaram. `npm run build` passou com 22 módulos transformados, JS 475,15 kB (gzip 138,87 kB) e CSS 31,13 kB (gzip 6,65 kB). `git diff --check` passou.
- Vídeo: quadros amostrados entre 0 e 74 s; não é inspeção de cada frame nem teste mobile.
- Produção, banco e operações autenticadas: não acessados.

## Registro de continuidade

| Item | Estado | Evidência | Próximo passo |
|---|---|---|---|
| Auditoria e especificação | Concluída | 01, 02 e 03; build acima | Manter documentos alinhados ao código |
| T01 login visual | Concluída no código local | `LoginPage.js`, `login.css`; conferido em desktop, 320 e 390 px, build passou | Testar dispositivo real |
| T02 autorização | Parcial | Regra comum de acesso no catálogo, conteúdo, progresso e relatório administrativo; testes de matrícula e IDs diretos; lock no progresso | Homologar no Apps Script real; concluir validações/contratos |
| T05 progresso | Parcial | Interface mostra falha e desfaz conclusão; primeiro módulo vazio corrigido | Retomar aula, navegação e descarte do PDF |
| T03 e-mail sem token | Implementado no código local | Login retorna perfil sem token; API envia e-mail em POST; testes locais | Homologar Apps Script implantado, que pode estar em versão anterior |
| T06 navegação do curso | Parcial | Só renderiza aulas do módulo aberto; busca, drawer mobile, anterior/próxima e retomada local; prévia fictícia de 18 módulos/72 aulas testada em desktop, 390 e 320 px | Testar celular real e visão geral do curso |
| T08 edição administrativa | Parcial | Renomear módulo pelo painel; limpar descrição/capa/URL; campos com aspas/caracteres especiais tratados; prévia fictícia testada em 320 px | Reordenação, movimentação, arquivamento e homologação real |
| T04a cliente HTTP | Parcial | Cliente único em `src/api.js`; painel reutiliza transporte; teste de contrato | Revisar demais ações e respostas em homologação |
| T00, T04b, T07–T14 | Pendentes | Nenhuma implementação registrada | Próximo bloco: homologação de T02/T03 e painel de conteúdos T08 |

Ao concluir, acrescentar: ID da tarefa; data; arquivos; comandos e resultados; teste visual realizado; mudança de contrato/esquema; risco restante; próxima tarefa desbloqueada. Manter esse registro curto para facilitar continuidade com menos contexto.
