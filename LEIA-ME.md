# VG Dashboard — Shared Storage v2

Data: 14/08/2026

Esta versão parte da **Core v1** e acrescenta a migração dos dados operacionais que ainda estavam apenas no navegador para o armazenamento partilhado já existente em **Netlify Blobs**.

## O que passa a ser partilhado

### Regiões
- Recurso Blob: `settings` + chave `regions`.
- O mapeamento de hotéis por região deixa de depender do computador onde foi alterado.
- Guardar ou repor regiões no Setup publica a alteração para todos.

### Revenue Intelligence — Eventos
- Recurso Blob: `settings` + chave `revenue-events`.
- O mapa manual de eventos deixa de estar apenas no `localStorage`.
- Quando um utilizador guarda os eventos, os restantes recebem a mesma informação na próxima sincronização/carregamento.

### Ficha do Hotel
- Recurso Blob: `hotelsheet` + chave do hotel.
- Cada hotel é guardado num Blob próprio para evitar um ficheiro único demasiado grande e reduzir conflitos entre hotéis.
- Passam a ser partilhados:
  - diretor associado à ficha;
  - comentários por hotel/mês;
  - campos manuais;
  - histórico usado pela ficha e pelos relatórios.
- Os comentários/campos são separados pelo **ano atual**, evitando que Janeiro de 2027 reutilize os valores de Janeiro de 2026.

## Migração automática do localStorage

Na primeira execução desta versão:

1. A dashboard procura as antigas chaves `vg_regioes_custom`, `vg_ri_events` e `vg_hs_*`.
2. Lê primeiro o que já existe no servidor.
3. Dados antigos locais só preenchem campos que ainda não existem no servidor — não substituem informação já partilhada.
4. A dashboard publica os dados migrados nos Blobs.
5. As chaves locais antigas só são apagadas depois de a gravação no servidor ser confirmada.
6. Se um valor local antigo for diferente de um valor que já existe no servidor, o servidor continua a ser a fonte oficial, mas o valor local é preservado para revisão — não é apagado silenciosamente.
7. Todas as Fichas antigas encontradas no browser são migradas automaticamente; não é necessário abrir hotel a hotel.

## Proteção contra edições concorrentes na Ficha do Hotel

Ao guardar uma alteração, a dashboard volta a ler a versão mais recente do Blob desse hotel e aplica apenas os campos alterados localmente antes de publicar. Isto reduz o risco de uma edição num comentário apagar outra alteração feita entretanto noutro campo do mesmo hotel.

Ao abrir novamente uma Ficha, a versão do servidor é atualizada periodicamente (janela de 30 segundos). A sincronização manual geral força também a atualização das regiões e dos eventos de Revenue Intelligence.

## O que continua local de propósito

Preferências pessoais/de interface continuam no navegador, por exemplo:
- tema/aparência;
- seleção de KPIs visíveis;
- último hotel usado em widgets locais;
- caches locais que já têm cópia no servidor (utilizadores, auditoria e alguns snapshots).

Estes itens não são dados operacionais que precisem de ser iguais para todos.

## Segurança

Esta versão **não altera ainda a autenticação**. A função `dashboard-sessao` continua com o modelo de acesso anterior. A fase seguinte deverá tratar autenticação/permissões no servidor e palavras-passe.

## Testes executados

- Sintaxe dos 18 blocos JavaScript do `index.html`: OK.
- Sintaxe de `netlify/functions/dashboard-sessao.js`: OK.
- Migração automática de regiões: OK.
- Migração automática de eventos RI: OK.
- Migração automática de Fichas de vários hotéis: OK.
- Preservação de dados já existentes no servidor: OK.
- Merge de uma edição local com uma alteração mais recente feita por outro utilizador: OK.
- Separação dos comentários da Ficha por ano (2026/2027): OK.

## Publicação

Pode ser publicado no GitHub/Netlify como o projeto anterior. A estrutura continua:

- `index.html`
- `netlify.toml`
- `netlify/functions/dashboard-sessao.js`
- `netlify/functions/package.json`

Não são necessárias novas variáveis de ambiente para esta alteração.
