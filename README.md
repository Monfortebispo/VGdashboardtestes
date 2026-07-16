# VG Guest Experience — Análise Semestral v2

Aplicação preparada para GitHub e Netlify, com dados partilhados entre todos os utilizadores.

## O que está implementado

- Consulta pública dos resultados por semestre, região e unidade.
- Área **Dados e Configuração** protegida por senha.
- Senha validada numa Netlify Function, com limite de tentativas por endereço IP; não fica exposta no HTML ou no GitHub.
- Semestres guardados na **Netlify Database (Postgres)** em formato JSON comprimido.
- Regiões guardadas centralmente.
- Atualizações feitas por um administrador ficam disponíveis para todos.
- Migrações automáticas da base de dados incluídas no repositório.
- Ligação contínua GitHub → Netlify.
- Diagnóstico integrado por unidade, com comparação à região, objetivo, compset, departamentos e respostas.
- Identificação automática dos principais pontos fortes e focos de reclamação a partir das menções detalhadas.
- Seleção de comentários positivos e negativos representativos por unidade.
- Painéis de maiores subidas e maiores descidas do GRI.
- Modo claro e modo escuro, guardado no navegador de cada utilizador.


## Estrutura principal do projeto

O ficheiro público principal está em:

```text
public/index.html
```

Não deve ser movido para a raiz. O `netlify.toml` já está configurado para publicar a pasta `public`.

## Publicar no GitHub

1. Crie um repositório **privado** no GitHub.
2. Coloque na raiz do repositório todos os ficheiros desta pasta.
3. Faça commit e push para a branch principal.

Também pode usar o botão **Add file > Upload files** no GitHub e carregar o conteúdo da pasta, mantendo a estrutura das subpastas.

## Ligar ao Netlify

1. No Netlify, selecione **Add new project > Import an existing project**.
2. Escolha GitHub e selecione o repositório.
3. O Netlify deteta o ficheiro `netlify.toml`:
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. Confirme o deploy.

A pasta `netlify/database/migrations` contém a criação automática das tabelas. A Netlify Database será provisionada e a migração aplicada no deploy. Esta funcionalidade requer um plano Netlify baseado em créditos.

## Variáveis obrigatórias no Netlify

Em **Project configuration > Environment variables**, crie:

- `ADMIN_PASSWORD` = `140605`
- `SESSION_SECRET` = uma sequência aleatória longa, com pelo menos 32 caracteres

A `SESSION_SECRET` não deve ser igual à senha e nunca deve ser colocada no GitHub.

Depois de criar ou alterar as variáveis, faça **Trigger deploy > Deploy site**.

## Primeira utilização

1. Abra o endereço público do site.
2. Entre em **Dados e Configuração**.
3. Introduza a senha `140605`.
4. Clique em **Publicar semestre atual** para gravar os dados já incorporados na base partilhada.

Este passo é feito apenas uma vez. A partir daí, o semestre fica centralizado.

## Atualização semestral

1. Abra **Dados e Configuração** e introduza a senha.
2. Selecione ou arraste os seis ficheiros Excel do novo semestre.
3. A aplicação identifica cada relatório, junta os dados e grava o semestre na base partilhada.
4. Todos os diretores passam a ver os novos dados ao atualizar a página.

## Desenvolvimento local opcional

Requer Node.js 22 ou superior:

```bash
npm install
netlify dev
```

Para testar localmente, crie um ficheiro `.env` baseado em `.env.example`. O ficheiro `.env` está excluído do GitHub.

## Segurança

A senha protege carregamentos, eliminações, backups e configuração. A consulta dos resultados permanece pública para quem tiver o endereço do site.

Para restringir também a consulta de toda a aplicação, será necessário ativar proteção de acesso ao site no Netlify ou implementar contas individuais.
