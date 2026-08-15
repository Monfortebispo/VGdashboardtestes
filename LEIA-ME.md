# VG Operations 2.0 — v30

A V30 é uma consolidação de produto sobre a V29.1. O objetivo não é acrescentar páginas indiscriminadamente, mas reduzir a fragmentação da experiência mantendo as funcionalidades existentes disponíveis.

## Regra imutável: Ficha do Hotel

A **Ficha do Hotel permanece independente, com entrada própria no menu e sem alterações ao seu módulo**.

O ficheiro `assets/js/modules/ficha-hotel.js` é byte-a-byte igual ao da V29.1. O Hotel 360º é uma nova visão executiva complementar e nunca substitui a Ficha do Hotel.

## Nova navegação principal

A navegação é simplificada em torno de:

- Início & Hotéis — Resumo, Ficha do Hotel, Hotel 360º;
- Gestão — Ações, Agenda Operacional, Aprovações;
- Análise — Receitas, Custos, P&L USALI, Revenue & Forecast, Compras, Benchmarking, Anomalias;
- Suporte — Documentos, Relatórios;
- Administração — Centro de Dados, Auditoria & Governação, Backup & Recuperação e Upload/Setup quando permitido.

As vistas históricas que continuam a ter utilidade técnica não foram apagadas. Deixam apenas de ocupar a navegação principal e podem continuar a ser abertas por pesquisa/atalho quando aplicável.

## Hotel 360º

Nova visão executiva por unidade, com separadores:

`Visão Executiva | Financeiro | Revenue | Operação | Reputação | Ações | Documentos`

A visão executiva agrega informação já produzida pelos módulos existentes, incluindo Performance Hotel, Benchmarking, Revenue Intelligence, Ações, Reputação, Anomalias e Qualidade de Dados.

Inclui sempre um acesso direto à Ficha do Hotel original.

## Score Operacional — V28 integrado

A V30 integra a funcionalidade que estava prevista para a V28.

O Score é explicável e configurável, com seis dimensões:

- Financeiro;
- Revenue;
- Eficiência;
- Reputação;
- Execução;
- Dados.

Os pesos por defeito são 25/20/15/15/15/10 e são normalizados para 100%. A Direção pode ajustar os pesos; a configuração é partilhada através do recurso existente `settings-score-v30`.

O Score não cria uma nova fonte financeira. Reutiliza o modelo canónico do Hotel Performance/Benchmarking e os restantes módulos existentes.

## Análise automática de causa

O Hotel 360º inclui uma ponte explicativa da variação do GOP com sede entre os dois períodos comparáveis:

`Δ Receita − Δ Custos por família + residual de reconciliação = Δ GOP com sede`

São destacados, quando disponíveis, Pessoal, Energia, Manutenção, Comidas, Bebidas, Operacionais, Marketing, outros custos e efeito de sede/reconciliação.

Esta análise é apresentada como **explicação estimada de contributos**, não como causalidade contabilística forense.

## Objetivos & Planos de Recuperação

As metas explícitas e o Forecast podem gerar gaps operacionais visíveis no Hotel 360º.

A partir de um gap é possível criar uma Ação de recuperação usando o módulo de Ações já existente. Assim, o fluxo fica:

`Meta → Gap → Ação → acompanhamento`

Não é criado um segundo sistema de tarefas.

## Revenue & Forecast

A V30 cria uma única experiência com três separadores:

`Situação atual | Forecast | Cenários`

Por baixo, continuam a ser utilizados os módulos existentes:

- Revenue Intelligence;
- Forecast & Cenários;
- Comparação de Cenários V29.

Não existe uma segunda fórmula de Forecast ou de GOP.

## Alertas e Notificações

As Notificações Inteligentes passam a ser a camada principal de aviso ao utilizador. Os Alertas clássicos continuam disponíveis como detalhe técnico/drill-down, mas deixam de ocupar a navegação principal.

## Assistente Analítico

O Assistente deixa de depender de uma página visível no menu principal e passa a ter acesso transversal pelo botão `Perguntar aos dados` no topo, mantendo o motor local e as regras da V25.

## Home por perfil

O Resumo passa a adaptar a leitura inicial ao perfil:

- Direção/Admin — visão do portefólio, críticos/atenção/estáveis, receita em risco, ações vencidas, Score médio e prioridades;
- Diretor/Assistente — visão da própria unidade, Score, estado, ações, Forecast e prioridades/notificações relevantes.

## Compatibilidade e PWA

A V30 mantém o mecanismo de coerência de versão introduzido na V29.1. O service worker usa `vg-operations-shell-v30`, mantém a aplicação estática em cache e continua a excluir `/.netlify/` e dados empresariais do cache operacional.

O backend `dashboard-sessao.js` permanece inalterado face à V29.1. A nova configuração do Score usa o recurso genérico de `settings` já protegido no servidor, e os planos de recuperação usam o endpoint existente de Ações.

## Publicação

O pacote é entregue completo e em dois lotes com menos de 100 ficheiros cada para upload pelo GitHub no browser.

Não é necessária a eliminação manual de ficheiros da V29.1: a V30 preserva os módulos legados necessários por compatibilidade e apenas simplifica a navegação visível.


## V30.1 — Correção da navegação
A reconstrução do menu preserva agora todos os botões antes de remover os grupos antigos. Isto corrige os grupos vazios vistos na V30. A Ficha do Hotel permanece independente e o respetivo módulo não foi alterado.
