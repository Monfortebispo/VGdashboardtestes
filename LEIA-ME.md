# VG Dashboard v8.1 — correção de deploy

A v8.1 corrige a integração da Gestão de Ações no `index.html`. A primeira v8 continha os ficheiros do módulo, mas faltavam as referências CSS/JS e o markup dos modais; a suite automática detetou a falha e bloqueou corretamente o deploy.

**Validação v8.1: 8/8 suites aprovadas.**

# VG Dashboard — Gestão de Ações v8

A v8 parte da Central de Operações v7 e fecha o ciclo entre identificar uma prioridade e acompanhar a respetiva resolução.

## O que mudou

### 1. Prioridade → ação

Cada prioridade da Central de Operações passa a poder ter uma ação associada. A ação guarda:

- hotel e prioridade de origem;
- responsável;
- prazo;
- estado;
- comentários/atualizações;
- histórico cronológico;
- utilizador que criou/alterou;
- data de criação, atualização e resolução.

Estados disponíveis:

- `Por iniciar`;
- `Em curso`;
- `A aguardar`;
- `Resolvido`.

### 2. Indicadores de execução no Resumo

A Central mostra agora também:

- Ações abertas;
- Sem responsável;
- Fora do prazo;
- Em curso;
- Resolvidas nos últimos 7 dias.

Estes indicadores respeitam os hotéis ativos no filtro. Ao contrário da prioridade automática, as ações abertas permanecem visíveis mesmo quando foram criadas noutro período, para não se perder acompanhamento ao mudar o mês selecionado.

### 3. Acompanhamento de ações

No lado direito do Resumo existe uma lista das ações abertas mais urgentes. A ordenação coloca primeiro as ações fora do prazo, depois as que têm prazo mais próximo.

O botão `Ações` abre o quadro completo, com filtros por:

- estado;
- hotel;
- pesquisa por hotel, responsável ou assunto.

### 4. Histórico partilhado

Cada ação tem um histórico imutável de utilização normal. O servidor acrescenta automaticamente:

- criação;
- alteração de responsável;
- alteração de prazo;
- alteração de estado;
- comentários.

A identidade usada no histórico vem da sessão autenticada no servidor, e não do texto enviado pelo browser.

### 5. Netlify Blobs por ação

Cada ação é guardada num Blob individual com prefixo `ops-action/`. Isto evita que duas alterações a ações diferentes tenham de regravar um único ficheiro global.

A listagem agregada é feita pelo endpoint autenticado `ops-actions`.

### 6. Permissões

- Direção: cria e altera ações de qualquer hotel.
- Diretor: cria e altera ações do hotel associado à sua conta.
- Responsável atribuído: pode atualizar a ação que lhe foi atribuída, mesmo quando a ação pertence a outra unidade.
- Todos os utilizadores autenticados podem consultar as ações, tal como já podem consultar a informação global da dashboard.

Um Diretor só pode atribuir uma nova ação a si próprio ou a utilizadores associados ao mesmo hotel. A Direção pode atribuir a qualquer utilizador ativo.

### 7. Proteção contra alterações concorrentes

Ao abrir uma ação, a dashboard memoriza a versão consultada. Se outra pessoa alterar a ação antes da gravação, o servidor rejeita a versão antiga em vez de substituir silenciosamente a informação mais recente.

A ação deve então ser reaberta para carregar a versão atual.

## Novos ficheiros

```text
assets/js/modules/actions-management.js
assets/css/actions-management.css
tests/actions-management.test.js
```

A função abaixo também foi atualizada:

```text
netlify/functions/dashboard-sessao.js
```

Por isso, não publicar apenas o `index.html`.

## Testes automáticos

Executar:

```bash
npm test
```

Validação final da v8:

- 8/8 suites passaram;
- gestão de ações testada;
- ações fora do prazo e sem responsável testadas;
- ligação entre prioridade e ação testada;
- permissões de Direção/Diretor testadas;
- atualização por responsável atribuído testada;
- conflito de edições simultâneas testado;
- acesso direto aos Blobs de ação bloqueado;
- autenticação, P&L, KPIs, Revenue Intelligence e estrutura continuam protegidos.

Ver também `ARCHITECTURE.md` e `VALIDATION_V8.txt`.
