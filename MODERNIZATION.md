# Modernização arquitetural da VG Operations

Esta branch prepara uma migração incremental da aplicação atual para uma arquitetura com TypeScript, Vite e carregamento modular/lazy.

## Princípios

1. O `main` e o runtime atual permanecem intactos até validação explícita.
2. A nova arquitetura é construída em paralelo e não substitui o `index.html` atual nesta fase.
3. Nenhum módulo de negócio é reescrito de uma só vez.
4. Cada módulo deve manter paridade funcional antes de substituir a implementação legada.
5. A Ficha Hotel não sofre alterações funcionais durante esta migração.
6. Testes existentes continuam ativos; não são desativados para facilitar a migração.
7. O objetivo é reduzir o JavaScript carregado no arranque, separar responsabilidades e permitir carregamento sob procura.

## Fases

### Fase 0 — Infraestrutura
Concluída na branch:
- Vite isolado
- TypeScript estrito
- registo central de módulos lazy
- ponte tipada para o runtime legado
- build moderno separado em `dist-modern`

### Fase 1 — Shell
Em desenvolvimento na branch:
- catálogo tipado das vistas e políticas de acesso
- router moderno separado de autorização, DOM e refresh
- controlo de concorrência para navegações/lazy imports
- adaptador isolado para o DOM/runtime legado
- navegação e pesquisa de módulos desacopladas do `navigation-shell.js`
- sem ligação ao `index.html` de produção

O `setView()` legado continua ativo e intacto durante esta fase. A substituição só será feita depois de testes de paridade e validação visual.

### Fase 2 — Módulos de leitura
Iniciada através de adaptadores lazy:
- Portefólio
- Ocupação
- Reputação
- Revenue & Forecast
- Custos

Estes adaptadores ainda encaminham para o runtime legado; servem para criar fronteiras de carregamento antes da reescrita interna.

### Fase 3 — Módulos operacionais
Preparação iniciada com adaptador de Aprovações. City Ledger, Energia, Housekeeping e restantes módulos de escrita continuam no runtime atual.

### Fase 4 — Dados
Iniciada na branch com uma camada isolada de carregamento seletivo:
- registo tipado de fontes de dados
- cache com TTL por fonte
- deduplicação de pedidos simultâneos
- invalidação seletiva ou total
- plano explícito de fontes por vista
- preparação de chunk e dados em paralelo no router moderno
- adaptadores atuais sem chamadas de rede, lendo apenas RAW/STORE/VG já presentes em memória

O `refreshAll()` legado ainda é chamado pelo adaptador do router para manter paridade funcional. A sua remoção será gradual: cada módulo deixa de depender dele apenas quando passar a consumir diretamente as respetivas fontes modernas.

Próxima etapa da Fase 4:
1. identificar as funções/API reais por domínio;
2. substituir uma fonte de cada vez por carregamento específico;
3. começar por módulos de leitura e baixo risco;
4. medir tamanho transferido, tempo até conteúdo e quantidade de trabalho executado por mudança de vista.

### Fase 5 — Corte do shell legado
Só depois de paridade funcional, testes e validação visual é que o `index.html` passa a arrancar pelo bundle moderno.

## Proteções atuais

- `index.html` não referencia `src/modern/main.ts` nem `dist-modern`.
- `tests/modern-architecture-isolation.test.js` impede ligação prematura do bundle moderno.
- `tests/modern-navigation-router.test.js` valida catálogo, router, lazy loading e coexistência com `setView()`.
- `tests/modern-data-loading.test.js` valida planos por vista, cache, deduplicação e ausência de novas chamadas de rede nesta fase.
- Ficha Hotel permanece no módulo legado e não é modificada por esta fase.
- Não existe PR aberto desta branch.
- Nenhum merge para `main` é feito nesta fase.
