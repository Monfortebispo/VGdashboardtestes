# Arquitetura — VG Operations 2.0 v30

## Princípio

A V30 é uma camada de consolidação sobre a arquitetura modular existente. Não reescreve as fontes de verdade de P&L, Revenue, Ações, Documentos, Aprovações ou Cenários.

O objetivo é reduzir a fragmentação de UX e acrescentar inteligência executiva reutilizando APIs e modelos já validados.

## Ficha do Hotel — contrato de imutabilidade

A Ficha do Hotel é uma exceção deliberada à consolidação:

- `#nav-fichahotel` permanece como item próprio do menu;
- `#view-fichahotel` permanece como vista própria;
- `assets/js/modules/ficha-hotel.js` não é modificado;
- Hotel 360º apenas referencia/abre a Ficha, não a substitui.

O teste V30 verifica o SHA-256 do módulo para impedir alterações acidentais.

## Novos módulos

### `assets/js/modules/operational-score-v28.js`

API: `VG.operationalScore`

Responsabilidades:

- calcular Score 0–100 por seis dimensões;
- normalizar pesos para 100%;
- carregar/gravar configuração partilhada em `settings-score-v30`;
- expor decomposição e dimensão mais forte/fraca.

Apenas Direção/Admin pode guardar pesos, recorrendo à proteção server-side já existente do recurso `settings`.

### `assets/js/modules/hotel-360-v30.js`

API: `VG.hotel360`

Responsabilidades:

- consumir `VG.hotelPerformance.buildModel()`;
- apresentar visão executiva e separadores por domínio;
- integrar Score;
- construir ponte explicativa da variação de GOP;
- detetar gaps de metas/Forecast;
- criar Ações de recuperação através de `VG.actions.openForPriority()`.

Não persiste uma segunda cópia de KPIs.

### `assets/js/modules/revenue-hub-v30.js`

API: `VG.revenueHub`

Cria a experiência `Revenue & Forecast` e reutiliza fisicamente as interfaces legadas:

- `view-revenueint`;
- `view-forecast`;
- `view-scenariocompare`.

As funções originais `riRender`, `forecastRender` e `scenarioComparisonRender` continuam a executar a lógica.

### `assets/js/ui/vg-operations-2-v30.js`

API: `VG.operations2`

Responsabilidades:

- reorganizar o menu principal;
- manter vistas legadas sem as expor como opções primárias;
- redirecionar rotas antigas para as novas experiências agregadas;
- criar o botão transversal `Perguntar aos dados`;
- renderizar Home específica por perfil.

## Score Operacional

Pesos por defeito:

```text
Financeiro  25
Revenue     20
Eficiência  15
Reputação   15
Execução    15
Dados       10
```

Cada dimensão produz 0–100 a partir de sinais existentes. O score final é a média ponderada normalizada.

Estados:

```text
< 60   Crítico
< 75   Atenção
< 88   Bom
>= 88  Muito bom
```

O Score é um indicador executivo explicável, não uma nota contabilística ou avaliação individual de gestão.

## Análise automática de causa

A ponte de GOP usa os valores P&L disponíveis por hotel e período:

```text
ΔGOP oficial com sede
= ΔReceita
- ΔPessoal
- ΔEnergia
- ΔManutenção
- ΔComidas
- ΔBebidas
- ΔOperacionais
- ΔMarketing
- ΔOutros custos
+ residual de sede/reconciliação
```

O residual garante reconciliação com o GOP oficial. A interface identifica claramente o método como explicativo/estimado.

## Planos de recuperação

Não existe novo armazenamento. Cada gap relevante cria/consulta Ações existentes com `sourceKey` estável:

```text
recovery:<HOTEL>:<METRICA>:<ANO>
```

Assim permanecem disponíveis responsável, prazo, estado, comentários, histórico, permissões e auditoria já implementados na Gestão de Ações.

## Revenue & Forecast

A nova vista `#view-revenuehub` funciona como orquestrador visual. Não duplica os cálculos de:

- Revenue Intelligence;
- Forecast V12;
- Comparação de Cenários V29.

Rotas antigas são encaminhadas para o separador correspondente, preservando compatibilidade com links/atalhos.

## Navegação e descoberta

O menu principal é reduzido. As vistas avançadas/legadas continuam presentes no DOM e podem ser acedidas por command palette/Pesquisa Global quando aplicável.

Notificações permanecem no topo e o Assistente Analítico passa a ser transversal.

## Home por perfil

A Home usa as mesmas permissões já aplicadas ao resto da aplicação:

- Direção/Admin pode agregar portefólio;
- Diretor/Assistente é limitado ao hotel associado.

Não é criado um endpoint adicional.

## PWA e versão

- Version guard: build `30.0`;
- Service worker: `vg-operations-shell-v30`;
- shell network-first quando online;
- `/.netlify/` continua network-only;
- novos assets V30 estão no precache estático.

## Backend

`netlify/functions/dashboard-sessao.js` é byte-a-byte igual ao da V29.1.

A V30 usa recursos já existentes:

- `settings-score-v30` através do recurso genérico `settings`;
- Ações para planos de recuperação;
- modelos e endpoints já existentes para restantes dados.


## V30.1 — Correção da navegação
A reconstrução do menu preserva agora todos os botões antes de remover os grupos antigos. Isto corrige os grupos vazios vistos na V30. A Ficha do Hotel permanece independente e o respetivo módulo não foi alterado.


## V30.3 — Correções consolidadas
- O Portefólio da Home respeita o filtro ativo de região/hotéis.
- A Ponte do GOP apresenta contribuição económica: menos custo melhora GOP (verde), mais custo deteriora (vermelho), independentemente do sinal contabilístico da rubrica.
- Revenue & Forecast incorpora as views originais completas, preservando os IDs usados pelos estilos e pelos renderizadores legados.
- Ficha do Hotel e backend não foram alterados.

## V31 — Camada de mercado

A dimensão `market` passa a anteceder hotel/ano/mês no modelo de contexto:

```text
market -> hotel -> ano -> mês
```

Mercados iniciais:

```text
iberia  -> PT+ES -> EUR
brasil  -> BR     -> BRL
```

`assets/js/core/07-markets-v31.js` mantém um banco de sessão por mercado e expõe `VG.market` para identificação de hotéis, moeda, regiões, formatação, mudança de contexto e separação de snapshots mistos.

### Persistência

Compatibilidade retroativa foi priorizada:

- Iberia usa as chaves Blob históricas sem prefixo;
- Brasil usa `market/brasil/<legacy-key>` nos recursos genéricos;
- Ações/Agenda/Documentos/Aprovações/Cenários mantêm os prefixes existentes e armazenam `market` em cada registo;
- listas e operações server-side filtram/validam `market`;
- migrações antigas de `localStorage` são executadas apenas em Iberia, impedindo que configurações/fichas PT+ES sejam publicadas no namespace Brasil.

### Moeda

`VG.market.formatMoney()` e `VG.market.formatMoneyCompact()` são a fonte transversal para EUR/BRL. Nenhum agregado financeiro deve atravessar mercados. A V31 não contém taxa de câmbio nem conversão automática.

### Dados mistos

O snapshot local continua compatível com os globais legados (`STORE`, `REP_STORE`, `OCC_SNAPSHOTS`, etc.), mas apenas o mercado ativo é projetado nesses globais. `MARKETS_V31` transporta os dois bancos quando a sessão é persistida/restaurada.

### Permissões

O frontend limita a seleção pelo hotel associado e o backend aplica a mesma regra. Recursos globais de autenticação/administração continuam globais; recursos operacionais e dados são market-scoped.

### V31.2 — isolamento de estado visual
O runtime `07-markets-v31.js` passa a tratar a troca de mercado como uma fronteira de estado também ao nível do DOM. Modelos derivados, cards, Ficha, Central, gráficos e contexto do mercado anterior são invalidados antes do restauro do novo banco. `02-navigation-kpis.js` sincroniza o estado de ausência de P&L mesmo quando `RAW` é nulo, evitando que o retorno antecipado de `refreshAll()` preserve HTML antigo.

## V32 — City Ledger & Eficiência / Unit Economics

### City Ledger & Gestão de Cobranças
- Fonte contabilística canónica: aba `Listagem` do Excel City Ledger. As restantes abas do workbook são vistas/agregações reconstruídas pela aplicação.
- Apenas linhas cujo campo `HOTEL` pertence à lista oficial do mercado ativo são aceites. Entidades corporativas que não são hotéis ficam fora; a coluna `ENTIDADE` continua livre para representar qualquer devedor/cliente.
- Vencimento operacional: `DATA_DOCUMENTO + 30 dias`. O aging histórico usa `DATA_REGISTO` do snapshot como data de referência.
- Snapshots, blocos de faturas e diligências são guardados separadamente em Netlify Blobs, com namespace de mercado.
- Diligências são append-only e registam utilizador/data-hora server-side, meio, contacto, descrição, resposta, estado, promessa e próxima diligência.
- Importações são reservadas à Direção; Diretores/Assistentes leem e registam diligências apenas no hotel associado.
- Créditos (saldo negativo) são apresentados em separado e não são somados à dívida.

### Eficiência & Unit Economics
- Evolução do antigo método ABC, mantendo o módulo legado no código mas expondo uma experiência consolidada nova.
- Numeradores: custos totais e famílias (Pessoal, Energia, Manutenção, Comidas, Bebidas, A&B, Marketing, Operacionais, Comunicações), receitas (Total, Alojamento, A&B, complementar) e GOP com sede.
- Bases de atividade: quarto disponível, quarto ocupado, dormida, hóspede/cliente e chegada.
- Agregados de portefólio são ponderados: soma do numerador / soma da atividade, nunca média simples entre hotéis.
- Semântica de variação: em custos unitários menos é melhor; em receita/GOP unitários mais é melhor.
- Respeita integralmente o mercado ativo e a moeda contextual (EUR/BRL).


## V33 — Domínios operacionais integrados

A camada V33 não duplica autenticação, geografia ou catálogo de hotéis. Os novos módulos consomem `VG.market`, o perfil autenticado e os globais operacionais existentes.

### Reputação
O JSON semanal é normalizado para o `REP_STORE` legado, preservando os gráficos ReviewPro existentes. A camada semestral mantém origem/tipo separados (`painel`, `resultados`, `concorrencia`, `respostas`, `semantica_resultados`, `semantica_mencoes`) para impedir mistura metodológica entre horizontes.

### Receita detalhada e A&B
`RD_STORE` continua a ser o livro de snapshots de receita detalhada. A área A&B lê os mapas de Compras e liga artigos vendidos às receitas técnicas quando existe correspondência normalizada. O consumo por balanço usa `inventário inicial + compras - inventário final`.

### Housekeeping
O stock têxtil é um livro-razão: `base física + entradas - quebras ± acertos`. O par oficial é `índice × vestido 100%` quando essa parametrização existe. A sugestão dinâmica aplica o forecast de ocupação com piso de segurança, sem alterar o par oficial. Diferenças de contagem física exigem justificação.

### Persistência e recuperação
Direção pode persistir os estados partilhados `ops-housekeeping`, `ops-ab` e `ops-reputation-semester`; estes recursos entram no sistema de auditoria e snapshots de recuperação. Utilizadores de hotel permanecem limitados ao âmbito autorizado.


## V33.1 — UX de integração e City Ledger

- `assets/js/modules/city-ledger-v32.js`: mantém compatibilidade V32 mas adiciona estado `filterClients[]`, filtro multi-entidade por hotel e limpeza global.
- `assets/js/ui/vg-operations-2-v30.js`: expõe os domínios V33 no grupo `Operação Integrada` e no lançador do Resumo.
- `assets/js/core/06-version-guard-v29_1.js` + `service-worker.js`: build 33.1, network-first e diagnóstico dos novos módulos.
