# Arquitetura — VG Dashboard v15

## Camadas principais

- `assets/js/core/` — importação, KPIs canónicos, persistência e bootstrap.
- `assets/js/auth/` — cliente de autenticação.
- `assets/js/modules/` — módulos funcionais.
- `assets/js/ui/` — navegação e componentes transversais.
- `assets/css/mobile-pwa.css` — camada responsiva PWA, sem alterar o desktop.
- `assets/js/ui/mobile-pwa.js` — navegação mobile, instalação e sincronização.
- `manifest.webmanifest` — metadados de instalação.
- `service-worker.js` — app shell offline, sem cache de API.
- `netlify/functions/` — autenticação, permissões e armazenamento partilhado.
- `tests/` — regressão automática antes do deploy.

## PWA / Mobile

A PWA não é uma segunda aplicação. Desktop e mobile usam o mesmo `index.html`, os mesmos módulos e os mesmos endpoints. A mudança é responsiva e ativada até 820 px.

### `assets/js/ui/mobile-pwa.js`

Responsabilidades:

- criar a navegação inferior móvel;
- criar o bottom sheet `Mais`;
- abrir a Gestão de Ações existente;
- chamar `setView()` para os módulos existentes;
- executar a sincronização através de `fetchSharedData()`;
- mostrar ações em atraso na barra inferior;
- gerir `beforeinstallprompt`/instalação;
- registar o service worker.

Não contém fórmulas financeiras nem persiste datasets.

### `assets/css/mobile-pwa.css`

Responsabilidades:

- adaptar Central, Ações, Forecast e Anomalias;
- evitar scroll horizontal da página;
- manter tabelas pesadas dentro de wrappers próprios;
- respeitar `safe-area` de equipamentos móveis;
- transformar modais de Ações em bottom sheets;
- esconder a navegação móvel no desktop.

## Service worker

`service-worker.js` usa a cache `vg-operations-shell-v15`.

Estratégia:

- precache da app shell estática;
- navegação: network-first com fallback para `index.html`;
- assets locais: cache-first + atualização em background;
- `/.netlify/*`: network-only;
- `/netlify/functions/*`: network-only;
- métodos diferentes de GET: nunca intercetados para cache;
- recursos CDN: network-only.

Isto separa explicitamente disponibilidade offline da interface e armazenamento dos dados de negócio.

## Segurança das Ações

`dashboard-sessao.js` mantém a validação server-side. Na v15, `nextIsoTimestamp()` garante que o token de concorrência `updatedAt` avança pelo menos 1 ms em relação à versão anterior, mesmo quando duas operações acontecem dentro do mesmo milissegundo.

## Módulos anteriores

As arquiteturas v8–v13 mantêm-se: Ações, Metas & Regras, Centro de Dados, Benchmarking, Forecast & Cenários e Deteção de Anomalias continuam a usar os mesmos objetos `VG.*` e os KPIs canónicos.


## V16 — Auditoria & Governação

- `assets/js/modules/audit-governance.js`: interface, filtros, detalhe antes/depois e exportação CSV.
- `assets/css/audit-governance.css`: apresentação desktop/mobile da governação.
- `netlify/functions/dashboard-sessao.js`: eventos `_audit-event/*` gerados server-side; o browser não escolhe a identidade registada.
- `tests/governance.test.js`: permissões, diferenças, categorias e ausência de credenciais no trilho.

A auditoria é não bloqueante: uma indisponibilidade isolada ao escrever um evento não deve impedir a operação principal. Os eventos críticos são sempre derivados de operações já autorizadas no servidor.


## v17 — Backup & Recuperação

A recuperação é implementada na função `netlify/functions/dashboard-sessao.js` e exposta apenas através dos endpoints autenticados `recovery-list`, `recovery-create`, `recovery-restore` e `recovery-delete`. Os payloads internos usam os prefixos `_recovery-snapshot/` e `_recovery-data/`, que continuam bloqueados pela regra geral que impede acesso a recursos iniciados por `_`.

Cada blob operacional é copiado individualmente para uma chave interna de backup. O manifesto guarda apenas metadados, a chave original, a chave da cópia e o tamanho. Esta abordagem evita concentrar todo o estado num único objeto grande e permite restaurar exatamente as chaves que existiam na versão capturada.

A reposição é global para o estado operacional recuperável: primeiro carrega todos os payloads da cópia para garantir integridade, depois cria um snapshot automático do estado atual, elimina as chaves operacionais existentes e reidrata a versão escolhida. Segurança/autenticação e auditoria não fazem parte deste domínio de rollback.

Frontend: `assets/js/modules/backup-recovery.js` e `assets/css/backup-recovery.css`.


## V18 — Performance

- `assets/js/core/05-performance.js`: scheduling idle, métricas, XLSX lazy e lifecycle de gráficos.
- Os scripts externos usam `defer`, mantendo ordem e permitindo download paralelo.
- Reputação, Agenda, Hotéis, Ocupação, Instagram e Receitas Detalhe só renderizam quando a vista é aberta.
- O service worker usa pré-cache concorrente em lotes e mantém APIs/Blobs network-only.
