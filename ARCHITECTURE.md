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
