# Matriz inicial de auditoria — VG Dashboard

Legenda de prioridade:

- P0 — segurança, autenticação, navegação, persistência transversal ou risco de quebra global.
- P1 — processo operacional/financeiro crítico com escrita persistente.
- P2 — análise/reporting relevante, mas com menor risco transacional.
- P3 — suporte/UX ou funcionalidade complementar.

Legenda de estado:

- `CONSOLIDAR` — existem versões/patches sobrepostos ou comportamento recente comprovadamente instável.
- `AUDITAR` — existe implementação e testes, mas falta execução do protocolo funcional completo da Fase 1.
- `MAPEAR` — ainda é necessário confirmar fonte de verdade, carregamento e dependências.

| Domínio | Frontend principal | Backend / persistência observada | Testes observados | Prioridade | Estado inicial | Observação de auditoria |
|---|---|---|---|---|---|---|
| Autenticação / sessão | `auth/auth-client.js` + patches V36 | `dashboard-sessao.js` | `security.test.js`, `v35_4-access-control.test.js` | P0 | AUDITAR | `dashboard-sessao.js` é muito grande e concentra múltiplas responsabilidades; precisa mapa de recursos/actions. |
| Navegação / shell | `core/02-navigation-kpis.js`, `ui/navigation-shell.js`, `ui/vg-operations-2-v30.js` | n/a | `navigation-v30_1.test.js`, `v35_6-navigation-governanta.test.js`, integração V32/V33 | P0 | CONSOLIDAR | Existem múltiplas camadas com capacidade de mostrar/ocultar vistas. Problema recente de Mensagens confirmou risco de conflito. |
| Runtime / estado | `core/00-runtime.js`, `04-bootstrap.js`, `06-version-guard-v29_1.js`, `07-markets-v31.js` | sessão + browser | `runtime.test.js`, `version-coherence-v29_1.test.js`, markets tests | P0 | AUDITAR | Validar autoridade única para contexto market/região/hotel/ano/mês. |
| Persistência / partilha | `core/03-persistence-sharing.js` | `dashboard-sessao.js` / Netlify Blobs | governance/data-center/security | P0 | AUDITAR | Classificar dados em temporários, operacionais e críticos. |
| Mensagens | `communications-v38.js`, `communications-stability-v38_1.js`, `communications-v38_2.js`; V39 residual | `communications-v38.js` | `communications-v38.test.js` | P0 | CONSOLIDAR | Confirmada fragmentação e dessincronização UI/lista/thread; consolidar diretamente no motor principal. |
| Workflow de Aprovações | V27 compatibilidade, V36, `workflow-hub-v37.js` | `process-workflow-v36.js`, `workflow-hub-v37.js` | V27/V36 + version coherence | P0 | CONSOLIDAR | Três gerações convivem. Precisamos contrato único de navegação, foco e decisão. |
| Backup & Recuperação | `backup-recovery.js` | `recovery-v36.js` + recursos centrais | `backup-recovery.test.js`, `backup-recovery-v36.test.js` | P0 | AUDITAR | Já houve falhas em produção; executar percurso criar snapshot → listar → restaurar → validar integridade. |
| Centro de Dados | `data-center.js` | sessão/recursos centrais | `data-center.test.js` | P0 | AUDITAR | Deve tornar-se referência para saúde das fontes e futuro Centro de Importação. |
| Reclamações | `complaints-v36.js` | `complaints.js` | `complaints-v36.test.js` | P1 | AUDITAR | Testar hotel scope, decisão DO, resposta, arquivo, anexos e alertas. |
| Devoluções | `refunds-v36.js` | `refunds.js` | `refunds-v36.test.js`, `refunds-unbilled-v36.test.js` | P1 | AUDITAR | Testar ligação a reclamação, DO/DAF, processamento e alertas. |
| Orçamentos | `budgets-v36.js` | `budgets.js` | `budgets-v36.test.js` | P1 | AUDITAR | Histórico recente de propostas que não persistiam; testar 3–4 propostas e adjudicação ponta-a-ponta. |
| Contas por Faturar | `unbilled-v36.js` + `unbilled-import-layout-fix-v36.js` | `unbilled.js` | `refunds-unbilled-v36.test.js` | P1 | CONSOLIDAR | Patch de import/layout separado; histórico de importação aparentemente concluída sem dados visíveis. |
| City Ledger | `city-ledger-v32.js` | recursos centrais / `dashboard-sessao.js` | 4 suites específicas V32/V33 | P1 | AUDITAR | Testar importação, aging, diligências, anexos/comentários, filtro por hotel e PDF. |
| Energia | `energy-v36.js` + 4 patches V36 | `energy.js`, `energy-files.js`, delete document/record | `energy-v36.test.js`, `energy-multi-pdf-v36.test.js` | P1 | CONSOLIDAR | Forte candidato inicial à consolidação por haver menu fix, multi-PDF, delete UI e record management separados. |
| Banco de Horas & Férias | `hr-balances-v36.js` + import/layout fixes + access bridge | `hr-balances.js` | `hr-balances-v36.test.js` | P1 | CONSOLIDAR | Validar importação real, resumo por departamento, permissões e performance com muitos colaboradores. |
| Perdidos & Achados | `lost-found-v36.js` + email/mobile + status/comment + access bridge | `lost-found.js`, `lost-found-email.js`, `lost-found-mobile.js` | 2 suites V36 | P1 | CONSOLIDAR | Há fragmentação frontend/backend. Validar estados, foto/PDF, comunicação e hotel scope. |
| Housekeeping & Têxtil | `housekeeping-native-v35.js` + governanta fix | `hk-store.js` | native modules, V35, V35.4, V35.6 | P1 | AUDITAR | Módulo muito grande; arquitetura documenta RBAC server-side e lazy loading. |
| Compras & A&B | `compras.js`, `compras-ab-native-v35.js` | `custos-ab-store.js` | native modules + anomaly purchases | P1 | AUDITAR | Dois módulos grandes; mapear fronteira entre Compras genéricas e Custos/Compras A&B. |
| Receitas / P&L / Custos | core + `pl-usali.js`, `cost-analysis.js`, `receitas-detalhe.js`, `custo-atividade.js` | sobretudo recursos centrais | import, KPI quality, unit economics, integrações | P1 | AUDITAR | Fonte financeira central; testar coerência mensal/acumulada e geografia. |
| Rácios A&B | lógica core + `fb-ratios-period-fix-v36.js` | dados financeiros/importados | `fb-ratios-period-consistency-v36.test.js` | P1 | CONSOLIDAR | Existe fix explícito V36; foi área com valores impossíveis. Confirmar fórmula e base temporal. |
| Hotel 360 / Ficha Hotel | `hotel-360-v30.js`, `ficha-hotel.js`, `hoteis.js` | sessão/documentos | hotel 360, hotel docs, V30 guards | P1 | AUDITAR | Ficha Hotel tem contrato histórico de preservação; alterações exigem cautela. |
| Reputação | `reputacao.js` | dados centrais/importados | reputation sources V34 | P2 | AUDITAR | Validar fontes, GRI e filtros por origem/hotel. |
| Revenue & Forecast | `revenue-intelligence.js`, `revenue-hub-v30.js`, `forecast-scenarios.js`, scenario V29 | dados centrais | várias suites revenue/forecast/scenario | P2 | AUDITAR | Hub agrega interfaces legadas; confirmar que não duplica estado/cálculo. |
| Benchmarking | `benchmarking.js` | dados centrais | `benchmarking.test.js` | P2 | AUDITAR | Verificar pares, regiões, mercados e moeda. |
| Deteção de Anomalias | `anomaly-detection.js` | dados centrais | 3 suites | P2 | AUDITAR | Validar regras com dados reais e ausência de falsos positivos grosseiros. |
| Unit Economics | `unit-economics-v32.js` | dados centrais | `unit-economics-v32.test.js` | P2 | AUDITAR | Confirmar energia incluída e bases QD/QO/dormida/cliente/chegada. |
| Relatórios automáticos / PDF | `automatic-reports-v24.js`, `pdf-export.js`, `operational-summary-pdf-v32_6.js` | browser | suites PDF/reporting | P2 | AUDITAR | Validar output visual real além de testes estruturais. |
| Gestão de Documentos | `document-management-v26.js` | recursos documentais centrais | `document-management-v26.test.js`, hotel documents | P1 | AUDITAR | Deve convergir com futuro Centro de Importação, sem confundir arquivo documental com ingestão de dados. |
| Instagram | `instagram.js` | persistência central | integração UI histórica | P3 | MAPEAR | Confirmar se está operacional e se depende de dados manuais. |
| Agenda / Ações | `actions-management.js`, `agenda-tempo.js`, `operational-agenda-v22.js` | persistência central | actions + agenda | P1 | AUDITAR | Garantir uma única fonte de verdade para ação, responsável, prazo e histórico. |
| PWA / Mobile | `ui/mobile-pwa.js`, `service-worker.js`, manifest | cache/browser/push | `pwa-mobile.test.js` | P0 | AUDITAR | Validar cache, atualização de versão, notificações e comportamento offline/online. |

## Primeira ordem recomendada de execução

1. Navegação / runtime / autenticação.
2. Mensagens / notificações.
3. Workflow / Reclamações / Devoluções / Orçamentos.
4. Persistência / Backup & Recuperação.
5. Centro de Dados / Centro de Importação.
6. Energia / Contas por Faturar / Banco de Horas / City Ledger.
7. Housekeeping / Compras & A&B.
8. Financeiro e analytics.
9. Reporting, documentos e módulos complementares.

A ordem privilegia primeiro componentes transversais: um defeito em navegação, sessão ou estado pode contaminar vários módulos e tornar pouco fiáveis os testes realizados depois.
