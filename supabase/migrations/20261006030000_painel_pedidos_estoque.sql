-- Bucket público das fotos de produto (as policies de storage.objects já existem).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Registra o pedido e baixa o estoque na mesma transação.
-- Só o servidor (service_role) chama; preços já vêm calculados do banco por createOrder.
-- Se algum item não tiver estoque, nada é gravado.
create or replace function public.place_order(_order jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _item jsonb;
  _qty integer;
begin
  for _item in select * from jsonb_array_elements(_order -> 'items') loop
    _qty := (_item ->> 'qty')::integer;
    update public.products
      set stock = stock - _qty
      where id = _item ->> 'productId' and stock >= _qty;
    if not found then
      raise exception 'Estoque insuficiente para %.', _item ->> 'name' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.orders (
    code, user_id, customer_name, customer_email, customer_phone, address,
    delivery_method, payment_method, items, subtotal, discount, shipping, total
  ) values (
    _order ->> 'code',
    nullif(_order ->> 'user_id', '')::uuid,
    _order ->> 'customer_name',
    _order ->> 'customer_email',
    _order ->> 'customer_phone',
    coalesce(_order -> 'address', '{}'::jsonb),
    _order ->> 'delivery_method',
    _order ->> 'payment_method',
    _order -> 'items',
    (_order ->> 'subtotal')::numeric,
    (_order ->> 'discount')::numeric,
    (_order ->> 'shipping')::numeric,
    (_order ->> 'total')::numeric
  );
  return _order ->> 'code';
end $$;

revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

-- Pedido cancelado devolve os itens ao estoque; se for reaberto, baixa de novo.
create or replace function public.orders_restock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _item jsonb;
  _sign integer;
begin
  if new.status = old.status then return new; end if;
  if new.status = 'cancelado' then _sign := 1;
  elsif old.status = 'cancelado' then _sign := -1;
  else return new;
  end if;
  for _item in select * from jsonb_array_elements(new.items) loop
    update public.products
      set stock = greatest(0, stock + _sign * (_item ->> 'qty')::integer)
      where id = _item ->> 'productId';
  end loop;
  return new;
end $$;

revoke execute on function public.orders_restock() from public, anon, authenticated;

create trigger orders_restock after update of status on public.orders
  for each row execute function public.orders_restock();
