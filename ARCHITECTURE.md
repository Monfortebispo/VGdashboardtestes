# Arquitetura — VG Dashboard v27

## Workflow de Aprovações

A V27 acrescenta um fluxo formal de pedidos e decisões sobre a arquitetura já existente de autenticação, Netlify Functions e Netlify Blobs.

Frontend:

- `assets/js/modules/workflow-approvals-v27.js`
- `assets/css/workflow-approvals-v27.css`
- vista `#view-approvals`
- API `VG.approvals`

Backend:

- `ops-approvals` — lista pedidos visíveis ao utilizador autenticado;
- `ops-approval-save` — cria ou atualiza pedidos pendentes;
- `ops-approval-decide` — aprova/rejeita, reservado à Direção;
- `ops-approval-cancel` — cancela pedidos ainda pendentes.

Os Blobs `ops-approval/<id>` não podem ser alterados pela API genérica.

## Estados e tipos

Estados:

```text
pending
approved
rejected
cancelled
```

Tipos:

```text
target
configuration
operational
exception
document
decision
```

Prioridades:

```text
normal
high
critical
```

## Âmbito e permissões

- Diretor/Assistente: pode submeter pedidos para o hotel associado à conta.
- Direção/Admin: pode submeter pedidos para qualquer hotel.
- Apenas Direção/Admin pode aprovar ou rejeitar.
- Quando existe um aprovador específico, outro utilizador da Direção não pode decidir esse pedido.
- Um pedido pendente pode ser editado pelo requerente ou pela Direção.
- Alterações concorrentes são rejeitadas através de `expectedUpdatedAt`.

## Segregação de funções

A autoaprovação não é tratada como uma aprovação normal.

Quando o requerente pertence à Direção e tenta decidir o próprio pedido, o servidor exige:

- `overrideSelf=true`;
- justificação com pelo menos 20 caracteres;
- registo `selfApprovalException=true`;
- evento crítico na Auditoria & Governação.

Isto permite uma exceção operacional sem esconder a quebra de segregação de funções.

## Associações

Um pedido pode ser ligado a:

```text
hotel
ops-action/<id>
ops-agenda/<id>
ops-doc-meta/<id>
meta/regra em texto
```

O backend valida que Ações, Agenda e Documentos pertencem ao mesmo hotel.

A V26 foi também estendida para que um documento possa ser associado a um pedido de aprovação.

## Auditoria, notificações e pesquisa

- submissão, atualização, aprovação, rejeição e cancelamento entram no trilho V16;
- autoaprovações excecionais ficam marcadas como críticas;
- V21 gera notificações de pedidos pendentes para a Direção e decisões recentes para o requerente;
- V19 indexa pedidos no `Ctrl+K`;
- mobile/PWA expõe `Aprovações` em `Decidir e agir`.

## Backup & Recuperação

`ops-approval/` passa a ser uma chave de negócio recuperável pela V17. Os snapshots V27 guardam `appVersion: "27"`.

## PWA

Shell estático atualizado para `vg-operations-shell-v27`.

Apenas HTML/CSS/JS/ícones são cacheados. Pedidos, decisões e restantes dados operacionais continuam `network-only`.
