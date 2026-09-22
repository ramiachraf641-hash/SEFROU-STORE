// =====================================================
//              SEFROU STORE - ADMIN PRODUCTS
// =====================================================

let adminProducts = [];
let adminCategories = [];
let adminProductImages = [];
let selectedAdditionalImages = [];
let adminProductSaveInProgress = false;

document.addEventListener("DOMContentLoaded", () => {
    initializeAdminProducts();
});


async function initializeAdminProducts() {

    if (!window.supabaseClient) {
        showAdminProductsAccessDenied("تعذر الاتصال بـ Supabase.");
        return;
    }

    try {

        const {
            data: userData,
            error: userError
        } = await window.supabaseClient.auth.getUser();

        if (userError || !userData?.user) {
            showAdminProductsAccessDenied("المرجو تسجيل الدخول أولًا.");
            return;
        }

        const {
            data: profile,
            error: profileError
        } = await window.supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", userData.user.id)
            .maybeSingle();

        if (profileError || profile?.role !== "admin") {
            showAdminProductsAccessDenied("ليس لديك صلاحية إدارة المنتجات.");
            return;
        }

        setupAdminProductForm();
        setupAdminProductsListActions();
        setupAdminProductsSearch();
        setupAdminProductsFilter();
        setupAdminProductsRefresh();

        await loadAdminCategories();
        await loadAdminProductImages();
        await loadAdminProducts();

    } catch (error) {

        console.error("ADMIN PRODUCTS: Initialization error:", error);
        showAdminProductsAccessDenied("وقع مشكل أثناء فتح لوحة المنتجات.");

    }

}


async function loadAdminCategories() {

    const categorySelect = document.getElementById("adminProductCategory");

    try {

        const { data, error } = await window.supabaseClient
            .from("categories")
            .select("*")
            .order("id", { ascending: true });

        if (error) throw error;

        adminCategories = (Array.isArray(data) ? data : [])
            .map(category => ({
                id: category?.id,
                name: category?.name || category?.title || category?.slug || ""
            }))
            .filter(category => category.id !== null && category.id !== undefined && category.name);

        if (!categorySelect) return;

        categorySelect.innerHTML = `
            <option value="">اختر التصنيف</option>
            ${adminCategories.map(category => `
                <option value="${escapeAdminProductHTML(category.id)}">
                    ${escapeAdminProductHTML(category.name)}
                </option>
            `).join("")}
        `;

    } catch (error) {

        console.error("ADMIN PRODUCTS: Categories load error:", error);

        if (categorySelect) {
            categorySelect.innerHTML = "<option value=\"\">تعذر تحميل التصنيفات</option>";
            categorySelect.disabled = true;
        }

        showAdminProductMessage("تعذر تحميل التصنيفات. تأكد من صلاحيات جدول categories.", "error");

    }

}


async function loadAdminProducts() {

    const list = document.getElementById("adminProductsList");

    if (!list) return false;

    list.innerHTML = `
        <div class="admin-products-loading" role="status">
            <i class="fa-solid fa-spinner fa-spin"></i>
            جاري تحميل المنتجات...
        </div>
    `;

    try {

        const { data, error } = await window.supabaseClient
            .from("products")
            .select("*")
            .order("id", { ascending: false });

        if (error) throw error;

        adminProducts = Array.isArray(data) ? data : [];
        renderAdminProducts();
        return true;

    } catch (error) {

        console.error("ADMIN PRODUCTS: Products load error:", error);
        list.innerHTML = `
            <div class="admin-products-empty">
                <i class="fa-solid fa-circle-exclamation"></i>
                تعذر تحميل المنتجات. تأكد من صلاحيات المدير على جدول products.
            </div>
        `;
        return false;

    }

}


async function loadAdminProductImages() {

    try {

        const { data, error } = await window.supabaseClient
            .from("product_images")
            .select("id, product_id, image_url, sort_order, is_active")
            .order("sort_order", { ascending: true });

        if (error) throw error;

        adminProductImages = Array.isArray(data) ? data : [];
        return true;

    } catch (error) {

        console.error("ADMIN PRODUCTS: Gallery images load error:", error);
        adminProductImages = [];
        showAdminProductMessage("تعذر تحميل الصور الإضافية للمنتجات.", "error");
        return false;

    }

}


function renderAdminProducts() {

    const list = document.getElementById("adminProductsList");
    const search = String(document.getElementById("adminProductsSearch")?.value || "").trim().toLowerCase();
    const visibilityFilter = String(document.getElementById("adminProductsFilter")?.value || "all");

    if (!list) return;

    const filteredProducts = adminProducts.filter(product => {
        const categoryName = getAdminCategoryName(product?.category_id, product?.category);
        const text = [product?.name, categoryName, product?.description]
            .map(value => String(value || "").toLowerCase())
            .join(" ");

        const matchesSearch = !search || text.includes(search);
        const isActive = product?.is_active === true;
        const matchesVisibility = visibilityFilter === "all" ||
            (visibilityFilter === "active" && isActive) ||
            (visibilityFilter === "inactive" && !isActive);

        return matchesSearch && matchesVisibility;
    });

    updateAdminProductsStats();

    if (filteredProducts.length === 0) {
        list.innerHTML = `
            <div class="admin-products-empty">
                <i class="fa-solid fa-box-open"></i>
                ${adminProducts.length === 0 ? "لا توجد منتجات مضافة حاليًا." : "لا توجد منتجات مطابقة للبحث."}
            </div>
        `;
        return;
    }

    list.innerHTML = filteredProducts.map(product => {

        const image = resolveAdminProductImage(product?.image);
        const categoryName = getAdminCategoryName(product?.category_id, product?.category) || "بدون تصنيف";
        const isActive = product?.is_active === true;
        const price = Number(product?.price) || 0;
        const stock = product?.stock === null || product?.stock === undefined || product?.stock === ""
            ? "غير محدد"
            : Number(product.stock);

        return `
            <article class="admin-product-card" data-product-id="${escapeAdminProductHTML(product?.id || "")}">
                <div class="admin-product-card-image">
                    ${
                        image
                            ? `<img src="${escapeAdminProductHTML(image)}" alt="${escapeAdminProductHTML(product?.name || "منتج")}" loading="lazy">`
                            : '<i class="fa-solid fa-image"></i>'
                    }
                </div>
                <div>
                    <h3>${escapeAdminProductHTML(product?.name || "منتج")}</h3>
                    <p>${escapeAdminProductHTML(categoryName)}</p>
                    <div class="admin-product-meta">
                        <span>${price.toFixed(2)} DH</span>
                        <span>المخزون: ${escapeAdminProductHTML(stock)}</span>
                        <span class="${isActive ? "" : "inactive"}">${isActive ? "ظاهر" : "مخفي"}</span>
                    </div>
                </div>
                <div class="admin-product-card-actions">
                    <button type="button" class="admin-product-edit" data-edit-product="${escapeAdminProductHTML(product?.id || "")}"><i class="fa-solid fa-pen"></i> تعديل</button>
                    <button type="button" class="admin-product-toggle ${isActive ? "deactivate" : ""}" data-toggle-product="${escapeAdminProductHTML(product?.id || "")}">${isActive ? "إخفاء المنتج" : "إظهار المنتج"}</button>
                </div>
            </article>
        `;
    }).join("");

}


function setupAdminProductForm() {

    const form = document.getElementById("adminProductForm");
    const imageInput = document.getElementById("adminProductImage");
    const additionalImagesInput = document.getElementById("adminProductAdditionalImages");
    const newProductButton = document.getElementById("adminProductNew");

    if (!form) return;

    imageInput?.addEventListener("change", previewAdminProductImage);
    additionalImagesInput?.addEventListener("change", addSelectedAdditionalImages);
    newProductButton?.addEventListener("click", resetAdminProductForm);

    document.getElementById("adminProductSelectedGallery")?.addEventListener("click", event => {
        const removeButton = event.target.closest("[data-remove-selected-image]");
        if (!removeButton) return;

        removeSelectedAdditionalImage(Number(removeButton.dataset.removeSelectedImage));
    });

    document.getElementById("adminProductExistingGallery")?.addEventListener("click", async event => {
        const removeButton = event.target.closest("[data-remove-existing-image]");
        if (!removeButton) return;

        await removeExistingAdditionalImage(removeButton.dataset.removeExistingImage);
    });

    renderSelectedAdditionalImages();
    renderExistingAdditionalImages();

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (adminProductSaveInProgress) return;

        const productId = document.getElementById("adminProductId")?.value.trim();
        const categoryId = document.getElementById("adminProductCategory")?.value;
        const name = document.getElementById("adminProductName")?.value.trim();
        const price = Number(document.getElementById("adminProductPrice")?.value);
        const stock = Number(document.getElementById("adminProductStock")?.value);
        const oldPriceValue = document.getElementById("adminProductOldPrice")?.value;
        const selectedImage = imageInput?.files?.[0];

        if (!name || !categoryId || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
            showAdminProductMessage("المرجو إدخال اسم المنتج والتصنيف والسعر والمخزون بشكل صحيح.", "error");
            return;
        }

        if (!productId && !selectedImage) {
            showAdminProductMessage("المرجو اختيار صورة للمنتج الجديد.", "error");
            return;
        }

        if (oldPriceValue && Number(oldPriceValue) < price) {
            showAdminProductMessage("السعر السابق يجب أن يكون مساويًا للسعر الحالي أو أكبر منه.", "error");
            return;
        }

        const productData = {
            name,
            category_id: categoryId,
            price,
            old_price: oldPriceValue ? Number(oldPriceValue) : price,
            stock,
            description: document.getElementById("adminProductDescription")?.value.trim() || "",
            rating: Number(document.getElementById("adminProductRating")?.value) || 0,
            is_active: Boolean(document.getElementById("adminProductActive")?.checked)
        };

        const submitButton = document.getElementById("adminProductSubmit");
        const originalContent = submitButton?.innerHTML;
        let uploadedImagePath = "";
        let productWasSaved = false;

        adminProductSaveInProgress = true;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
        }

        try {

            if (selectedImage) {
                uploadedImagePath = await uploadAdminProductImage(selectedImage);
                productData.image = uploadedImagePath;
            }

            const query = productId
                ? window.supabaseClient
                    .from("products")
                    .update(productData)
                    .eq("id", productId)
                    .select("id")
                    .single()
                : window.supabaseClient
                    .from("products")
                    .insert(productData)
                    .select("id")
                    .single();

            const { data: savedProduct, error } = await query;

            if (error) throw error;

            productWasSaved = true;

            const savedProductId = savedProduct?.id || productId;

            if (!savedProductId) {
                throw new Error("تعذر تحديد المنتج المحفوظ لإضافة صوره.");
            }

            try {
                await saveAdditionalProductImages(savedProductId);
            } catch (galleryError) {
                console.error("ADMIN PRODUCTS: Gallery save error:", galleryError);

                await Promise.all([
                    loadAdminProducts(),
                    loadAdminProductImages()
                ]);

                const saved = findAdminProduct(savedProductId);
                if (saved) populateAdminProductForm(saved);

                showAdminProductMessage(
                    "تم حفظ المنتج والصورة الرئيسية، لكن تعذر حفظ الصور الإضافية. أعد اختيار الصور ثم احفظ التعديلات.",
                    "error"
                );
                return;
            }

            resetAdminProductForm();
            showAdminProductMessage(productId ? "تم تعديل المنتج بنجاح." : "تمت إضافة المنتج بنجاح.", "success");
            await Promise.all([
                loadAdminProducts(),
                loadAdminProductImages()
            ]);

        } catch (error) {

            console.error("ADMIN PRODUCTS: Save error:", error);

            if (uploadedImagePath && !productId && !productWasSaved) {
                await window.supabaseClient.storage.from("products").remove([uploadedImagePath]);
            }

            showAdminProductMessage(error?.message || "تعذر حفظ المنتج. تأكد من صلاحيات المنتجات وStorage.", "error");

        } finally {

            adminProductSaveInProgress = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent;
            }

        }

    });

}


function setupAdminProductsListActions() {

    const list = document.getElementById("adminProductsList");

    if (!list) return;

    list.addEventListener("click", async event => {

        const editButton = event.target.closest("[data-edit-product]");
        const toggleButton = event.target.closest("[data-toggle-product]");

        if (editButton) {
            const product = findAdminProduct(editButton.dataset.editProduct);
            if (product) populateAdminProductForm(product);
            return;
        }

        if (!toggleButton) return;

        const product = findAdminProduct(toggleButton.dataset.toggleProduct);
        if (!product) return;

        toggleButton.disabled = true;

        try {
            const { error } = await window.supabaseClient
                .from("products")
                .update({ is_active: !Boolean(product.is_active) })
                .eq("id", product.id);

            if (error) throw error;

            await loadAdminProducts();

        } catch (error) {
            console.error("ADMIN PRODUCTS: Visibility error:", error);
            showAdminProductMessage("تعذر تغيير حالة المنتج.", "error");
            toggleButton.disabled = false;
        }

    });

}


function setupAdminProductsSearch() {
    document.getElementById("adminProductsSearch")?.addEventListener("input", renderAdminProducts);
}


function setupAdminProductsFilter() {
    document.getElementById("adminProductsFilter")?.addEventListener("change", renderAdminProducts);
}


function setupAdminProductsRefresh() {

    const refreshButton = document.getElementById("adminProductsRefresh");

    if (!refreshButton) return;

    refreshButton.addEventListener("click", async () => {
        const originalContent = refreshButton.innerHTML;
        refreshButton.disabled = true;
        refreshButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحديث...';
        const [loaded] = await Promise.all([
            loadAdminProducts(),
            loadAdminProductImages()
        ]);
        if (loaded) showAdminProductMessage("تم تحديث المنتجات والصور.", "success");
        refreshButton.disabled = false;
        refreshButton.innerHTML = originalContent;
    });

}


function addSelectedAdditionalImages(event) {

    const files = Array.from(event.target.files || []);

    files.forEach(file => {
        if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
            showAdminProductMessage("الصور الإضافية يجب أن تكون JPG أو PNG أو WebP.", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showAdminProductMessage("حجم كل صورة إضافية يجب ألا يتجاوز 5 MB.", "error");
            return;
        }

        selectedAdditionalImages.push({
            file,
            previewUrl: URL.createObjectURL(file)
        });
    });

    event.target.value = "";
    renderSelectedAdditionalImages();

}


function renderSelectedAdditionalImages() {

    const container = document.getElementById("adminProductSelectedGallery");
    if (!container) return;

    container.innerHTML = selectedAdditionalImages.length > 0
        ? selectedAdditionalImages.map((image, index) => `
            <div class="admin-product-gallery-item">
                <img src="${escapeAdminProductHTML(image.previewUrl)}" alt="معاينة صورة إضافية ${index + 1}">
                <button type="button" data-remove-selected-image="${index}" aria-label="حذف الصورة المختارة"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `).join("")
        : '<div class="admin-product-gallery-empty">لم يتم اختيار صور إضافية بعد.</div>';

}


function removeSelectedAdditionalImage(index) {

    const image = selectedAdditionalImages[index];
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);

    selectedAdditionalImages.splice(index, 1);
    renderSelectedAdditionalImages();

}


function clearSelectedAdditionalImages() {

    selectedAdditionalImages.forEach(image => {
        if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });

    selectedAdditionalImages = [];
    renderSelectedAdditionalImages();

}


function renderExistingAdditionalImages(productId = "") {

    const container = document.getElementById("adminProductExistingGallery");
    if (!container) return;

    if (!productId) {
        container.innerHTML = '<div class="admin-product-gallery-empty">اختر منتجًا لإظهار صوره الإضافية.</div>';
        return;
    }

    const images = adminProductImages
        .filter(image => String(image?.product_id) === String(productId) && image?.is_active === true)
        .sort((first, second) => Number(first?.sort_order || 0) - Number(second?.sort_order || 0));

    container.innerHTML = images.length > 0
        ? images.map((image, index) => `
            <div class="admin-product-gallery-item">
                <img src="${escapeAdminProductHTML(resolveAdminProductImage(image.image_url))}" alt="صورة إضافية ${index + 1}" loading="lazy">
                <button type="button" data-remove-existing-image="${escapeAdminProductHTML(image.id)}" aria-label="إخفاء الصورة من المعرض"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join("")
        : '<div class="admin-product-gallery-empty">لا توجد صور إضافية لهذا المنتج.</div>';

}


async function removeExistingAdditionalImage(imageId) {

    const image = adminProductImages.find(item => String(item?.id) === String(imageId));
    const currentProductId = document.getElementById("adminProductId")?.value;

    if (!image || !currentProductId) return;

    try {

        const { error } = await window.supabaseClient
            .from("product_images")
            .update({ is_active: false })
            .eq("id", image.id);

        if (error) throw error;

        image.is_active = false;
        renderExistingAdditionalImages(currentProductId);
        showAdminProductMessage("تم إخفاء الصورة من معرض المنتج.", "success");

    } catch (error) {

        console.error("ADMIN PRODUCTS: Gallery image removal error:", error);
        showAdminProductMessage("تعذر إخفاء الصورة من المعرض.", "error");

    }

}


async function saveAdditionalProductImages(productId) {

    if (selectedAdditionalImages.length === 0) return;

    const existingImages = adminProductImages.filter(image => String(image?.product_id) === String(productId));
    const highestOrder = existingImages.reduce(
        (highest, image) => Math.max(highest, Number(image?.sort_order) || 0),
        -1
    );
    const uploadedPaths = [];

    try {

        for (const selectedImage of selectedAdditionalImages) {
            const path = await uploadAdminProductImage(
                selectedImage.file,
                `product-images/gallery/${productId}`
            );
            uploadedPaths.push(path);
        }

        const rows = uploadedPaths.map((path, index) => ({
            product_id: productId,
            image_url: path,
            sort_order: highestOrder + index + 1,
            is_active: true
        }));

        const { error } = await window.supabaseClient
            .from("product_images")
            .insert(rows);

        if (error) throw error;

    } catch (error) {

        if (uploadedPaths.length > 0) {
            await window.supabaseClient.storage.from("products").remove(uploadedPaths);
        }

        throw error;

    }

}


async function uploadAdminProductImage(file, folder = "") {

    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        throw new Error("صيغة الصورة غير مدعومة. استعمل JPG أو PNG أو WebP.");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("حجم الصورة يجب ألا يتجاوز 5 MB.");
    }

    const { data: userData, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !userData?.user) throw new Error("انتهت جلسة تسجيل الدخول.");

    const extension = file.name.split(".").pop().toLowerCase();
    const uniqueId = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const fileName = `${Date.now()}-${uniqueId}.${extension}`;
    const path = folder
        ? `${folder}/${fileName}`
        : `product-images/${userData.user.id}/${fileName}`;

    const { error } = await window.supabaseClient.storage
        .from("products")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (error) throw error;

    return path;

}


function populateAdminProductForm(product) {

    document.getElementById("adminProductId").value = product.id || "";
    document.getElementById("adminProductName").value = product.name || "";
    document.getElementById("adminProductCategory").value = product.category_id || "";
    document.getElementById("adminProductStock").value = product.stock ?? 0;
    document.getElementById("adminProductPrice").value = product.price ?? "";
    document.getElementById("adminProductOldPrice").value = product.old_price ?? "";
    document.getElementById("adminProductDescription").value = product.description || "";
    document.getElementById("adminProductRating").value = product.rating ?? 0;
    document.getElementById("adminProductActive").checked = product.is_active !== false;
    document.getElementById("adminProductFormTitle").textContent = "تعديل المنتج";
    document.getElementById("adminProductSubmit").innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات';
    document.getElementById("adminProductImageRequired").hidden = true;

    renderAdminProductPreview(resolveAdminProductImage(product.image));
    clearSelectedAdditionalImages();
    renderExistingAdditionalImages(product.id);
    document.querySelector(".admin-product-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });

}


function resetAdminProductForm() {

    const form = document.getElementById("adminProductForm");
    if (!form) return;

    form.reset();
    document.getElementById("adminProductId").value = "";
    document.getElementById("adminProductActive").checked = true;
    document.getElementById("adminProductStock").value = 0;
    document.getElementById("adminProductRating").value = 0;
    document.getElementById("adminProductFormTitle").textContent = "إضافة منتج جديد";
    document.getElementById("adminProductSubmit").innerHTML = '<i class="fa-solid fa-plus"></i> حفظ المنتج';
    document.getElementById("adminProductImageRequired").hidden = false;
    showAdminProductMessage("", "success");
    renderAdminProductPreview("");
    clearSelectedAdditionalImages();
    renderExistingAdditionalImages();

}


function previewAdminProductImage(event) {

    const file = event.target.files?.[0];

    if (!file) {
        renderAdminProductPreview("");
        return;
    }

    renderAdminProductPreview(URL.createObjectURL(file));

}


function renderAdminProductPreview(url) {

    const preview = document.getElementById("adminProductImagePreview");
    if (!preview) return;

    preview.innerHTML = url
        ? `<img src="${escapeAdminProductHTML(url)}" alt="معاينة صورة المنتج">`
        : '<i class="fa-solid fa-image"></i>';

}


function findAdminProduct(productId) {
    return adminProducts.find(product => String(product?.id || "") === String(productId || ""));
}


function getAdminCategoryName(categoryId, fallbackName = "") {
    const category = adminCategories.find(item => String(item.id) === String(categoryId));
    return category?.name || fallbackName || "";
}


function resolveAdminProductImage(value) {

    const image = String(value || "").trim();

    if (!image || /^(https?:|data:|blob:)/i.test(image)) return image;

    const { data } = window.supabaseClient.storage.from("products").getPublicUrl(image);
    return data?.publicUrl || image;

}


function showAdminProductMessage(message, type = "error") {

    const element = document.getElementById("adminProductMessage");
    if (!element) return;

    if (!message) {
        element.textContent = "";
        element.className = "admin-product-message";
        return;
    }

    element.textContent = message;
    element.className = `admin-product-message show ${type}`;

}


function updateAdminProductsStats() {

    const total = adminProducts.length;
    const active = adminProducts.filter(product => product?.is_active === true).length;
    const inactive = total - active;

    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setValue("adminProductsCount", total);
    setValue("adminProductsActiveCount", active);
    setValue("adminProductsInactiveCount", inactive);

}


function showAdminProductsAccessDenied(message) {

    const page = document.querySelector(".admin-products-page");
    if (!page) return;

    page.innerHTML = `
        <div class="admin-access-denied">
            <i class="fa-solid fa-lock"></i>
            <h2>دخول غير مسموح</h2>
            <p>${escapeAdminProductHTML(message)}</p>
        </div>
    `;

}


function escapeAdminProductHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
