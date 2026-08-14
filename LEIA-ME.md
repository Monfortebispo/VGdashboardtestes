# VG Dashboard — Arquitetura Modular v4

Esta versão parte da Secure Auth v3, mantendo o Core v1 e o Shared Storage v2 já validados em utilização real.

## Objetivo desta versão

Reduzir o risco de manutenção do antigo `index.html` monolítico sem alterar o comportamento funcional da dashboard.

O `index.html` tinha aproximadamente 1,32 MB e mais de 21 mil linhas, contendo HTML, CSS e praticamente todo o JavaScript da aplicação no mesmo ficheiro. Na v4, o HTML passa a conter essencialmente a estrutura da interface e as referências aos módulos.

## O que mudou

### 1. JavaScript separado por responsabilidade

O motor foi dividido em:

- `assets/js/core/` — importação de dados, navegação/KPIs, persistência/partilha e bootstrap;
- `assets/js/auth/` — autenticação e restauro pós-login;
- `assets/js/modules/` — Ficha do Hotel, P&L, CUA, custos, reputação, ocupação, Instagram, hotéis, receitas, orçamento, compras, Revenue Intelligence, WhatsApp e restantes domínios;
- `assets/js/ui/` — componentes/camadas visuais transversais;
- `assets/js/fixes/` — correções históricas ainda necessárias, agora claramente isoladas.

### 2. CSS retirado do HTML

Todos os blocos `<style>` foram extraídos para `assets/css/`.

Isto permite alterar, por exemplo, autenticação, compras ou Revenue Intelligence sem procurar regras CSS no meio de milhares de linhas de HTML.

### 3. Biblioteca offline separada

O `fflate` embebido continua local e funcional, mas passa a viver em `assets/vendor/fflate.min.js`.

Chart.js e XLSX mantêm nesta versão o mesmo carregamento externo que já existia, para não introduzir outra variável durante a modularização.

### 4. Código funcional preservado

Nesta fase não foram reescritas fórmulas, autenticação, permissões, Blobs ou cálculos. A separação foi feita preservando o código original da v3.

A função `netlify/functions/dashboard-sessao.js` é exatamente a mesma da Secure Auth v3 já testada.

### 5. Pequena correção estrutural

Foi corrigida uma marca HTML antiga que interrompia a palavra `letter-spacing` no seletor de Região do modal WhatsApp. Não altera lógica de negócio.

## Resultado estrutural

- `index.html`: de mais de 21.000 linhas para menos de 2.000 linhas;
- 0 blocos JavaScript inline com lógica da aplicação;
- 0 blocos `<style>` inline;
- módulos funcionais identificáveis por nome;
- patches antigos isolados na pasta `fixes`;
- função Netlify e modelo de segurança preservados.

Ver `ARCHITECTURE.md` para o mapa completo dos ficheiros e regras para futuras alterações.

## Publicação

Substituir o conteúdo do repositório pela estrutura completa desta versão. É essencial publicar também a pasta `assets/`; não basta substituir apenas o `index.html`.

Não é necessário alterar variáveis, Blobs, utilizadores ou configurações no Netlify.

## Validação efetuada

- todos os ficheiros JavaScript passam `node --check`;
- a função Netlify passa validação de sintaxe;
- todos os 45 recursos locais referidos pelo HTML existem;
- não ficaram blocos JavaScript funcionais inline;
- não ficaram blocos `<style>`;
- CSS extraído comparado integralmente com o CSS da v3;
- JavaScript reconstruído módulo a módulo comparado integralmente com o JavaScript da v3;
- função Netlify comparada por hash com a v3 e mantida sem alterações;
- ordem de carregamento dos módulos preservada.

## Nota

Esta é deliberadamente uma modularização conservadora. A dashboard ainda usa várias funções e variáveis globais porque convertê-las todas de uma vez para módulos ES/arquitetura de classes aumentaria desnecessariamente o risco de regressões. A v4 cria a base para fazer essa evolução de forma gradual.
