# Supabase Setup Required

## Deployment update

The checkout and newsletter frontend now require `SUPABASE_DEPLOY.sql`.
Run that script in the Supabase SQL Editor once, after confirming the current
schema matches the columns listed at the top of the script. It creates the
secure checkout RPC, the newsletter table, access policies, and the protected
admin status RPC. Do not keep a policy that gives browser users direct
`INSERT`, `UPDATE`, or `DELETE` access to `orders` or `order_items`.

هذا الملف يوثق ما تم تأكيده من المشروع وما يحتاج مراجعة أو إعداداً يدوياً داخل Supabase Dashboard. لم يتم تنفيذ أي SQL من هذا المشروع.

## تم إنجازه بالفعل في Supabase

حسب المعطيات المقدمة:

- `site_banners` table
- `offers` table
- `products` Storage bucket
- `categories` Storage bucket
- `banners` Storage bucket

كما أن المشروع الحالي يعتمد على الجداول التالية:

- `profiles`
- `admin_users`
- `categories`
- `products`
- `product_images`
- `orders`
- `order_items`

## مازال مطلوباً

- RLS Policies للجداول حسب أدوار المستخدمين.
- Storage Policies للـ`products`, `categories`, و`banners`.
- Secure Checkout RPC.
- Stock transaction داخل نفس عملية إنشاء الطلب.
- Price validation server-side.
- Idempotency لمنع تكرار الطلبات.
- Admin permissions والتحقق منها داخل RLS، وليس Frontend فقط.
- Auth configuration وOAuth Redirect URLs حسب مزودي الدخول المستعملين.
- التأكد من أي Columns ناقصة في الجداول الموجودة قبل تنفيذ أي Migration.
- التحقق من أعمدة `categories` و`product_images` الفعلية، لأن المشروع لا يحتوي على Schema dump لها.
- التحقق من أن حقول الصور تخزن public URL أو Storage path متوافقاً مع bucket المناسب.

## ملاحظات Architecture

- المنتجات يتم جلبها من `products`.
- صور المنتجات يتم جلبها من `product_images` عندما تكون العلاقة والحقول متاحة، مع fallback إلى `products.image`.
- Hero يتم جلبه من `site_banners`.
- Offers يتم جلبها من `offers` مع `is_active`, `starts_at`, `ends_at`, و`sort_order`.
- Categories يتم جلبها من `categories` إذا كانت قابلة للقراءة، مع fallback إلى تصنيفات المنتجات الحالية.
- الصور التي ليست URL كاملة يتم تحويلها إلى public URL باستعمال bucket المناسب.

## قبل أي Migration

يجب أخذ Schema حقيقي من Supabase Dashboard أو SQL Editor، خصوصاً لـ:

- `categories`
- `product_images`
- `orders`
- `order_items`
- `profiles`

لا تضف Columns جديدة اعتماداً على هذا الملف وحده.
