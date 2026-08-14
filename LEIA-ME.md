# VG Dashboard — Performance v18

A V18 otimiza o arranque e a utilização diária sem alterar os cálculos ou permissões. Principais mudanças: scripts externos com `defer`, XLSX carregado apenas quando é necessário importar/exportar Excel, inicialização de Reputação/Agenda/Hotéis apenas ao abrir a vista, cache de formatadores numéricos, resize apenas dos gráficos visíveis e pré-cache PWA concorrente.

A biblioteca Chart.js continua disponível no arranque porque o Resumo usa gráficos imediatamente. A XLSX deixa de bloquear a primeira abertura e é obtida sob pedido. Dados/API Netlify continuam fora da cache do service worker.

# VG Dashboard — Backup & Recuperação v17

A v17 acrescenta uma camada de recuperação global dos dados operacionais partilhados nos Netlify Blobs. O objetivo é permitir regressar a uma versão anterior quando uma alteração, configuração ou carga produz um estado indesejado, sem reverter credenciais ou dados internos de segurança.

## O que entra no snapshot

- P&L mensal e acumulado;
- ocupação e referências de ocupação;
- reputação, Instagram e receitas detalhadas;
- Compras e respetivos batches;
- fichas técnicas e Ficha do Hotel;
- notas partilhadas;
- regiões/configurações e Metas & Regras;
- ações operacionais;
- índice e metadados operacionais necessários à reconstrução do estado.

## O que fica deliberadamente fora

- utilizadores e passwords;
- tokens, secrets, hashes e salts;
- auditoria histórica;
- presença online e rate-limit de login;
- snapshots internos do Centro de Dados;
- os próprios backups v17.

## Recuperação segura

Antes de repor uma versão anterior, a API cria automaticamente um snapshot `pre_restore` do estado atual. Só depois lê integralmente a cópia escolhida, elimina o estado operacional atual e repõe os blobs guardados. A reposição exige escrever `REPOR`; eliminar uma cópia exige `APAGAR`. Ambas as operações estão reservadas à Direção e deixam evento crítico/aviso na Auditoria & Governação.

## Interface

A nova página `Backup & Recuperação` mostra data, autor, tipo de cópia, quantidade de itens, volume protegido e distribuição por área. Está também acessível no menu mobile/PWA para perfis de Direção.

## Validação

A v17 termina com **20/20 suites de regressão aprovadas**. A nova suite cria uma cópia sintética, altera P&L/configuração, adiciona dados posteriores, executa a reposição e confirma que o estado anterior é recuperado, que dados posteriores são removidos e que utilizadores/credenciais permanecem intocados.

---

# VG Dashboard — Auditoria & Governação v16

A v16 acrescenta um trilho de auditoria verificado no servidor para alterações relevantes. A nova página `Auditoria & Governação` é exclusiva da Direção e permite filtrar por período, utilizador, hotel e categoria, consultar diferenças antes/depois e exportar o resultado em CSV.

São auditados no servidor, entre outros: login, alteração de password, utilizadores, regiões/configurações, Metas & Regras, Ficha do Hotel, ações operacionais, importações/rollbacks e conclusão de publicações partilhadas. Passwords, tokens, hashes e salts são explicitamente excluídos do histórico.

O histórico antigo da auditoria continua visível como `Histórico anterior`, mas é distinguido dos eventos v16 com selo `Servidor`, cuja identidade e timestamp são impostos pela função Netlify.

**Validação v16: executar `npm test`.**

---

# VG Dashboard — PWA / Mobile v15

A v15 salta deliberadamente a v14 e transforma a dashboard atual numa aplicação web instalável (`VG Operations`) com experiência própria para telemóvel e tablet, mantendo exatamente os mesmos dados, autenticação, Netlify Blobs e regras de negócio da versão desktop.

## O que muda no Android

A dashboard continua acessível pelo mesmo URL. Num browser compatível pode ser instalada no ecrã inicial e passa a abrir em modo `standalone`, sem a barra normal do browser.

A navegação móvel principal fica reduzida a cinco acessos:

- Central;
- Hotéis;
- Ações;
- Alertas;
- Mais.

O menu `Mais` dá acesso rápido a Ficha do Hotel, Forecast, Deteção de Anomalias, Revenue Intelligence, Benchmarking, P&L, Ocupação, Compras e Centro de Dados.

## Orientação mobile

A versão desktop continua orientada para análise detalhada. A camada mobile privilegia `ver → decidir → agir`:

- Central de Operações em primeiro plano;
- gestão de ações em bottom sheet, com botões maiores;
- Forecast e Anomalias reorganizados em duas colunas nos ecrãs pequenos;
- filtros com scroll horizontal controlado;
- barra inferior fixa;
- modais adaptados à altura útil do dispositivo e `safe-area`.

O breakpoint PWA/mobile é aplicado até 820 px para abranger telemóveis e tablets pequenos.

## PWA

Foram acrescentados:

- `manifest.webmanifest`;
- `service-worker.js`;
- ícones 180, 192 e 512 px;
- `assets/css/mobile-pwa.css`;
- `assets/js/ui/mobile-pwa.js`.

O nome instalado é `VG Operations` e o nome curto é `VG Ops`.

## Offline e segurança

O service worker guarda apenas a aplicação estática: HTML, CSS, JavaScript, ícones e bibliotecas locais.

Pedidos para `/.netlify/` e `netlify/functions` ficam explicitamente fora da cache. Pedidos que não sejam `GET` também nunca são cacheados. Assim, a PWA não cria uma nova cache offline de P&L, utilizadores, ações, comentários ou outros dados provenientes dos Blobs.

Quando não existe ligação, a estrutura da aplicação pode abrir, mas dados que exijam sincronização não são atualizados. Chart.js e XLSX continuam externos; sem rede podem ficar indisponíveis e a dashboard mantém o aviso já existente.

## Sincronização móvel

O menu mobile inclui `Atualizar dados`, que utiliza o mesmo `fetchSharedData()` da dashboard e atualiza também o estado das ações. A última sincronização efetuada pelo utilizador fica apenas como timestamp local de interface.

## Instalação

No Android/Chrome, quando o browser disponibiliza o evento de instalação, a dashboard apresenta a opção `Instalar VG Operations`. Se o browser não disponibilizar o prompt automático, o menu indica a instalação através do menu do Chrome.

## Correção de estabilidade incluída

A v15 torna `updatedAt` das Ações monotónico. Isto elimina uma condição rara em que duas alterações efetuadas no mesmo milissegundo podiam receber o mesmo timestamp e enfraquecer o controlo de edição concorrente.

## Testes

A v15 acrescenta uma suite específica PWA/mobile que valida:

- manifest e ícones;
- ligação da camada mobile;
- navegação inferior;
- instalação PWA;
- app shell offline completo;
- exclusão da API/Netlify da cache;
- ausência de writes na cache;
- sintaxe do service worker.

Resultado final: **18/18 suites aprovadas**. A suite de segurança foi adicionalmente repetida várias vezes após a correção do timestamp concorrente.
