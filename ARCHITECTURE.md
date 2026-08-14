# Arquitetura — VG Dashboard v8

A v8 mantém a arquitetura modular consolidada e acrescenta uma camada persistente de execução de decisões.

## Estrutura principal

```text
index.html
package.json
.github/workflows/
tests/
assets/
  css/
    operations-center.css
    actions-management.css
  js/
    core/
    auth/
    modules/
      revenue-intelligence.js
      actions-management.js
    ui/
      operations-center.js
netlify/functions/
  dashboard-sessao.js
```

A pasta `assets/js/fixes/` continua proibida.

## Camadas principais

### `VG.state`
Estado transversal: anos, meses e sinais de alteração.

### `VG.kpi`
Fonte canónica para os KPIs críticos.

### `VG.shared`
Acesso autenticado aos dados partilhados através da função Netlify.

### `VG.events`
Barramento de eventos para atualização entre módulos.

### `VG.revenue`
API controlada do Revenue Intelligence.

### `VG.operations`
Agrega KPIs, alertas, qualidade dos dados e Revenue Intelligence para construir prioridades executivas.

### `VG.actions`
Nova camada v8 responsável por:

- carregar ações partilhadas;
- associar a ação à prioridade automática através de `sourceKey`;
- calcular ações abertas, atrasadas, sem responsável e resolvidas;
- abrir o editor e o quadro global;
- comunicar com os endpoints server-side das ações.

## Fluxo de decisão v8

```text
KPIs / Alertas / RI / Qualidade
             │
             ▼
       VG.operations
             │
        Prioridade
             │
             ▼
        VG.actions
             │
             ▼
Netlify Function → Blob individual ops-action/<id>
             │
             ▼
Responsável → Prazo → Estado → Histórico → Resolução
```

## Persistência das ações

As ações não são guardadas num único Blob. Cada ação possui uma chave própria:

```text
ops-action/<id>
```

O endpoint `ops-actions` lista os Blobs com esse prefixo e agrega-os para o cliente.

As escritas só são feitas por `ops-action-save`. O acesso genérico direto a `ops-action/<id>` é bloqueado para impedir que o histórico e as validações server-side sejam contornados.

## Concorrência

Cada gravação envia `expectedUpdatedAt`. Se esse valor já não corresponder à ação existente, o servidor devolve conflito e não grava a versão antiga.

Isto protege o caso em que duas pessoas abrem a mesma ação e tentam alterá-la em momentos diferentes.

## Permissões

A autorização é server-side:

- Direção: qualquer hotel;
- Diretor/utilizador associado: hotel da conta;
- responsável explicitamente atribuído: ação atribuída;
- consulta: utilizadores autenticados.

A lista de responsáveis devolve apenas informação mínima de utilizadores ativos.

## Testes

A suite v8 inclui:

1. gestão de ações;
2. importação;
3. KPIs e qualidade de dados;
4. Central de Operações + ligação a ações;
5. API de decisão Revenue;
6. runtime;
7. segurança server-side + permissões de ações;
8. estrutura e sintaxe.

GitHub Actions e Netlify continuam a executar `npm test` antes da publicação.

## Regras de manutenção

1. Não adicionar JavaScript funcional ou CSS de negócio ao `index.html`.
2. Não recriar `assets/js/fixes/`.
3. Não duplicar KPIs na Central.
4. Não escrever diretamente em Blobs `ops-action/<id>`.
5. Alterações de ações devem passar pelo endpoint próprio para preservar autorização e histórico.
6. Novos estados devem ser adicionados no cliente, servidor e testes simultaneamente.
7. Autenticação e autorização permanecem server-side.
8. `npm test` deve passar antes de qualquer deploy.
