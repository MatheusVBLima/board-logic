# Setup — Board Lógica

Este guia configura uma cópia do Board Lógica com **seu próprio projeto Supabase**.
Você precisa do código do aplicativo, do Bun instalado e de uma conta em
[supabase.com](https://supabase.com). Não é necessário instalar a CLI do Supabase.

Sem Supabase o simulador, o guia e os desafios funcionam normalmente; só o login
e a página de projetos salvos ficam desativados.

## 1. Crie o projeto Supabase

No painel do Supabase, clique em **New project**, escolha a organização, defina
o nome, a senha do banco e a região e aguarde o projeto ficar disponível.

Anote a **Project URL** (em **Connect** ou **Settings > Data API**) e a
**Publishable key** (em **Settings > API Keys**, começa com `sb_publishable_`).
Use os dados do projeto que você acabou de criar.

A aplicação precisa apenas da URL e dessa chave pública. Não coloque a senha
do banco, uma chave `service_role` ou uma chave `sb_secret_...` nas variáveis
`NEXT_PUBLIC_`, pois elas são enviadas ao navegador.

## 2. Crie as tabelas e as regras de acesso

Abra **SQL Editor > New query** no seu projeto Supabase. Copie **todo** o bloco
abaixo e clique em **Run**, usando o papel padrão `postgres` do SQL Editor.

O SQL reproduz a estrutura usada pela aplicação
(`supabase/migrations/20261016000000_projects.sql`):

- Tabela `public.projects`, com nome, circuito em JSON e datas de criação/edição.
- Índice para listar os projetos de cada usuário por edição mais recente.
- Row Level Security (RLS): cada usuário acessa somente os próprios projetos.
- Limite de 10 projetos por usuário e atualização automática de `updated_at`.
- Permissões para o aplicativo acessar a tabela pela API do Supabase.

O Supabase já cria e gerencia `auth.users` e as demais tabelas internas de
autenticação. Elas não devem ser criadas manualmente. A aplicação não precisa
de buckets de Storage, Edge Functions nem tabelas para guia ou desafios:
esses conteúdos fazem parte do código.

Execute em um projeto novo ou em uma cópia com esta mesma estrutura. O bloco
pode ser executado novamente nesse cenário: preserva os projetos salvos e
recria as políticas e os gatilhos nomeados abaixo. Ele não substitui migrações
para um banco que tenha uma estrutura diferente.

```sql
begin;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  circuit jsonb not null check (
    jsonb_typeof(circuit) = 'object'
    and pg_column_size(circuit) < 1000000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);

alter table public.projects enable row level security;

-- Apenas usuarios autenticados recebem acesso; as politicas abaixo
-- restringem esse acesso aos projetos do proprio usuario.
grant usage on schema public to authenticated;
revoke all on table public.projects from public, anon, authenticated;
grant select, insert, update, delete on table public.projects
  to authenticated;

drop policy if exists "Users read their projects" on public.projects;
create policy "Users read their projects" on public.projects
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their projects" on public.projects;
create policy "Users create their projects" on public.projects
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their projects" on public.projects;
create policy "Users update their projects" on public.projects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their projects" on public.projects;
create policy "Users delete their projects" on public.projects
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- O lock serializa insercoes do mesmo usuario, inclusive em abas distintas.
-- SECURITY DEFINER permite contar os projetos no gatilho; a funcao
-- tem search_path fixo e sua execucao direta pela API e revogada abaixo.
create or replace function public.enforce_project_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if (select count(*) from public.projects where user_id = new.user_id) >= 10 then
    raise exception 'project_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_limit on public.projects;
create trigger projects_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();

-- Atualiza updated_at a cada edicao do projeto.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- A funcao do limite so deve rodar como gatilho, nunca por /rest/v1/rpc.
revoke execute on function public.enforce_project_limit()
  from public, anon, authenticated;

commit;
```

Para conferir, rode em outra query:

```sql
select tablename, rowsecurity from pg_tables where tablename = 'projects';
select policyname, cmd from pg_policies where tablename = 'projects';
```

O resultado deve mostrar `rowsecurity = true` e quatro políticas
(`SELECT`, `INSERT`, `UPDATE` e `DELETE`).

## 3. Configure o login

O login usa e-mail e senha. Os links enviados por e-mail (confirmação de conta e
redefinição de senha) voltam para a rota `/auth/callback` do aplicativo, que
precisa estar liberada no Supabase.

Em **Authentication > URL Configuration**:

- **Site URL:** `http://localhost:3000` para rodar localmente, ou o domínio do
  deploy (por exemplo `https://seu-app.vercel.app`).
- **Redirect URLs:** adicione `http://localhost:3000/**` e, se houver deploy,
  `https://seu-app.vercel.app/**`. O curinga é necessário porque o link chega
  como `/auth/callback?next=...`.

Em **Authentication > Sign In / Providers > Email**, deixe o provedor de e-mail
ativado. Com **Confirm email** ativado (padrão), a conta só entra depois de
clicar no link recebido. O serviço de e-mail padrão do Supabase envia poucas
mensagens por hora; para testar rápido, você pode desativar **Confirm email**
e entrar logo após criar a conta.

Opcional: os modelos de e-mail com o visual do Board Lógica (em português e
inglês) estão em [`supabase/templates`](supabase/templates/README.md). Cole cada
arquivo em **Authentication > Emails > Templates** com o assunto indicado lá.
Sem eles o Supabase usa os e-mails padrão, e o login funciona do mesmo jeito.

## 4. Preencha as variáveis de ambiente

Na pasta do projeto, copie o exemplo:

```bash
cp .env.example .env.local
```

Edite `.env.local` com a Project URL e a Publishable key anotadas no passo 1:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Projetos que só têm a chave legada podem usar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
no lugar da publishable. Se as duas estiverem definidas, a `ANON_KEY` tem
prioridade. O arquivo `.env.local` é ignorado pelo Git e não deve ser enviado.

No deploy (Vercel, por exemplo), defina as mesmas variáveis no painel do projeto.

## 5. Rode o aplicativo

```bash
bun install
bun dev        # http://localhost:3000
```

Abra `http://localhost:3000/pt/login`, crie uma conta e confirme o e-mail (se
**Confirm email** estiver ativado). Depois monte um circuito no board e clique em
**Salvar**; ele aparece em **Meus projetos** (`/pt/projects`) e também em
**Table Editor > projects** no painel do Supabase.

Se o login não aparecer, confira se `.env.local` está na raiz do projeto e
reinicie o `bun dev`: as variáveis `NEXT_PUBLIC_` são lidas na inicialização.
