# Fase 1 — Auditoria P0: Runtime, Navegação e Autenticação

Estado: diagnóstico confirmado; sem merge para `main`; sem deploy autorizado.

## 1. Objetivo

Eliminar as corridas de arranque, centralizar a decisão de navegação e tornar o pós-login previsível antes de continuar a consolidar módulos funcionais.

## 2. Achados confirmados

### P0-A — Restauro de dados sem coordenação

Existem três caminhos independentes capazes de iniciar `idbAutoRestore()`:

1. `assets/js/core/04-bootstrap.js` no `DOMContentLoaded`;
2. `assets/js/auth/restore-after-auth.js` no arranque diferido;
3. `assets/js/auth/auth-client.js` em `afterLoginLoad()`.

Isto não deve ser resolvido com um simples `once()` global, porque `idbAutoRestore()` tenta primeiro a fonte partilhada no servidor e essa fonte exige token. Antes do login, a tentativa remota não pode substituir a sincronização autenticada posterior.

Contrato alvo:

- `startup.localRestore()` — no máximo uma execução concorrente durante o arranque, sem depender de login;
- `startup.authenticatedSync()` — no máximo uma execução concorrente depois de existir sessão/token;
- uma chamada posterior pode reutilizar a Promise em curso, mas não deve disparar uma segunda cadeia de fetch/render em paralelo;
- nenhuma das duas rotinas pode chamar `setView('resumo')` de forma a destruir a rota já escolhida pelo utilizador após login.

### P0-B — Catálogos de rotas divergentes

Há pelo menos três fontes de verdade diferentes para módulos/rotas:

- `MODULE_CATALOG` em `auth-client.js`;
- `modules` em `navigation-shell.js`;
- `validViews` em `04-bootstrap.js`.

Não coincidem. Existem módulos presentes no menu/permissões que não constam de `validViews` do bootstrap, nomeadamente rotas modernas como `hotel360`, `revenuehub`, `actions`, `cityledger`, `benchmark` e `anomalies`.

Contrato alvo:

- uma única definição canónica de rotas;
- aliases tratados separadamente (`revenueint -> revenuehub`, etc.);
- autenticação, menu, mobile e router consomem o mesmo catálogo;
- nenhuma vista válida pode cair silenciosamente em `resumo` por estar ausente de uma lista histórica.

### P0-C — Navegação com múltiplos proprietários

A seleção da vista pode ser desencadeada por:

- `setView()` em `02-navigation-kpis.js`;
- bootstrap inicial e `popstate` em `04-bootstrap.js`;
- shell transversal através de `setView()`/click;
- autenticação em `afterLoginLoad()`;
- módulos/patches que gravam hash/sessionStorage e esperam novo render.

Contrato alvo:

- `VG.router.navigate(view, options)` como único proprietário da transição de vista;
- `setView()` permanece temporariamente como alias de compatibilidade e delega no router;
- só o router adiciona/remove `.active` em `.tab-content`;
- módulos não podem forçar `display:block`, alterar `.active` ou reconstruir outra vista;
- abertura profunda de processo deve ocorrer via `navigate(view,{focusId})`, e não através de `Atualizar` manual.

### P0-D — Runtime com versionamento histórico pouco representativo

`00-runtime.js` expõe `VG.version = '13.0'`, enquanto o produto e os módulos se encontram em gerações posteriores. Não é um bug funcional direto, mas torna diagnóstico, logs e guardas de versão ambíguos.

Contrato alvo:

- separar `VG.runtimeVersion` da versão comercial/build;
- versão do build lida de `meta[name="vg-build"]`/package;
- deixar de usar um único número para conceitos diferentes.

### P0-E — Login antecipado não enfileira interação

`early-login-v36.js` só executa quando `window.vgAuthLogin` já existe. Se o utilizador interagir antes do carregamento de `auth-client.js`, a camada antecipada não guarda a intenção para execução posterior.

Isto é relevante para o sintoma histórico em que o botão Entrar não respondia imediatamente no primeiro paint.

Contrato alvo:

- botão fica funcional assim que o overlay é apresentado;
- se o motor de autenticação ainda estiver a carregar, a interação é bloqueada visualmente com estado claro ou enfileirada uma única vez;
- nunca existe período em que o botão parece disponível mas não produz ação.

## 3. Ordem de correção proposta

1. Criar `VG.routes` canónico, sem alterar ainda a aparência do menu.
2. Introduzir `VG.router` e fazer `setView()` delegar para ele.
3. Criar coordenador de startup com fases `local` e `authenticated`.
4. Adaptar bootstrap/restaurador/auth ao coordenador e eliminar chamadas concorrentes.
5. Tornar o login antecipado determinístico.
6. Acrescentar regressões automáticas para rotas, vista única ativa, startup e pós-login.
7. Só depois auditar novamente Mensagens/Workflow sobre esta base.

## 4. Regras de aceitação P0

- exatamente uma `.tab-content.active` após qualquer navegação;
- uma rota válida nunca é convertida em `#resumo` por lista desatualizada;
- voltar/avançar no browser mantém rota válida e permissões;
- utilizador sem permissão recebe fallback controlado, sem loops;
- restauro local não corre em paralelo consigo próprio;
- sync autenticada não corre em paralelo consigo própria;
- login não espera pelo carregamento de todos os módulos funcionais;
- após login, a rota escolhida não é anulada por um restauro tardio;
- nenhum módulo funcional possui autoridade para ativar outra vista.

## 5. Estado

Diagnóstico concluído. Próximo trabalho: implementação destas garantias apenas na branch `phase1/stabilization-audit`, com testes antes de qualquer proposta de merge/deploy.
