# إعداد إدارة المنتجات في Supabase

لوحة `admin-products.html` تستعمل البنية الموجودة فقط ولا تنشئ أي جدول أو عمود.

## ما يجب توفره

1. جدول `products` يحتوي الحقول المستعملة حاليًا في المتجر: `name`, `price`,
   `old_price`, `description`, `image`, `category_id`, `stock`, `rating`,
   `badge`, و`is_active`.
2. جدول `categories` يحتوي على `id` و`name` على الأقل.
3. Storage bucket موجود اسمه `products` ومضبوط على **Public**، لأن واجهة الزبون
   تحول مسار الصورة إلى Public URL.
4. حساب المدير له سجل في `profiles` وقيمة `role` فيه هي `admin`.

## الصلاحيات المطلوبة

راجع ثم شغّل محتوى `SUPABASE_ADMIN_PRODUCTS_REQUIRED.sql` في Supabase SQL Editor.
هذا يضيف سياسة للمدير على المنتجات وسياسة رفع/تعديل الصور في bucket `products`.
لا يشغّل أي SQL تلقائيًا من الموقع.

## نقل الصور الموجودة إلى Supabase

1. من Supabase Dashboard افتح **Storage > products**.
2. ارفع كل صور المنتجات إلى مجلد مثل `product-images/existing/`.
3. انسخ **Path** لكل صورة، وليس Public URL.
4. حدّث قيمة `products.image` للمنتج بمسارها، مثال:
   `product-images/existing/product-1.webp`

`assets/js/products.js` سيحوّل هذا المسار تلقائيًا إلى رابط صورة Supabase عام.
المنتجات الجديدة من لوحة الإدارة تقوم بهذه الخطوة تلقائيًا عند رفع الصورة.
