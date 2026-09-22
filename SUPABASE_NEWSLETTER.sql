-- SEFROU STORE: newsletter subscribers
-- Run this file in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.newsletter_subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    created_at timestamptz not null default now(),
    constraint newsletter_subscribers_email_not_empty
        check (length(trim(email)) > 0),
    constraint newsletter_subscribers_email_normalized
        check (email = lower(trim(email)))
);

-- Keep the constraints present when the table was created by an earlier deploy.
do $$
begin
    if not exists ( 
        select 1
        from pg_constraint
        where conrelid = 'public.newsletter_subscribers'::regclass
          and conname = 'newsletter_subscribers_email_not_empty'
    ) then
        alter table public.newsletter_subscribers
            add constraint newsletter_subscribers_email_not_empty
            check (length(trim(email)) > 0);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.newsletter_subscribers'::regclass
          and conname = 'newsletter_subscribers_email_normalized'
    ) then
        alter table public.newsletter_subscribers
            add constraint newsletter_subscribers_email_normalized
            check (email = lower(trim(email)));
    end if;
end
$$;

alter table public.newsletter_subscribers enable row level security;

revoke all on table public.newsletter_subscribers from anon, authenticated;
grant insert on table public.newsletter_subscribers to anon, authenticated;
grant select, delete on table public.newsletter_subscribers to authenticated;

drop policy if exists "visitors can subscribe to newsletter" on public.newsletter_subscribers;
drop policy if exists "newsletter visitors can insert" on public.newsletter_subscribers;
drop policy if exists "newsletter admins can read" on public.newsletter_subscribers;
drop policy if exists "newsletter admins can delete" on public.newsletter_subscribers;

create policy "newsletter visitors can insert"
on public.newsletter_subscribers
for insert
to anon, authenticated
with check (
    length(trim(email)) > 0
    and email = lower(trim(email))
);

create policy "newsletter admins can read"
on public.newsletter_subscribers
for select
to authenticated
using (public.is_store_admin());

create policy "newsletter admins can delete"
on public.newsletter_subscribers
for delete
to authenticated
using (public.is_store_admin());
