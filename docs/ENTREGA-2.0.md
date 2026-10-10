# Entrega 2.0 — Escola de Saberes

## Implementado

- E-mail cadastrado sem senha/token, perfil e permissões consultados no servidor.
- Frontend responsivo; catálogo com busca/progresso; visão geral de curso; módulos recolhíveis; busca em títulos; drawer mobile com foco/Escape; links diretos e retomada local por e-mail/curso.
- Aula com múltiplos materiais: vídeo, áudio, PDF, imagem, sequência de slides, flashcards, texto e link. Concluir não remonta a mídia; erro reverte indicador; descarte de players/PDF ao sair.
- Painel para cursos, módulos, aulas, materiais e alunos. Editar, ordenar por botões, mover aulas, duplicar, rascunho/publicado/arquivado, prévia, recuperação e bloqueio.
- Matrículas por ID com adaptador legado. Renomear cursos converte vínculos legados antes da alteração. UUIDs, validação, trava de gravação, versões e identificadores de operação.
- Esquema aditivo por cabeçalhos, sem escrita em colunas fixas. Alterações de um registro preservam as fórmulas e colunas não gerenciadas.
- Biblioteca, upload Drive até 5 MB e CSV de aulas com prévia sem gravação, erros e deduplicação.
- Configurações de identidade, relatórios filtráveis, CSV protegido contra fórmulas e impressão/PDF.
- Diagnóstico estrutural, histórico operacional e verificação limitada de links.
- Páginas e PDF carregados sob demanda. Worker PDF distribuído junto do build; nenhum CDN necessário para a biblioteca PDF.
- Empacotamento reproduzível: build relativo, endpoint editável em config.js, ZIP da hospedagem, arquivo único de backend e somas SHA-256.

## Validação executada

- 22 testes Node: contratos, matrícula/turma, IDs diretos, bloqueio, rascunhos, progresso idempotente, conflito de versão, duplicação, ordenação, preparação aditiva, importação sem efeitos no dry-run e preservação de colunas externas.
- Massa de 1.000 aulas no backend simulado; no navegador, 51 módulos e 1.000 aulas com busca da aula 999.
- Navegador local: painel, edição de aula com aspas e `&`, múltiplos materiais, flashcards, conclusão preservando material atual e drawer em 320/390 px; desktop também inspecionado.
- Build com imports separados. O bundle de entrada passou de aproximadamente 475 kB para aproximadamente 12 kB (sem contar CSS e chunks carregados conforme a tela). PDF ~410 kB é carregado somente ao abrir PDF direto.

## Escopo e pendências externas

A implementação não instala nem publica serviços Google automaticamente. Produção, autorização do proprietário, arquivos reais e dispositivos físicos não foram testados. Consulte PUBLICAR.md para o corte coordenado e a validação após publicar. Esses são passos operacionais externos, não funções simuladas apresentadas como prontas.

O plano anterior em docs/reformulacao permanece como histórico do diagnóstico. T00–T13 tiveram a implementação consolidada nesta entrega, com as escolhas de produto acima: ordenação por botões (sem arraste); biblioteca por cópia; conclusão manual; upload simples com limite. T14 é a publicação e a conferência no ambiente real. SCORM, provas, pagamentos e certificados não fazem parte deste pacote.
