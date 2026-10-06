create type public.app_role as enum ('admin', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index user_roles_user_id_idx on public.user_roles (user_id);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "Usuário vê o próprio papel" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Atribui papéis ao usuário logado: todo usuário vira cliente;
-- o e-mail do dono (confirmado) vira admin. Chamado pelo app após o login.
create or replace function public.claim_roles()
returns void language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _email text;
  _confirmed timestamptz;
begin
  if _uid is null then return; end if;
  insert into public.user_roles (user_id, role) values (_uid, 'customer')
    on conflict (user_id, role) do nothing;
  select email, email_confirmed_at into _email, _confirmed from auth.users where id = _uid;
  if lower(_email) = 'francdenisbr@gmail.com' and _confirmed is not null then
    insert into public.user_roles (user_id, role) values (_uid, 'admin')
      on conflict (user_id, role) do nothing;
  end if;
end $$;

revoke execute on function public.claim_roles() from public, anon;
grant execute on function public.claim_roles() to authenticated;

create table public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  brand text not null,
  category text not null,
  subcategory text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  image_url text not null default '',
  variants jsonb not null default '[]'::jsonb,
  colors text[],
  sizes text[],
  specs jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  source text not null default 'own',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category);

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;

create policy "Catálogo público para leitura" on public.products
  for select to anon, authenticated using (true);
create policy "Só admin insere produtos" on public.products
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Só admin edita produtos" on public.products
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Só admin apaga produtos" on public.products
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger products_touch_updated_at before update on public.products
  for each row execute function public.touch_updated_at();