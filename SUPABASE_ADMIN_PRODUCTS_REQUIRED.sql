-- SEFROU STORE: policies required by admin-products.html
-- This file does not create or alter tables or columns.
-- Run only if the existing `products` Storage bucket is named exactly `products`
-- and `profiles.role = 'admin'` is the current administrator check.

-- Let administrators list, create, edit, and activate/deactivate products.
-- The storefront's existing public SELECT policy must remain in place.
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products"
on public.products
for all to authenticated
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);

-- Let administrators upload and remove product images in the existing bucket.
drop policy if exists "admins manage product images" on storage.objects;
create policy "admins manage product images"
on storage.objects
for all to authenticated
using (
    bucket_id = 'products'
    and exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
)
with check (
    bucket_id = 'products'
    and exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);
