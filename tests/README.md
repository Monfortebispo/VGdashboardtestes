# Testes automáticos — VG Dashboard v8

A suite corre sem dados reais, sem Internet e sem acesso aos Netlify Blobs de produção.

## Executar

```bash
npm test
```

## Suites

- `actions-management.test.js` — carregamento, responsáveis, prazos, atrasos, estados e fechos das ações.
- `import.test.js` — parser real do P&L, anos dinâmicos e indicadores oficiais.
- `kpi-data-quality.test.js` — GOP, ADR, ocupação, RevPAR/TRevPAR, custos e validações.
- `operations-center.test.js` — prioridades agregadas, Revenue at Risk, oportunidades e ligação às ações.
- `revenue-decision.test.js` — API real `VG.revenue.getDecisionSnapshot()` com snapshots sintéticos.
- `runtime.test.js` — `VG.events`, `VG.state`, versão e utilitários.
- `security.test.js` — autenticação, revogação, permissões, auditoria e segurança server-side das ações.
- `structure.test.js` — sintaxe, recursos, ausência de patches/credenciais e presença da Central v8.

## Integração automática

`.github/workflows/vg-dashboard-tests.yml` corre os testes em push/pull request para `main`.

`netlify.toml` executa `npm test` antes do deploy. Um teste falhado impede a publicação desse deploy.
