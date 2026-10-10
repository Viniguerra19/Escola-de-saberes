# Publicar a Escola de Saberes 2.0

## Os arquivos que você vai usar

- `Code.gs` e `code.js`: cópias idênticas do backend completo. Cole **uma delas** no arquivo de código do projeto Apps Script atual. Não crie duas cópias de funções no mesmo projeto.
- `hospedagem.zip`: build pronto. Seu conteúdo deve ficar diretamente na pasta pública da escola, junto do `index.html`, e não dentro de uma pasta extra chamada `dist`.
- `config.js`, dentro da hospedagem: endereço da API. Já contém o endpoint usado pelo projeto. Só altere `apiUrl` se criar uma implantação com URL diferente.
- `SHA256SUMS.txt`: conferência dos arquivos entregues.

Não é preciso instalar Node ou executar npm na hospedagem. Use HTTPS. A aplicação funciona em `/escoladesaberes/`, em outra subpasta ou na raiz; as rotas usam `#/`.

## Sequência de publicação

1. Confirme que você está com acesso ao projeto Apps Script, à planilha e aos arquivos atualmente publicados.
2. No projeto Apps Script existente, substitua o conteúdo completo do arquivo de código pelo `Code.gs` entregue. Mantenha apenas uma definição de `doGet` e `doPost`. O ID da planilha atual já está configurado em `DB_ID`.
3. Salve. Se houver autorização pendente, execute `autorizarEscola` uma vez pelo editor usando a conta proprietária e conceda as permissões solicitadas para Planilhas e Drive. Os alunos continuam entrando apenas por e-mail e não precisam autorizar o Google.
4. Em **Implantar → Gerenciar implantações**, edite a implantação atual e escolha **Nova versão**. Mantenha a execução como proprietário e o acesso compatível com entrada pública da aplicação. Usar a implantação existente preserva o endereço `/exec`.
5. Suba **todo o conteúdo** de `hospedagem.zip` para a pasta pública da escola: `index.html`, `config.js`, `assets/`, ícones e `.htaccess` quando a hospedagem aceitar Apache. Não substitua a raiz de um WordPress inteiro: use a pasta dedicada da Escola.
6. Se o endereço `/exec` mudou, edite somente `config.js`. Nunca use a URL `/dev` no site público.
7. Abra o site, entre com o e-mail administrativo existente e visite **Administrar → Manutenção**. Confira o diagnóstico. Use **Preparar estrutura** para criar as abas e colunas novas de forma aditiva; não é preciso editar células manualmente.
8. Confira um curso e uma aula antigos, o progresso de um aluno e um novo rascunho. Publique uma aula de teste e confirme que aparece para um aluno matriculado. Arquive-a pelo painel quando terminar.

O frontend e o backend são um par de versão. Faça a troca dos dois na mesma janela: o frontend anterior não é compatível com as novas operações administrativas.

## Atualização nos navegadores

Publique também o `.htaccess`, `sw.js` e `service-worker.js` incluídos no ZIP. No Apache, o HTML e a configuração são enviados sem armazenamento em cache; os arquivos JS/CSS compilados recebem nomes novos conforme seu conteúdo. Os dois arquivos de worker retiram registros antigos instalados nesses endereços. A página também remove registros da própria pasta da Escola ao carregar.

Se a hospedagem usar Nginx ou outro servidor, configure `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` para `index.html`, `config.js`, `sw.js` e `service-worker.js`. Se houver CDN ou cache da hospedagem, limpe o cache da pasta da Escola após enviar os arquivos. Uma página antiga já armazenada pode continuar aparecendo enquanto o servidor/CDN entregar essa cópia; os arquivos locais precisam ser publicados para a correção chegar aos alunos.

## Como usar

**Conteúdos:** escolha curso e módulo; crie ou edite aula; acrescente materiais; salve em rascunho; veja a prévia; publique quando estiver pronto. Curso, módulo e aula precisam estar publicados para aparecer ao aluno. Mover uma aula é escolher outro módulo no editor. As setas ordenam cursos, módulos, aulas e materiais e funcionam em celular e teclado. Duplicar cria rascunho e não copia conclusões.

**Arquivar:** oculta o conteúdo sem apagar IDs nem progresso. Arquivar um curso/módulo oculta os descendentes. Restaurar retorna somente o item escolhido para rascunho; os estados dos descendentes são preservados.

**Matrículas:** cadastre nome/e-mail, marque os cursos liberados e salve. O e-mail é único e permanece estável na edição. Bloqueio impede consultas e gravações futuras na API. Cadastros antigos continuam usando a regra legada de curso/turma até serem salvos; renomear um curso preserva automaticamente essas matrículas convertendo-as para IDs.

**Biblioteca:** cadastre links, texto ou flashcards e reutilize cópias nas aulas. Atualizar o item da biblioteca não altera silenciosamente as cópias já usadas nas aulas. O envio ao Drive aceita até 5 MB por arquivo (PDF, PNG, JPEG, WebP, MP3, M4A, MP4 e CSV); o formulário pede confirmação de que o link pode ser público. Vídeos grandes devem ser hospedados e adicionados por link. Se a organização bloquear compartilhamento público, o painel informa a falha.

**Flashcards:** use CSV de duas colunas (pergunta e resposta), colado no editor ou em um link público. Não há proxy público de terceiros. O Apps Script lê o link configurado no material. Vídeos YouTube e arquivos Drive são incorporados de suas origens; URLs diretas dependem de formato compatível e, para PDF, permissão CORS da hospedagem. Sempre há abertura do original quando o PDF direto não puder ser exibido.

**Importação:** CSV com cabeçalho `titulo,tipo,url,texto`, até 100 aulas por lote. Valide a prévia antes de importar. Erros e duplicatas impedem o lote; a importação cria rascunhos. Há um arquivo de exemplo na entrega.

**Relatórios:** filtre por curso, turma e data de última atividade; exporte CSV ou use Imprimir/PDF. “Atividade” é a atualização da conclusão, não tempo de vídeo assistido. Datas antigas que nunca foram coletadas aparecem como “Não registrado”. Administradores não contam como alunos no relatório.

**Configurações:** nome, logo, cor, boas-vindas e link de suporte. Os valores refletem nas próximas telas e acessos.

## Dados da planilha

O Apps Script não cria rotinas de cópia ou restauração. A Escola de Saberes usa a planilha atual como fonte de dados; o histórico e os recursos de recuperação seguem as políticas do Google Planilhas e da conta proprietária. Para publicar uma versão anterior, republique juntos o código e os arquivos web compatíveis.

## Limites reais desta entrega

A entrada por e-mail foi mantida conforme solicitado: não comprova identidade. Quem conhece o e-mail de um administrador pode agir como ele. O histórico registra o e-mail informado, não autoria comprovada. Os links de mídia não são protegidos por DRM nem por senha.

Os testes automatizados usam serviços Google simulados. A inspeção visual foi feita em navegador desktop com tamanhos de celular; não substitui teste em iPhone/Android real. Não foram acessados nem modificados a planilha, o projeto Apps Script ou a hospedagem de produção. Autorizações Google, permissões reais de mídia e respostas do ambiente publicado precisam da conferência dos passos 7–8.

Esta entrega cobre o LMS de cursos/módulos/aulas, materiais, conclusão autodeclarada, gestão, publicação, matrículas e manutenção. Não inclui SCORM/xAPI, provas com nota, certificados acreditados, cobrança, videoconferência, DRM ou aplicativo nativo/offline. Não há promessa de conformidade com padrões externos ou de capacidade ilimitada do Google Planilhas.

## Referências oficiais de publicação

- [Web Apps do Apps Script](https://developers.google.com/apps-script/guides/web)
- [Compartilhamento de arquivos no Drive](https://developers.google.com/apps-script/reference/drive/file#setSharing(Access,Permission))
