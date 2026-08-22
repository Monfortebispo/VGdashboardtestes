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
- Vite isolado
- TypeScript estrito
- registo central de módulos lazy
- ponte tipada para o runtime legado
- build moderno separado em `dist-modern`

### Fase 1 — Shell
Migrar navegação, contexto global e orquestração de vistas sem mexer nos módulos de negócio.

### Fase 2 — Módulos de leitura
Começar pelos módulos com menor risco de escrita: Portefólio, Ocupação, Reputação e análises.

### Fase 3 — Módulos operacionais
Migrar módulos com gravação/API: City Ledger, Energia, Aprovações, Housekeeping, etc.

### Fase 4 — Dados
Substituir cargas globais por pedidos específicos por módulo, cache controlada e carregamento progressivo.

### Fase 5 — Corte do shell legado
Só depois de paridade funcional, testes e validação visual é que o `index.html` passa a arrancar pelo bundle moderno.

## Estado atual

A infraestrutura da Fase 0 existe apenas nesta branch. O `index.html` atual não referencia `src/modern/main.ts` nem o bundle produzido pelo Vite. Portanto, o comportamento da aplicação publicada não é alterado por estes ficheiros.
