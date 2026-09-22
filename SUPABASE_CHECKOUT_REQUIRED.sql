-- FUTURE CHECKOUT SECURITY PLAN
-- This file is documentation/template only.
-- It has NOT been executed.
-- Review the real Supabase schema before using it.
-- Do not run this file until table columns, constraints, and RLS are confirmed.

-- Required server-side behavior:
-- 1. Accept authenticated user, product IDs, quantities, customer fields, and payment method.
-- 2. Read current prices and active status from products.
-- 3. Lock or safely validate stock inside one transaction.
-- 4. Calculate subtotal and total server-side.
-- 5. Insert orders and order_items atomically.
-- 6. Decrement stock atomically when a stock column exists.
-- 7. Derive user_id from auth.uid(), never from the browser payload.
-- 8. Generate a unique order number or accept a unique idempotency key.
-- 9. Reject inactive products, invalid quantities, invalid customer data, and duplicate requests.
-- 10. Return only the created order identifier, order number, status, and server-calculated total.

-- Before implementation, confirm:
-- - Exact products stock/price column names.
-- - Exact orders and order_items column names.
-- - Foreign keys and delete behavior.
-- - RLS policies for direct table access.
-- - Whether a client_order_id/idempotency column already exists.
-- - Whether stock is tracked in products or another table.

-- No CREATE FUNCTION statement is intentionally included until the schema is verified.
