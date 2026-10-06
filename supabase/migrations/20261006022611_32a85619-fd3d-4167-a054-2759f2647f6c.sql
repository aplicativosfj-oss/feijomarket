-- Categorias gerenciáveis
create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (length(name) between 1 and 80),
  subcategories text[] not null default '{}',
  image_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categorias públicas" on public.categories for select to anon, authenticated using (true);
create policy "Admin cria categorias" on public.categories for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin edita categorias" on public.categories for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin apaga categorias" on public.categories for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger categories_touch_updated_at before update on public.categories for each row execute function public.touch_updated_at();

insert into public.categories (slug, name, subcategories, sort_order) values
('suplementos','Suplementos','{"Whey","Creatina","Vitaminas","Pré-treino","Termogênicos"}',1),
('roupas','Roupas','{"Feminino","Leggings","Moda íntima","Masculino","Fitness"}',2),
('calcados','Calçados','{"Corrida","Treino","Casual"}',3),
('eletronicos','Eletrônicos','{"Fones","Smartwatches","Celulares","Acessórios"}',4),
('casa','Casa','{"Cozinha","Decoração","Organização"}',5),
('beleza-e-saude','Beleza e Saúde','{"Skincare","Cabelo","Bem-estar"}',6),
('esportes','Esportes','{"Musculação","Yoga","Outdoor"}',7),
('papelaria','Papelaria','{"Cadernos","Escrita","Mochilas e estojos","Organização","Kits volta às aulas","Topos de bolo","Encadernação","Impressão online"}',8);

-- Pedidos
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address jsonb not null default '{}'::jsonb,
  delivery_method text not null check (delivery_method in ('entrega','retirada')),
  payment_method text not null check (payment_method in ('pix','card','boleto')),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'pendente' check (status in ('pendente','confirmado','em_preparo','saiu_para_entrega','pronto_para_retirada','entregue','cancelado')),
  delivery_eta date,
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Cliente vê os próprios pedidos" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "Admin vê todos os pedidos" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admin atualiza pedidos" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger orders_touch_updated_at before update on public.orders for each row execute function public.touch_updated_at();

-- Fotos dos produtos (bucket criado separadamente)
create policy "Fotos de produto públicas" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admin envia fotos" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admin troca fotos" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admin apaga fotos" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));