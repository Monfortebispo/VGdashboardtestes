# Matriz de testes da Fase 1

Esta matriz define o protocolo mínimo a aplicar a cada módulo. Não substitui os testes automáticos existentes; acrescenta critérios funcionais e transversais que hoje não estão uniformemente cobertos.

## A. Smoke transversal

| ID | Teste | Resultado esperado |
|---|---|---|
| SMK-001 | Abrir aplicação sem sessão | Login visível, sem interação bloqueada por bootstrap pesado. |
| SMK-002 | Login válido | Entrada concluída e shell navegável. |
| SMK-003 | Login inválido | Erro claro, sem criar sessão parcial. |
| SMK-004 | Abrir cada item visível do menu | Exatamente uma vista principal ativa. |
| SMK-005 | Alternar rapidamente entre 10 módulos | Nenhuma vista anterior permanece visível; sem bloqueio da página. |
| SMK-006 | Alterar hotel/região/mercado/período | Contexto fica coerente nos módulos que o consomem. |
| SMK-007 | Logout e novo login | Estado privado anterior não é exposto ao utilizador seguinte. |
| SMK-008 | Refresh do browser numa vista | Aplicação recupera sessão/contexto sem duplicar UI. |
| SMK-009 | PWA/Service Worker com nova versão | Não mantém shell incompatível ou ficheiros JS obsoletos. |
| SMK-010 | `npm test` | Todas as suites passam antes de qualquer candidato a release. |

## B. Protocolo obrigatório por módulo

Para cada módulo será criada uma ficha com os seguintes blocos.

### B1 — Navegação

- abre pelo menu;
- abre por deep-link/hash quando suportado;
- regressa a outro módulo sem permanecer visível;
- não cria nav duplicado;
- não cria vista duplicada;
- não altera a classe `active` de vistas que não controla.

### B2 — Dados

- lista/carrega dados;
- cria registo quando aplicável;
- edita;
- elimina/arquiva conforme regra;
- atualização é imediatamente refletida na própria interface;
- refresh do browser preserva dados persistidos;
- estados vazios e erros são apresentados corretamente.

### B3 — Filtros e contexto

- hotel;
- região;
- geografia/mercado;
- ano;
- mês/período;
- estado;
- pesquisa;
- filtros combinados;
- mudança de contexto não mostra dados do contexto anterior.

### B4 — Permissões

Executar no mínimo com:

1. Direção/Admin;
2. utilizador multi-hotel quando exista;
3. utilizador de hotel;
4. perfil sem acesso ao módulo.

Verificar UI e chamada direta ao endpoint. O teste é considerado falhado se a segurança depender apenas de ocultar o botão/menu.

### B5 — Documentos

Quando aplicável:

- upload de 1 ficheiro;
- upload múltiplo;
- formato permitido;
- formato rejeitado;
- limite de tamanho;
- download/abrir;
- eliminar;
- persistência de metadados e bytes;
- tentativa de aceder ao documento de outro hotel/perfil.

### B6 — Integrações

Validar ligações relevantes a:

- Workflow;
- notificações/alertas;
- Mensagens;
- Ações;
- PDFs;
- Centro de Dados;
- imports.

### B7 — Robustez

- duplo clique;
- clicar Atualizar durante edição;
- trocar de módulo durante pedido de rede;
- resposta 401/403/404/409/500;
- ficheiro inválido;
- registo já eliminado;
- dados vazios;
- volume elevado quando aplicável.

## C. Testes prioritários específicos

### Mensagens

| ID | Teste | Critério |
|---|---|---|
| MSG-001 | Criar conversa individual | destinatário correto e nome visível |
| MSG-002 | Criar grupo | todos os selecionados entram corretamente |
| MSG-003 | Novo membro em grupo | só vê mensagens posteriores à entrada |
| MSG-004 | Terceiro tenta ler conversa | backend devolve 403 |
| MSG-005 | Enviar mensagem | aparece ao remetente sem refresh manual |
| MSG-006 | Receber mensagem | aparece automaticamente dentro do SLA definido |
| MSG-007 | Escrever durante sincronização | texto e ficheiro não são perdidos |
| MSG-008 | Lista vs thread | última mensagem é coerente nas duas áreas |
| MSG-009 | Eliminar <2 min | permitido |
| MSG-010 | Eliminar >2 min | recusado server-side |
| MSG-011 | Sair para outro módulo | Mensagens deixa completamente de estar visível |
| MSG-012 | Destinatários | individual mostra pessoa; grupo mostra participantes |

### Workflow / processos

| ID | Teste | Critério |
|---|---|---|
| WFL-001 | Reclamação cria alerta | destinatários corretos |
| WFL-002 | Devolução submetida | chega à decisão DO correta |
| WFL-003 | Orçamento com propostas | propostas persistem após refresh/login |
| WFL-004 | Alerta abre processo | abre diretamente o registo, sem Atualizar manual |
| WFL-005 | Histórico | autor, data/hora, ação e detalhe preservados |
| WFL-006 | Hotel scope | utilizador de hotel não lê/escreve outro hotel |

### Importações

| ID | Teste | Critério |
|---|---|---|
| IMP-001 | ficheiro válido | linhas reconhecidas e contagem apresentada |
| IMP-002 | ficheiro sem linhas válidas | erro explica campos em falta |
| IMP-003 | import concluído | dados aparecem imediatamente no módulo destino |
| IMP-004 | duplicado | comportamento explícito: rejeitar, substituir ou versionar |
| IMP-005 | reimport alterado | resultado previsível e auditável |
| IMP-006 | histórico | ficheiro, utilizador, hora, hotel, período e resultado registados |

### Backup / Restore

| ID | Teste | Critério |
|---|---|---|
| BAK-001 | criar snapshot | snapshot listado com metadados |
| BAK-002 | alterar dados após snapshot | alteração confirmada |
| BAK-003 | restaurar snapshot | dados regressam ao estado esperado |
| BAK-004 | restore parcial proibido/permitido | comportamento documentado |
| BAK-005 | falha durante restore | não deixa estado intermédio silencioso |

## D. Severidade de defeitos

- S0 — perda/exposição indevida de dados, bypass de autenticação, corrupção generalizada. Bloqueia tudo.
- S1 — função crítica inutilizável ou módulo interfere com outros módulos. Bloqueia release.
- S2 — função relevante falha mas existe workaround seguro. Corrigir antes de 1.0.0.
- S3 — visual/UX sem perda funcional. Pode entrar no backlog.

## E. Regra de release

Nenhuma correção é considerada concluída apenas porque o ficheiro compila ou porque um teste estrutural passa.

Para propor merge para `main`, a alteração deve demonstrar:

1. testes específicos da alteração;
2. smoke transversal relevante;
3. regressão integral (`npm test`);
4. diff revisto para ficheiros inesperados;
5. ausência de credenciais/segredos;
6. autorização explícita antes de qualquer deploy de produção.
