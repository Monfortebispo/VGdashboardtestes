# VG Dashboard — Segurança e Autenticação v3

Esta versão parte da Shared Storage v2 e mantém as correções do Core v1.

## O que mudou

### 1. Autenticação passou para o servidor
- A lista de utilizadores e as passwords deixaram de existir no `index.html`.
- O login é validado pela função Netlify `dashboard-sessao`.
- O browser recebe apenas os dados públicos do utilizador e um token de sessão assinado.
- A sessão tem validade de 12 horas.

### 2. Passwords protegidas
- As passwords são guardadas no Netlify Blob `users` com `scrypt` e salt individual.
- O endpoint de utilizadores nunca devolve hashes, salts ou passwords ao browser.
- O formato antigo com `pass` em texto simples é migrado automaticamente no primeiro pedido de login.
- O `localStorage` antigo de utilizadores é removido pelo frontend.

### 3. Troca obrigatória da password inicial
- Contas migradas que ainda usem a password inicial histórica são identificadas automaticamente.
- Após o primeiro login, aparece uma janela obrigatória para definir uma nova password.
- Regra para novas passwords: mínimo de 8 caracteres, com pelo menos uma letra e um número.
- Cada utilizador passa a ter um botão `Palavra-passe` para alterar a sua própria credencial.

### 4. Gestão de utilizadores segura
A Direção continua a gerir utilizadores no Setup, mas:
- a password atual nunca aparece no formulário;
- deixar o campo password vazio mantém a credencial existente;
- uma nova conta exige password temporária;
- uma password definida/reset pela Direção obriga o utilizador a alterá-la no login seguinte;
- inativar uma conta invalida as sessões dessa conta;
- o utilizador principal de recuperação não pode ser inativado nem retirado da Direção.

### 5. Permissões validadas no servidor
Todos os Blobs da dashboard passaram a exigir autenticação.

- Direção de Operações: leitura e escrita global, Setup e importação/publicação de dados.
- Diretor / Assistente: leitura global; escrita apenas da Ficha do Hotel associada à conta e presença online.
- Auditoria: todos podem criar eventos; apenas a Direção consulta a tabela completa.
- Recursos internos de segurança (`_auth-*`, rate-limit, etc.) nunca são expostos pela API genérica.

Mesmo que alguém altere manualmente o HTML ou o `sessionStorage`, a função Netlify volta a verificar o utilizador real e as permissões antes de aceitar uma gravação.

### 6. Página de carregamento
- Foi removida a senha fixa que existia no HTML.
- A página de carregamento é agora acessível apenas a perfis de Direção.
- A publicação dos dados é novamente validada no servidor.

### 7. Proteção contra tentativas de login
- Limite de tentativas falhadas por utilizador/origem dentro de uma janela temporal.
- Após várias falhas consecutivas, o login fica temporariamente bloqueado para essa combinação.

### 8. Auditoria mais fiável
- O servidor passa a preencher a identidade do utilizador do registo de auditoria.
- O browser não consegue publicar um evento fazendo-se passar por outro utilizador.

## Primeira publicação desta versão

1. Substituir no repositório os ficheiros desta versão.
2. Aguardar o deploy Netlify concluir com sucesso.
3. Abrir a dashboard e voltar a iniciar sessão (as sessões antigas v5 não são reutilizadas).
4. No primeiro login, a função migra automaticamente o Blob antigo de utilizadores para hashes seguros.
5. Quem ainda tiver a password inicial será obrigado a criar uma nova.

Não é necessário criar variáveis de ambiente ou instalar novos serviços. O segredo usado para assinar as sessões é gerado pela função e guardado num Blob interno que não é acessível pela API pública.

## Validação efetuada

- Sintaxe de todos os blocos JavaScript do `index.html`.
- Sintaxe da função Netlify.
- Login sem token / com token.
- Leitura autenticada de dados.
- Bloqueio de recursos internos.
- Passwords nunca devolvidas ao frontend.
- Alteração de password e invalidação do token anterior.
- Diretor impedido de gerir utilizadores.
- Diretor impedido de publicar dados globais.
- Diretor autorizado a gravar apenas a Ficha do seu próprio hotel.
- Direção autorizada a publicar dados globais.
- Inativação de utilizador invalida a sessão existente.
- Migração de registos antigos com password em texto simples.
- Rate-limit de tentativas de login.
- Identidade de auditoria imposta pelo servidor.
