# VG Dashboard — Workflow de Aprovações v27

A V27 acrescenta um processo formal para submeter e decidir pedidos operacionais dentro da VG Operations.

## O que permite

- criar pedidos de aprovação por hotel;
- classificar o pedido como Meta/Objetivo, Configuração, Decisão Operacional, Exceção, Documento ou Outra Decisão;
- definir prioridade Normal, Alta ou Crítica;
- indicar data limite para decisão;
- enviar para a Direção em geral ou para um aprovador específico;
- associar o pedido a uma Ação, evento da Agenda, Documento ou meta/regra;
- editar pedidos ainda pendentes;
- aprovar, rejeitar ou cancelar;
- consultar histórico completo de submissão e decisão;
- pesquisar pedidos na Pesquisa Global;
- receber Notificações Inteligentes de pedidos pendentes/decididos.

## Regras de governação

Diretores e Assistentes só podem criar pedidos para o respetivo hotel.

A decisão final fica reservada à Direção/Admin.

Se um pedido tiver sido atribuído a um aprovador específico, outra pessoa da Direção não o consegue decidir.

A autoaprovação só é permitida como exceção explícita, com justificação detalhada, ficando destacada no registo de auditoria.

## Documentos

A Gestão de Documentos V26 passa também a permitir associar um ficheiro diretamente a um pedido de aprovação.

Assim, uma decisão pode ficar acompanhada de relatório, ata, evidência ou outro documento relevante.

## Auditoria e recuperação

Todas as alterações importantes do workflow entram na Auditoria & Governação V16.

O Backup & Recuperação V17 passa a incluir `ops-approval/*`, permitindo recuperar os pedidos e respetivo histórico.

## Mobile/PWA

`Aprovações` aparece na área `Decidir e agir`.

O service worker continua sem guardar respostas da API ou dados empresariais em cache.

## Validação

A V27 acrescenta uma suite própria que testa:

- submissão por hotel;
- permissões;
- aprovador explícito;
- aprovação/rejeição;
- bloqueio de acesso direto ao Blob;
- concorrência otimista;
- cancelamento;
- autoaprovação excecional;
- associação de documentos;
- auditoria;
- backup.

## Publicação

O pacote é entregue completo e em dois lotes com menos de 100 ficheiros cada para permitir upload pelo GitHub no browser.
