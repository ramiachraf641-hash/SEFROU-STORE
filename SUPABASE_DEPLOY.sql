-- SEFROU STORE: secure checkout, order access, admin status updates, newsletter
-- Run this once in Supabase SQL Editor after taking a database backup.
-- This script expects the columns currently used by the frontend: products.price,
-- products.stock, products.image, products.is_active, orders.*, and order_items.*.

create extension if not exists pgcrypto;

-- The current frontend uses profiles.role to identify administrators.
-- Existing profiles become customers by default; promote admins explicitly below.
alter table public.profiles
    add column if not exists role text not null default 'customer'
    check (role in ('customer', 'admin'));

alter table public.orders
    add column if not exists client_order_id uuid;

create unique index if not exists orders_user_client_order_id_key
    on public.orders (user_id, client_order_id)
    where client_order_id is not null;

create table if not exists public.newsletter_subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null unique check (email = lower(trim(email))),
    created_at timestamptz not null default now()
);

-- The browser never receives direct insert/update/delete access to orders.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.categories enable row level security;

revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke update, delete on public.newsletter_subscribers from anon, authenticated;
grant select on public.categories to anon, authenticated;

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
$$;

create or replace function public.create_checkout_order(
    p_items jsonb,
    p_customer_name text,
    p_customer_phone text,
    p_customer_email text,
    p_customer_city text,
    p_customer_address text,
    p_payment_method text,
    p_client_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item jsonb;
    v_product public.products%rowtype;
    v_order public.orders%rowtype;
    v_quantity integer;
    v_total numeric(12,2) := 0;
    v_order_number text;
begin
    if auth.uid() is null then
        raise exception 'Authentication is required';
    end if;

    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'The cart is empty';
    end if;

    if p_client_order_id is null then
        raise exception 'Missing idempotency key';
    end if;

    if coalesce(length(trim(p_customer_name)), 0) < 2
       or coalesce(length(trim(p_customer_phone)), 0) < 6
       or coalesce(length(trim(p_customer_city)), 0) < 2
       or coalesce(length(trim(p_customer_address)), 0) < 5 then
        raise exception 'Invalid customer details';
    end if;

    if p_payment_method <> 'cash' then
        raise exception 'Unsupported payment method';
    end if;

    select * into v_order
    from public.orders
    where user_id = auth.uid() and client_order_id = p_client_order_id;

    if found then
        return jsonb_build_object(
            'id', v_order.id,
            'order_number', v_order.order_number,
            'total', v_order.total,
            'status', v_order.status,
            'created_at', v_order.created_at
        );
    end if;

    -- Lock every requested product, use its database price, then deduct stock.
    for v_item in
        select jsonb_build_object('product_id', product_id, 'quantity', sum(quantity))
        from jsonb_to_recordset(p_items) as requested(product_id bigint, quantity integer)
        group by product_id
    loop
        v_quantity := nullif(v_item ->> 'quantity', '')::integer;
        if v_quantity is null or v_quantity < 1 then
            raise exception 'Invalid quantity';
        end if;

        select * into v_product
        from public.products
        where id = (v_item ->> 'product_id')::bigint and is_active = true
        for update;

        if not found then
            raise exception 'Product is unavailable';
        end if;

        if v_product.stock is not null and v_product.stock < v_quantity then
            raise exception 'Insufficient stock for product %', v_product.id;
        end if;

        v_total := v_total + (v_product.price * v_quantity);
    end loop;

    v_order_number := 'SF-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS')
        || '-' || upper(substr(replace(p_client_order_id::text, '-', ''), 1, 6));

    insert into public.orders (
        user_id, client_order_id, order_number,
        customer_name, customer_phone, customer_email,
        customer_city, customer_address, payment_method, status, total
    ) values (
        auth.uid(), p_client_order_id, v_order_number,
        trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_email), ''),
        trim(p_customer_city), trim(p_customer_address), 'cash', 'pending', round(v_total, 2)
    ) returning * into v_order;

    for v_item in
        select jsonb_build_object('product_id', product_id, 'quantity', sum(quantity))
        from jsonb_to_recordset(p_items) as requested(product_id bigint, quantity integer)
        group by product_id
    loop
        v_quantity := (v_item ->> 'quantity')::integer;
        select * into v_product
        from public.products
        where id = (v_item ->> 'product_id')::bigint
        for update;

        insert into public.order_items (
            order_id, product_id, product_name, product_image, price, quantity, subtotal
        ) values (
            v_order.id, v_product.id, v_product.name, v_product.image,
            v_product.price, v_quantity, round(v_product.price * v_quantity, 2)
        );

        if v_product.stock is not null then
            update public.products
            set stock = stock - v_quantity
            where id = v_product.id;
        end if;
    end loop;

    return jsonb_build_object(
        'id', v_order.id,
        'order_number', v_order.order_number,
        'total', v_order.total,
        'status', v_order.status,
        'created_at', v_order.created_at
    );
end;
$$;

create or replace function public.admin_update_order_status(
    p_order_id text,
    p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_store_admin() then
        raise exception 'Administrator access is required';
    end if;

    if p_status not in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') then
        raise exception 'Invalid order status';
    end if;

    update public.orders
    set status = p_status
    where id::text = p_order_id;

    if not found then
        raise exception 'Order not found';
    end if;
end;
$$;

grant execute on function public.create_checkout_order(jsonb, text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.admin_update_order_status(text, text) to authenticated;

drop policy if exists "customers can read their orders" on public.orders;
create policy "customers can read their orders"
on public.orders for select to authenticated
using (user_id = auth.uid() or public.is_store_admin());

drop policy if exists "customers can read their order items" on public.order_items;
create policy "customers can read their order items"
on public.order_items for select to authenticated
using (
    exists (
        select 1 from public.orders
        where orders.id = order_items.order_id
          and (orders.user_id = auth.uid() or public.is_store_admin())
    )
);

drop policy if exists "visitors can subscribe to newsletter" on public.newsletter_subscribers;
create policy "visitors can subscribe to newsletter"
on public.newsletter_subscribers for insert to anon, authenticated
with check (email = lower(trim(email)));

drop policy if exists "visitors can read categories" on public.categories;
create policy "visitors can read categories"
on public.categories for select to anon, authenticated
using (true);

-- Do not create an UPDATE or DELETE policy for orders/order_items/newsletter.
-- After running this script, promote your own account with:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
