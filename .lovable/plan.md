

O usuário quer migrar o backend deste projeto do **Lovable Cloud atual** (`mfickczwrzsarfkoosoh`) para um **projeto Supabase externo** (`suzgbmmifiefaxepnief`) que ele conectou via Connectors.

## Situação atual

- **Backend ativo:** Lovable Cloud → `mfickczwrzsarfkoosoh.supabase.co`
- **Backend desejado:** Supabase externo → `suzgbmmifiefaxepnief.supabase.co`
- Todas as tabelas, RLS, edge functions (`fetch-meta-insights`, `meta-oauth-callback`, `planner-chat`, etc.), secrets (META_APP_ID, META_APP_SECRET) e o bucket `produtos` estão no Cloud atual — **NÃO no projeto externo**.

## Problema crítico

Este projeto Lovable está **nativamente vinculado ao Lovable Cloud**. Os arquivos `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts` e `.env` são **auto-gerenciados** pelo Lovable Cloud e regenerados automaticamente apontando para `mfickczwrzsarfkoosoh`. Qualquer edição manual será sobrescrita.

Não é possível "trocar" o backend de um projeto Cloud para um Supabase externo de dentro do código. O Lovable Cloud, uma vez ativado, não pode ser desconectado deste projeto (conforme documentação oficial).

## Caminhos possíveis

**Opção A — Manter Lovable Cloud (recomendado)**
Continuar usando o backend atual (`mfickczwrzsarfkoosoh`). Toda a estrutura (tabelas, RLS, edge functions, secrets, storage) já existe e funciona. O bug de login que estávamos corrigindo é independente do backend.

**Opção B — Migrar para o Supabase externo `suzgbmmifiefaxepnief`**
Requer um processo manual extenso fora do escopo de "ligar"automaticamente:
1. Você exporta o schema/dados do Cloud atual e importa no projeto externo via Supabase CLI
2. Recria todas as tabelas, RLS policies, triggers e a function `update_updated_at_column`
3. Recria o bucket `produtos` e migra os arquivos
4. Reimplanta as edge functions (`fetch-meta-adaccounts`, `fetch-meta-insights`, `meta-app-config`, `meta-oauth-callback`, `planner-chat`) no projeto externo
5. Reconfigura os secrets `META_APP_ID`, `META_APP_SECRET` no projeto externo
6. **Cria um novo projeto Lovable do zero** conectado ao Supabase externo (não é possível trocar o backend deste projeto)

**Opção C — Connector como complemento**
Se você conectou o projeto externo via **Connectors**, ele pode ser usado em paralelo (ex: para chamar APIs específicas via edge functions do projeto externo), mas **não substitui** o cliente Supabase principal do app.

## Sobre o bug de login

Independentemente da escolha de backend, o login continua quebrado por causa da race condition entre `signIn` e `navigate`. Esse fix já foi aplicado nas mensagens anteriores e funciona com o backend atual (`mfickczwrzsarfkoosoh`).

## Pergunta para você

Antes de prosseguir, preciso entender o objetivo real:

1. Você quer **manter** o app atual e só corrigir o login? (Backend Cloud continua, fix de login funciona)
2. Você quer **migrar** para o Supabase externo porque precisa de algo específico que o Cloud não oferece? (Processo manual longo, novo projeto Lovable)
3. Você conectou o externo via Connectors esperando que ele **substituísse** automaticamente o Cloud? (Isso não acontece — Connectors expõem credenciais para edge functions, não trocam o backend)

Me diga qual cenário se aplica e eu sigo com o plano detalhado para o caminho escolhido.

