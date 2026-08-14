# Arquitetura — VG Dashboard v4

A v4 separa a interface HTML, estilos, motor base e módulos funcionais. A ordem dos `<script>` em `index.html` é deliberada e deve ser preservada: a aplicação ainda utiliza scripts clássicos e funções globais para manter compatibilidade com a versão anterior.

## Estrutura

```text
index.html
assets/
  css/
    base.css
    auth.css
    cost-detail.css
    compras.css
    revenue-intelligence*.css
    theme-v2.css
    ...
  vendor/
    fflate.min.js
  js/
    core/
      01-data-import.js
      02-navigation-kpis.js
      03-persistence-sharing.js
      04-bootstrap.js
      compat-stubs.js
    auth/
      auth-client.js
      restore-after-auth.js
    modules/
      ficha-hotel.js
      pl-usali.js
      custo-atividade.js
      analysis-tools.js
      cost-analysis.js
      reputacao.js
      ocupacao.js
      instagram.js
      pdf-export.js
      agenda-tempo.js
      hoteis.js
      receitas-detalhe.js
      compras.js
      orcamento.js
      revenue-intelligence.js
      whatsapp.js
    ui/
      context-panel.js
      cdn-healthcheck.js
      navigation-safe-v20.js
      chart-actions.js
    fixes/
      cua-4.6.js
      cua-5.0.js
      v17-clean.js
      v17-forecast-warning.js
netlify/
  functions/
    dashboard-sessao.js
```

## Responsabilidades principais

- `core/01-data-import.js`: STORE, anos, parsing/importação P&L e construção da informação base.
- `core/02-navigation-kpis.js`: navegação, seleção de regiões/hotéis, KPIs, gráficos base e componentes transversais.
- `modules/ficha-hotel.js`: Ficha do Hotel, comentários, valores oficiais/acumulados e respetiva lógica.
- `core/03-persistence-sharing.js`: IndexedDB, snapshots, Netlify Blobs, dados partilhados e sincronização.
- `core/04-bootstrap.js`: arranque final e auxiliares de inicialização.
- `auth/*`: autenticação no browser e restauro após autenticação.
- `modules/*`: cada domínio funcional da dashboard.
- `ui/*`: camadas visuais transversais que não devem conter regras de negócio centrais.
- `fixes/*`: compatibilidade/patches históricos ainda necessários. Devem ser eliminados gradualmente quando a lógica respetiva for absorvida pelo módulo definitivo.

## Regras para alterações futuras

1. Não voltar a colocar blocos grandes de JavaScript ou CSS dentro de `index.html`.
2. Uma nova funcionalidade deve entrar no módulo funcional correspondente, ou num novo ficheiro dentro de `assets/js/modules`.
3. Regras de cálculo partilhadas devem ficar no `core`, evitando fórmulas duplicadas em módulos diferentes.
4. Autenticação e permissões do lado do servidor permanecem em `netlify/functions/dashboard-sessao.js`.
5. Não alterar a ordem dos scripts sem validar dependências globais.
6. Os ficheiros em `fixes/` são dívida técnica identificada; não adicionar novos patches aí sem uma razão clara.
7. Dados de negócio partilhados continuam nos Netlify Blobs; preferências puramente visuais podem continuar locais.

## Próxima fase técnica recomendada

A v4 é uma modularização de baixo risco: preserva o modelo global da aplicação. A evolução seguinte pode substituir gradualmente dependências globais por uma API interna (`VG.core`, `VG.data`, `VG.modules`) e absorver os patches históricos nos módulos definitivos. Isso deve ser feito por etapas e com testes de regressão dos KPIs.
