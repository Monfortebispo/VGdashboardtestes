# VG Dashboard — Fase 1: Estabilização e Consolidação

Estado: AUDITORIA EM CURSO
Branch exclusiva: `phase1/stabilization-audit`
Base auditada: `main` em `5f2f9cc071cf6bba7710d85436314cccdb4d5332`

## Regra de governação

Durante esta fase não são efetuados merges para `main` nem deploys de produção sem autorização expressa do responsável do projeto.

A Fase 1 não tem como objetivo acrescentar funcionalidades. O objetivo é transformar a aplicação existente numa base previsível, testável e consolidada, preservando as funcionalidades atuais.

## Sequência de trabalho

1. Inventário técnico integral.
2. Mapa de dependências e versões sobrepostas.
3. Classificação dos módulos por criticidade e risco.
4. Auditoria funcional uniforme por módulo.
5. Consolidação de patches/versionamento interno.
6. Consolidação da navegação e do estado global.
7. Auditoria das Netlify Functions e autorização server-side.
8. Auditoria de persistência, documentos, backups e recuperação.
9. Consolidação do Centro de Importação.
10. Reorganização da suite de testes em unit / integration / smoke.
11. Staging e critérios objetivos de release.
12. Candidato a `VG Dashboard 1.0.0`.

## Estado técnico encontrado no arranque

### Base de execução

- `package.json` declara atualmente a versão `35.6.0`.
- `npm test` e `npm run validate` usam `tests/run-tests.js`.
- `netlify.toml` executa `npm test` como comando de build; um teste falhado impede o deploy.
- O runner executa sequencialmente todos os ficheiros `*.test.js` e interrompe no primeiro erro.

### Arquitetura existente

A aplicação já possui separação física relevante:

- `assets/js/core/` — runtime, importação, navegação/KPIs, persistência, bootstrap, performance, version guard e mercados;
- `assets/js/auth/` — autenticação e patches de âmbito/permissões;
- `assets/js/modules/` — módulos operacionais e analíticos;
- `assets/js/ui/` — shell de navegação, notificações, pesquisa, PWA e centro operacional;
- `netlify/functions/` — persistência e APIs server-side;
- `tests/` — regressão automática.

A arquitetura documentada desde V35.3/V35.4 já estabelece corretamente que ocultar botões não constitui segurança e que a autorização relevante deve existir também nos endpoints server-side.

## Dívida técnica confirmada

O runtime atual contém simultaneamente componentes e contratos identificados por várias gerações (`v21`, `v23`, `v25`, `v27`, `v28`, `v29`, `v30`, `v31`, `v32`, `v33`, `v35`, `v36`, `v37`, `v38` e fixes intermédios).

Exemplos que exigem consolidação prioritária:

- Mensagens: `communications-v38.js` + `communications-stability-v38_1.js` + `communications-v38_2.js`; existe ainda `communications-v39.js` no repositório, embora já não deva governar a interface ativa.
- Workflow: `workflow-approvals-v27.js` + `workflow-approvals-v36.js` + `workflow-hub-v37.js` e backends V36/V37.
- Energia: módulo base V36 mais ficheiros separados para menu, múltiplos PDF, eliminação documental e gestão do registo.
- Banco de Horas: V36 mais patches de importação e layout, além de bridge de acesso.
- Perdidos & Achados: V36 mais patches de email/mobile, comentário de estado e bridge de acesso.
- Contas por Faturar: V36 mais patch de importação/layout.

Esta sobreposição é classificada como risco estrutural porque permite que uma correção local altere navegação, estado ou comportamento de outro módulo.

## Regras para consolidação

1. Não apagar ficheiros históricos apenas pelo nome/versionamento.
2. Antes de consolidar um conjunto, identificar quem o carrega, APIs globais expostas, testes que o protegem e dependências de outros módulos.
3. Criar primeiro testes de comportamento atual que queremos preservar.
4. Consolidar numa branch isolada.
5. Executar regressão integral.
6. Só propor merge depois de documentar diferenças e riscos residuais.

## Gate de saída da Fase 1

A fase só pode ser dada como concluída quando:

- todos os módulos visíveis e ocultos/legados estiverem inventariados;
- não existirem erros críticos conhecidos;
- módulos críticos tiverem testes funcionais e de autorização;
- navegação tiver uma única autoridade de ativação de vistas;
- patches desnecessários tiverem sido consolidados;
- permissões críticas forem validadas server-side;
- backup e restore tiverem teste de percurso completo;
- importações críticas estiverem cobertas com ficheiros representativos;
- existir smoke test transversal;
- staging estiver definido e a produção permanecer protegida pelo gate de testes.
