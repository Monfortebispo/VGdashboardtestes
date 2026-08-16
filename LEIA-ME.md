# Atualização V32.5 — City Ledger e Assistente Analítico

- PDF de extrato do City Ledger com paleta fixa para impressão: cabeçalho branco sobre azul e corpo sempre em texto escuro, independentemente do tema da dashboard.
- Metas do “Perguntar aos dados” formatadas por KPI: crescimento de Receita em %, Ocupação/Margens/Rácios em %, ADR e RevPAR em moeda.
- Removido o ruído de precisão de ponto flutuante (ex.: `74.848424...`).
- Cache PWA atualizado para `vg-operations-shell-v32-5`.
- Regressão completa: 46/46 suites aprovadas.

---

# VG Operations 2.0 — v30

A V30 é uma consolidação de produto sobre a V29.1. O objetivo não é acrescentar páginas indiscriminadamente, mas reduzir a fragmentação da experiência mantendo as funcionalidades existentes disponíveis.

## Regra imutável: Comentários Fecho do Mês

A **Comentários Fecho do Mês permanece independente, com entrada própria no menu e sem alterações ao seu módulo**.

O ficheiro `assets/js/modules/ficha-hotel.js` é byte-a-byte igual ao da V29.1. O Hotel 360º é uma nova visão executiva complementar e nunca substitui a Comentários Fecho do Mês.

## Nova navegação principal

A navegação é simplificada em torno de:

- Início & Hotéis — Resumo, Comentários Fecho do Mês, Hotel 360º;
- Gestão — Ações, Agenda Operacional, Aprovações;
- Análise — Receitas, Custos, P&L USALI, Revenue & Forecast, Compras, Benchmarking, Anomalias;
- Suporte — Documentos, Relatórios;
- Administração — Centro de Dados, Auditoria & Governação, Backup & Recuperação e Upload/Setup quando permitido.

As vistas históricas que continuam a ter utilidade técnica não foram apagadas. Deixam apenas de ocupar a navegação principal e podem continuar a ser abertas por pesquisa/atalho quando aplicável.

## Hotel 360º

Nova visão executiva por unidade, com separadores:

`Visão Executiva | Financeiro | Revenue | Operação | Reputação | Ações | Documentos`

A visão executiva agrega informação já produzida pelos módulos existentes, incluindo Performance Hotel, Benchmarking, Revenue Intelligence, Ações, Reputação, Anomalias e Qualidade de Dados.

Inclui sempre um acesso direto à Comentários Fecho do Mês original.

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
A reconstrução do menu preserva agora todos os botões antes de remover os grupos antigos. Isto corrige os grupos vazios vistos na V30. A Comentários Fecho do Mês permanece independente e o respetivo módulo não foi alterado.


## V30.3 — Correções consolidadas
- O Portefólio da Home respeita o filtro ativo de região/hotéis.
- A Ponte do GOP apresenta contribuição económica: menos custo melhora GOP (verde), mais custo deteriora (vermelho), independentemente do sinal contabilístico da rubrica.
- Revenue & Forecast incorpora as views originais completas, preservando os IDs usados pelos estilos e pelos renderizadores legados.
- Comentários Fecho do Mês e backend não foram alterados.

## V31 — Mercados Internacionais

A VG Operations passa a trabalhar com dois universos financeiros independentes:

- `PT + ES` — moeda EUR (`€`);
- `Brasil` — moeda BRL (`R$`).

O seletor `Mercado` no topo muda o contexto integral da aplicação: hotéis, regiões, P&L, ocupação, reputação, Compras, Benchmarking, Revenue, Forecast, Score, metas, relatórios e registos operacionais.

### Regra de isolamento

A aplicação nunca soma nem compara diretamente valores financeiros EUR e BRL. Não existe conversão cambial na V31. Rankings, percentis, anomalias, metas e Score são calculados apenas dentro do mercado ativo.

Os dados já existentes mantêm-se como `PT + ES`; não é necessária uma reimportação. No backend, as chaves históricas de PT+ES permanecem intactas. O Brasil utiliza namespace próprio (`market/brasil/...`) para recursos genéricos e o campo `market` nos registos operacionais.

### Brasil — unidades iniciais

A configuração inicial é baseada nos ficheiros P&L/A&B fornecidos e contém 13 unidades:

`FORTALEZA`, `SALVADOR`, `CUMBUCO`, `RIO DE JANEIRO`, `TOUROS`, `MARES`, `PAULISTA`, `CABO`, `ECO RESORT DE ANGRA`, `ALAGOAS`, `COLLECTION SUNSET CUMBUCO`, `COLLECTION OURO PRETO`, `COLLECTION AMAZÔNIA`.

Grupos iniciais, editáveis no Setup:

- Cidade — Fortaleza, Paulista, Rio de Janeiro, Salvador;
- Resorts — Alagoas, Cabo, Cumbuco, Eco Resort de Angra, Mares, Touros;
- Collection — Collection Amazônia, Collection Ouro Preto, Collection Sunset Cumbuco.

### Importações mistas

O runtime V31 separa automaticamente dados mistos por hotel. Isto permite que fontes comuns de Ocupação/Reputação que contenham PT/ES e Brasil alimentem os dois bancos sem misturar os universos. P&L e Compras detetam o mercado pelos hotéis presentes no ficheiro e, quando necessário, mudam o contexto antes de aplicar os dados.

### Comentários Fecho do Mês

O ficheiro `assets/js/modules/ficha-hotel.js` continua byte-a-byte inalterado. A moeda é adaptada externamente pelo runtime V31: EUR em PT+ES e BRL no Brasil.

### Segurança e permissões

Direção/Admin pode alternar entre os dois mercados. Diretor/Assistente fica automaticamente limitado ao mercado da unidade associada. O backend valida novamente o parâmetro `market`; alterar manualmente o URL não permite consultar o outro universo.

### PWA

- Build guard: `31.1`;
- Service worker: `vg-operations-shell-v31_1`;
- API/Netlify continua network-only;
- dados empresariais não entram no cache estático.


## V31.1 — Correção do seletor de mercado
- Corrige a montagem do seletor PT+ES / Brasil na barra superior.
- A âncora `.theme-dots` é filha de `.topbar-right`; a V31 tentava usá-la como filho direto de `.topbar`, provocando `NotFoundError`.
- O seletor é agora inserido em `.topbar-right`, antes dos temas, com fallback seguro.
- Em mobile mostra apenas as bandeiras para preservar espaço.

## V31.2 — Isolamento visual entre mercados

- Ao trocar de PT+ES para Brasil (ou inverso), a UI derivada do mercado anterior é limpa imediatamente.
- Se o mercado ativo ainda não tiver P&L, o Resumo, Comentários Fecho do Mês, Hotel 360º e restantes vistas dependentes de P&L não mostram valores antigos.
- O topo passa a 0 unidades e período “—”; o painel lateral de KPIs é ocultado enquanto não houver P&L do mercado ativo.
- A mensagem de vazio identifica explicitamente o mercado ativo e garante que o mercado anterior não está a ser usado na análise.
- A Comentários Fecho do Mês continua byte-a-byte inalterada; a limpeza é feita externamente pelo runtime de mercados.

## Novidades V32

A V32 acrescenta dois módulos ao menu principal:

- **City Ledger & Cobranças** — importa o ficheiro City Ledger, calcula vencimentos a 30 dias, aging real, detalhe por hotel/cliente/fatura, snapshots de evolução e histórico de diligências (telefone, email, reunião ou outro contacto).
- **Eficiência & Unit Economics** — recupera o racional ABC e amplia-o para custos, receitas e GOP por quarto disponível, quarto ocupado, dormida, hóspede/cliente e chegada. A Energia é analisável em todas estas bases.

O City Ledger ignora automaticamente linhas de empresas/entidades que aparecem na coluna HOTEL mas não fazem parte da lista oficial de hotéis da VG Operations. A coluna ENTIDADE não é usada para excluir devedores.

As diligências de cobrança não são escritas no Excel. Ficam na VG Operations e sobrevivem a importações futuras do City Ledger.

## HOTFIX CITY LEDGER — 2026-08-16
- Filtro por Situação de Crédito.
- Pesquisa sem perda de foco durante a escrita.
- Filtros refletidos nos KPIs/resumos.
- Importação mantém snapshots anteriores e diligências; o ficheiro mais recente da mesma data assume a vista atual.


## V32.2 — Hotéis e uniformização visual
- Recuperada a página **Hotéis**, com características e fichas técnicas por unidade. O módulo já existia; tinha ficado oculto pela simplificação da navegação.
- A página Hotéis respeita a **Geografia** ativa (PT + ES / Brasil) e não mistura carteiras.
- A designação visível **Ficha do Hotel** passa a **Comentários Fecho do Mês**. A rota interna `fichahotel` e o ficheiro `assets/js/modules/ficha-hotel.js` mantêm-se por compatibilidade; a lógica funcional foi preservada.
- Removida a barra flutuante horizontal de atalhos. O comando rápido `Ctrl/Cmd + K` continua disponível.
- Reforçado o contraste de Notificações e Pesquisa na barra superior.
- Compras & Artigos passa a usar a mesma linguagem visual, cartões, tipografia, estados e paleta global da aplicação.


## V32.4 — contraste dos temas claros + navegação Qualidade & Comunicação
- Corrigido o contraste de Notificações, Pesquisar, atalho Ctrl K, estado online e Perguntar aos dados nos temas ERP e Vila Galé.
- O tema azul escuro mantém o contraste original.
- Reputação e Instagram voltam ao menu lateral numa área própria `Qualidade & Comunicação`.
- Os módulos e respetivos dados não foram recriados: já existiam; o acesso tinha sido ocultado pela simplificação V30.



### V33.1 — integração visível + City Ledger multi-entidade

- O detalhe do City Ledger por hotel passa a ter filtro compacto de Clientes / Entidades com seleção múltipla por checkbox.
- `Todos os clientes` / `Limpar seleção` e `Limpar filtros` permitem regressar imediatamente à visão completa.
- Os módulos integrados ficam explicitamente visíveis no grupo `Operação Integrada` e num lançador no Resumo.
- O topo da aplicação mostra `V33.1 · Integrado`, permitindo confirmar visualmente que o deploy atualizado está ativo.
- Service Worker / version guard foram incrementados para 33.1 para evitar HTML/JS antigos após deploy.

## V33 — Plataforma Integrada

A V33 absorve os principais domínios operacionais que existiam em ferramentas separadas sem usar iframes. A Dashboard passa a ter Receita Detalhada, Compras & A&B, Fichas Técnicas/Receituário, Housekeeping/Inventário Têxtil e uma área unificada de Reputação semanal/semestral.

- `assets/js/modules/operations-domains-v33.js` contém a orquestração dos novos domínios.
- `assets/data/operations-seed-v33.json` inclui os dados de referência fornecidos para Reputação semanal, receituário PT/BR, fichas técnicas, exemplo de receita detalhada e catálogo/parametrização têxtil.
- Reputação mantém a vista semanal ReviewPro existente e acrescenta visão executiva, importação semestral e ficha por hotel.
- Receita Detalhada aceita mapas ao nível Hotel → PdV → Família → Subfamília → Grupo → Artigo. Se o ficheiro não identificar período, não é inventado um mês/ano.
- Compras & A&B lê o mapa mensal do Departamento de Compras, rácios, resumo geral, inventários/compras e cruza vendas, receituário e reputação.
- Housekeeping preserva inventário permanente, quebras por causa, campanhas físicas, par-stock por índice × vestido 100% e sugestão dinâmica ligada ao forecast de ocupação.
- O export PDF do dashboard foi corrigido para alinhar todos os cabeçalhos com as colunas efetivamente impressas e usa identidade Vila Galé no cabeçalho.

## V34.0 — integração funcional completa e auditada

A V34.0 corrige as lacunas funcionais identificadas após o primeiro deploy integrado.

- **Housekeeping & Têxtil** passa a incorporar a ferramenta original de Inventário de Roupas praticamente na íntegra, em `integrated/housekeeping/index.html`, reutilizando a sessão da Dashboard quando aberto dentro da plataforma. Mantém Painel, Inventário, Projeção de compra, Relatório executivo, Comparação de campanhas, Análise/Mapa de quebras, Valorização, Alertas de rutura, Campanhas, Utilizadores, Catálogo, Registo de alterações e modo Governanta/mobile. O backend original está em `netlify/functions/hk-store.js`.
- **Custos & Compras A&B** passa a incorporar a ferramenta original do Departamento de Compras em `integrated/custos-ab/index.html`, com Evolução Mensal, Sub-Famílias, Detalhe de Artigos, Análise Hotel, Inventário, Receitas, Stock & Internos, Comentários, Sugestão de Encomenda, Excessos, Previsão, Previsto vs. Real e Roomnights. Reutiliza a sessão da Dashboard e o backend `netlify/functions/custos-ab-store.js` (`/api/shared`).
- **Reputação semanal** expõe diretamente o GRI por origem/fonte — Booking.com, Expedia, Google, Tripadvisor e restantes fontes presentes no relatório — com GRI, variação, reviews e semântica/menções. A ficha do hotel inclui ainda departamentos, concorrência, idiomas, países, ranking interno, categorias e tendências.
- **Fichas Técnicas & Receituário** passa a abrir a ficha completa ao clicar num cartão, com ingredientes, quantidades, preparação, copo, PVP, custo, Beverage Cost, margem e aplicabilidade. A biblioteca é paginada para evitar renderizar centenas de fichas simultaneamente.
- **Consumo Teórico** deixa de usar correspondência difusa por partes do nome. Apenas associações exatas normalizadas ou aliases explicitamente controlados entram nos cálculos. O resultado mostra venda→ficha, consumo teórico por ingrediente e artigos sem associação, que ficam excluídos até validação.
- **Buffets & Ementas** recebe uma área própria com importação de Excel, filtros de hotel/refeição e ligação às fichas técnicas. Não são inventados pratos/capitações quando a fonte original não está disponível no pacote.
- **Resumo Operacional PDF** volta a ter um botão visível `PDF acumulado` no próprio Resumo. O módulo de geração é carregado pelo `index.html`, produz A3 horizontal, logo Vila Galé, acumulado Janeiro→mês final e aviso de meses em falta.
- **PDF geral** mantém os cabeçalhos corrigidos e acrescenta rodapé institucional e indicação para desativar os cabeçalhos/rodapés do navegador, evitando `about:blank`, URL e data automáticos.
- **City Ledger** mantém o filtro multi-entidade por hotel e as ações `Todos os clientes / Limpar seleção` e `Limpar filtros`.
- **Performance**: o seed integrado pesado deixa de ser carregado no arranque da Dashboard. Só é pedido quando o utilizador abre Reputação, Receita Detalhada ou A&B; Housekeeping abre diretamente o módulo original sem depender desse seed.

O build visível é `V34.0 · Integrado`; o service worker é `vg-operations-shell-v34-0`.

### V34.0 — mapeamento validado no Consumo Teórico

Quando um artigo de receita detalhada não corresponde exatamente a uma ficha técnica, a V34.0 não tenta adivinhar. O utilizador pode associar manualmente esse artigo a uma ficha técnica existente; a relação fica persistida em A&B, aparece identificada como `Mapeamento validado` e só então passa a entrar nos cálculos de consumo/custo teórico.
