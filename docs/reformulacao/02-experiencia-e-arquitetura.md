# Escola de Saberes — experiência e arquitetura propostas

Especificação de produto, não funcionalidades já implementadas. Complementa o diagnóstico. Os exemplos de agrupamento são sugestões editoriais: não unir conteúdos existentes automaticamente apenas porque os títulos se parecem.

## Organização que cresce sem alongar a lateral

Hierarquia: **Curso → Módulo/assunto → Aula → Recursos**. Categorias e etiquetas ajudam a encontrar assuntos; não precisam criar mais níveis obrigatórios.

Exemplo: Desenvolvimento Mediúnico → Ritos → Batismo → vídeo principal, áudio, guia PDF, imagens e flashcards. Uma aula pode ter vários recursos. Um rito muito amplo pode ser um módulo próprio; o sistema não deve impor que todos os ritos fiquem em um único módulo.

Hoje, um vídeo, um podcast e um PDF podem virar três entradas laterais. Na proposta, quando forem materiais da mesma unidade de estudo, ficam dentro de uma aula. Materiais independentes continuam como aulas independentes. Esta decisão diminui ruído sem apagar conteúdo.

### Aluno: início

- “Continuar estudando” com curso, módulo e última aula acessada.
- “Meus cursos”, progresso salvo e acesso aos módulos.
- Busca por curso, assunto e aula, limitada ao conteúdo que o aluno pode acessar.
- Estados claros: sem matrícula, sem resultado, carregando, e-mail removido da lista e erro com nova tentativa.
- Novidades apenas quando houver publicações reais; evitar painéis cheios de indicadores sem utilidade.

### Curso: visão geral

- Título, descrição breve, progresso e botão continuar.
- Grade/lista de módulos pesquisáveis, com quantidade de aulas e conclusão.
- Filtros “Todos”, “Em andamento” e “Concluídos”. Etiquetas para Ritos, Fundamentos etc., configuráveis.
- Paginação/carregamento incremental quando necessário; não montar todo o catálogo e todas as aulas ocultas.

### Tela de estudo: computador

```text
Escola de Saberes                               Meu perfil
Meus cursos / Desenvolvimento / Ritos
┌──────────────────────┬───────────────────────────────────┐
│ ← Todos os módulos   │ Batismo                           │
│ Ritos                │ Aula 2 de 6                       │
│ Buscar neste módulo  │                                   │
│ 1. Introdução      ✓ │              Vídeo                │
│ 2. Batismo     atual │                                   │
│ 3. …                 │ Sobre a aula | Materiais          │
│                      │ Ouvir áudio · Guia PDF · Revisar  │
│ Progresso do módulo  │ [Concluir aula]  Salvo             │
│                      │ [Anterior]               [Próxima]│
└──────────────────────┴───────────────────────────────────┘
```

Lateral com largura aproximada de 280–320 px, rolagem própria limitada à área disponível; conteúdo principal flexível. Mostrar as aulas do módulo atual e um caminho óbvio para trocar de módulo. URL identifica curso e aula para compartilhar/retomar, sempre com verificação de acesso.

### Tela de estudo: celular

```text
← Curso                         Meu perfil
Ritos · Aula 2 de 6
Batismo
┌────────────────────────────────────────┐
│                 Vídeo                  │
└────────────────────────────────────────┘
[Sobre a aula]  [Materiais]
Descrição curta e recursos da aula
[Concluir aula]           Salvo
[Anterior]               [Próxima]
[Aulas deste módulo · 2/6]
```

“Aulas deste módulo” abre um painel com título, busca, lista, botão fechar e “Todos os módulos”. Fechar ao selecionar, ao pressionar Escape ou tocar fora; conter foco e devolvê-lo ao acionador. Garantir que o painel possa ocupar a tela em dispositivos estreitos. Não depender só de um ícone ☰ flutuante.

Cabeçalho compacto; sem tabela larga ou barra permanente roubando espaço. O vídeo conserva proporção; PDF tem ajustar à largura, página anterior/próxima, zoom e abrir externamente. Barra fixa, se usada, reserva espaço no conteúdo e respeita a área segura do aparelho. Swipe complementa botões, não substitui ações acessíveis.

### Login

- Uma única composição com marca, “Entre na Escola de Saberes”, explicação curta e campo de e-mail.
- Fundo consistente com o restante da plataforma; remover blocos de fundo conflitantes e gradiente pouco legível no título.
- Formulário até aproximadamente 420 px; padding fluido; `min-height:100dvh` com fallback e rolagem disponível quando o teclado abrir.
- E-mail com fonte de pelo menos 16 px, autocomplete e rótulo visível; botão com estado de envio e erro associado ao campo.
- Conforme decisão do responsável, basta informar um e-mail cadastrado. Não há token, senha, código ou verificação de posse do e-mail. O navegador guarda o perfil escolhido e o Apps Script consulta a linha correspondente para cada operação.
- Este fluxo permite usar o e-mail de outro aluno ou administrador. Interface e documentação não devem dizer que o acesso é seguro ou que arquivos e progresso são privados.

### Direção visual

Preservar nome, logo e vínculo com o Terreiro. Usar a paleta institucional validada com o responsável; proposta inicial: superfícies escuras neutras, texto claro, uma cor principal de ação e cores de estado. Evitar gradientes diferentes no login e na navbar. Não inferir uma identidade religiosa nova.

Padronizar tipografia, espaçamento, campos, botões, cards, modal e notificações. Texto principal de 16 px como referência de projeto; títulos longos devem quebrar linha. Alvos de toque preferencialmente de 44 px, foco visível e contraste verificado. Respeitar redução de movimento. Tema claro é melhoria posterior, não requisito para desbloquear a reforma.

## Administração para quem tem pouco tempo

Menu: **Visão geral · Conteúdos · Biblioteca · Alunos e turmas · Relatórios · Configurações**.

Fluxo habitual: abrir curso → “Nova aula” → escolher modelo → adicionar arquivos/links → pré-visualizar → publicar. Modelos podem preencher estrutura de “Aula com vídeo”, “Rito com guia”, “Áudio de estudo” e “Revisão com flashcards”. O administrador continua podendo editar cada campo.

| Operação | Comportamento esperado |
|---|---|
| Criar/editar módulo | Nome, descrição e ordem no painel; nenhuma alteração manual de aba |
| Reordenar | Arrastar no desktop e botões mover acima/abaixo por toque/teclado; persistência no servidor |
| Mover/duplicar aula | Escolher destino; duplicação começa como rascunho, com IDs novos; não copiar conclusão dos alunos |
| Adicionar mídias | Selecionar da biblioteca, enviar arquivos ou colar links; mostrar progresso, tipo, erro e possibilidade de tentar novamente |
| Inserir em lote | Prévia editável, detecção de duplicatas, validação por item e relatório de falhas; não exigir fórmula de URL com `{n}` |
| Rascunho/publicação | Salvar sem expor ao aluno; prévia usa autorização administrativa; publicação explícita |
| Corrigir | Campos opcionais podem ser limpos; alterações persistem após recarregar; histórico informa autor e data |
| Excluir | Arquivar por padrão, explicar impacto e permitir restaurar; purga definitiva é operação separada |
| Alunos/turmas | Buscar, editar cadastro, matricular, transferir turma e bloquear; ações em lote com prévia |
| Configurar | Logo, cores validadas, contato de suporte e regras pedagógicas; segredos ficam no servidor |

Autosave somente após implementar versões e tratamento de conflitos. Antes disso, “Salvar rascunho” explícito é preferível a um indicador de salvamento sem garantia. Distinguir prévia administrativa de “entrar como aluno”: não reutilizar a identidade do aluno silenciosamente.

## Dados e backend

Modelo lógico alvo implementado gradualmente em abas do Google Planilhas:

| Entidade | Campos/relações centrais |
|---|---|
| Usuário | ID estável, nome, e-mail único normalizado, papel, status |
| Perfil local | E-mail selecionado no navegador; não é identidade verificada |
| Curso | ID, título, descrição, capa, status, versão |
| Turma | ID, nome; relação com curso/oferta, sem depender de substring no título |
| Matrícula | Usuário + curso/oferta + turma opcional + status; unicidade explícita |
| Módulo | ID, curso, título, descrição, posição, status |
| Aula | ID, módulo, título, descrição, posição, status, regra de conclusão, versão |
| Recurso | ID, aula, mídia da biblioteca, tipo, posição, obrigatório/opcional |
| Mídia | ID, origem/objeto, nome, MIME, tamanho, acesso público/restrito, texto alternativo/legenda |
| Progresso | Usuário + aula únicos, conclusão, data e última posição quando suportada |
| Histórico de estudo | Usuário + curso, última aula e última visita |
| Histórico operacional | E-mail informado, ação, entidade, data e revisão; a autoria não pode ser comprovada |
| Configuração | Chaves permitidas e valores validados; separado de credenciais |

Manter cursos de turmas diferentes separados inicialmente. Compartilhar conteúdo por ofertas/turmas pode vir depois de comparar programas; não mesclar automaticamente os cursos “Sexta” e “Sábado”.

### Caminho incremental recomendado

1. Corrigir autorização e contratos no Apps Script existente, usando um ambiente de teste.
2. Unificar o cliente de API e separar interface, regras de negócio e persistência. Manter o front-end atual enquanto componentes são extraídos por necessidade.
3. Adicionar IDs/relações, posição, status e revisões com migrações versionadas e repetíveis. Enquanto estiver em Sheets, usar validação de esquema, escritas em lote e locks.
4. Levantar onde ficam as mídias, volume de arquivos e custo antes de implementar upload. Conteúdo realmente restrito não pode depender de acesso somente por e-mail informado.
5. Manter Google Planilhas como banco conforme decisão do responsável. Planejar abas e índices auxiliares, quotas, concorrência e migrações dentro desse ambiente. Autenticação e armazenamento de mídias podem usar serviços próprios sem substituir o banco de dados.

Se quotas, concorrência ou latência se tornarem problemas, medir e otimizar as leituras e escritas do Apps Script, a organização das abas e o cache antes de propor outra infraestrutura. A escolha atual do Google Planilhas permanece como requisito do projeto.

### Regras de integridade

- IDs não mudam ao renomear conteúdo; matrícula não depende de título ou slug.
- Progresso é idempotente e vinculado a uma aula autorizada; aula arquivada não desaparece da auditoria.
- Publicar novos recursos opcionais não reinicia conclusão. Alterar exigências pedagógicas exige regra explícita/versionada.
- Na migração de várias entradas para uma aula, preservar IDs antigos em mapa; marcar nova aula concluída apenas se todos os itens definidos como obrigatórios estavam concluídos. Prévia para aprovação editorial, sem fusão por similaridade automática.
- Links externos permanecem links; migrar o banco não torna vídeos públicos privados. Com acesso por e-mail não verificado, restrição de download por matrícula não oferece privacidade real.

## Teste de aceite do produto

Usar dados fictícios: curso com 50 módulos/1.000 aulas, módulo vazio no início, títulos extensos, acentos, caracteres especiais, mídia indisponível, PDF grande e usuários com matrículas diferentes. A massa grande é cenário de teste, não volume atual informado.

Testar larguras 320, 360, 390, 768, 1024 e 1440 px; retrato/paisagem; zoom 200%; teclado; foco; rede lenta e indisponibilidade. Completar também em Safari iOS e Chrome Android reais quando disponíveis, registrando o que foi somente emulado.

Critérios: nenhuma aula inacessível por corte de lista; navegação sem rolagem horizontal da página; botão importante sempre alcançável; conclusão não é exibida como salva quando falhou; conteúdo não autorizado não aparece nem pela API; criar, corrigir, ordenar, publicar, arquivar e restaurar pelo painel sem abrir a planilha.
