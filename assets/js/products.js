// =====================================================
//                 PRODUCTS DATABASE
//              SUPABASE PRODUCT LOADER
// =====================================================

window.products = [];
window.categories = [];
window.siteBanners = [];
window.offers = [];
window.productsLoadState = "idle";
window.productsLoadError = null;


function resolveStorageImage(value, bucket) {

    const image = String(value || "").trim();

    if (!image) return "";

    if (/^(https?:|data:|blob:)/i.test(image)) {
        return image;
    }

    if (!window.supabaseClient || !bucket) return image;

    const result =
        window.supabaseClient.storage
            .from(bucket)
            .getPublicUrl(image);

    return result?.data?.publicUrl || image;

}


function getRowImage(row, bucket) {

    return resolveStorageImage(
        row?.image_url ||
        row?.image ||
        row?.url ||
        row?.path,
        bucket
    );

}


async function loadOptionalTable(tableName) {

    if (!window.supabaseClient) return [];

    const { data, error } =
        await window.supabaseClient
            .from(tableName)
            .select("*");

    if (error) {
        console.warn(`Optional table ${tableName} unavailable:`, error.message);
        return [];
    }

    return Array.isArray(data) ? data : [];

}


function mergeProductImages(products, imageRows) {

    const imagesByProduct = new Map();

    imageRows.forEach(row => {

        const productKey =
            row?.product_id ?? row?.productId;

        if (productKey === null || productKey === undefined) return;

        const image = getRowImage(row, "products");

        if (!image) return;

        if (!imagesByProduct.has(String(productKey))) {
            imagesByProduct.set(String(productKey), []);
        }

        imagesByProduct.get(String(productKey)).push({
            image,
            isPrimary: Boolean(
                row?.is_primary ||
                row?.is_main ||
                row?.primary
            ),
            order: Number(
                row?.sort_order ??
                row?.display_order ??
                row?.position ??
                0
            ) || 0
        });

    });

    return products.map(product => {

        const rows = imagesByProduct
            .get(String(product.id)) || [];

        rows.sort((first, second) => first.order - second.order);

        const imageList = [
            resolveStorageImage(product.image, "products"),
            ...rows.map(row => row.image)
        ]
            .filter(Boolean)
            .filter((image, index, images) =>
                images.indexOf(image) === index
            );

        return {
            ...product,
            // `products.image` is always the main product image. The current
            // product_images schema has no primary-image column, so its rows
            // are gallery images and must never replace the main image.
            image: resolveStorageImage(product.image, "products"),
            images: imageList
        };

    });

}


// =====================================================
//                 LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    window.productsLoadState = "loading";
    window.productsLoadError = null;

    if (!window.supabaseClient) {

        console.error(
            "PRODUCTS ERROR: Supabase client is not available."
        );

        window.productsLoadState = "error";
        window.productsLoadError = "Supabase client is not available.";

        return [];

    }


    console.log(
        "PRODUCTS: Loading from Supabase..."
    );


    const {
        data,
        error
    } = await window.supabaseClient

        .from("products")

        .select("*")

        .eq("is_active", true)

        .order("id", {
            ascending: true
        });


    if (error) {

        console.error(
            "PRODUCTS ERROR:",
            error
        );

        window.products = [];
        window.productsLoadState = "error";
        window.productsLoadError = error.message || "Unable to load products.";

        return [];

    }


    window.products =
        Array.isArray(data)
            ? data
            : [];

    const [imageRows, categoryRows, bannerRows, offerRows] =
        await Promise.all([
            loadOptionalTable("product_images"),
            loadOptionalTable("categories"),
            loadOptionalTable("site_banners"),
            loadOptionalTable("offers")
        ]);

    window.products =
        mergeProductImages(window.products, imageRows);

    window.categories =
        categoryRows.map(category => ({
            ...category,
            image: getRowImage(category, "categories")
        }))
        .filter(category => category.is_active !== false)
        .sort((first, second) => Number(first.sort_order || 0) - Number(second.sort_order || 0) || Number(first.id || 0) - Number(second.id || 0));

    const categoryNamesById = new Map(
        window.categories
            .filter(category => category.id !== undefined && category.id !== null)
            .map(category => [String(category.id), category.name || category.title || ""])
    );

    window.products =
        window.products.map(product => ({
            ...product,
            category:
                categoryNamesById.get(String(product.category_id)) ||
                product.category ||
                ""
        }));

    window.siteBanners =
        bannerRows
            .filter(banner => banner.is_active === true)
            .sort((first, second) =>
                Number(first.sort_order || 0) -
                Number(second.sort_order || 0)
            )
            .map(banner => ({
                ...banner,
                image_url: resolveStorageImage(banner.image_url, "banners"),
                mobile_image_url: resolveStorageImage(banner.mobile_image_url, "banners")
            }));

    const now = Date.now();

    window.offers =
        offerRows
            .filter(offer => {
                if (offer.is_active !== true) return false;

                const startsAt = offer.starts_at
                    ? new Date(offer.starts_at).getTime()
                    : null;

                const endsAt = offer.ends_at
                    ? new Date(offer.ends_at).getTime()
                    : null;

                return (!startsAt || startsAt <= now) &&
                    (!endsAt || endsAt >= now);
            })
            .sort((first, second) =>
                Number(first.sort_order || 0) -
                Number(second.sort_order || 0)
            )
            .map(offer => ({
                ...offer,
                image_url: resolveStorageImage(offer.image_url, "banners")
            }));

    window.productsLoadState = "ready";


    console.log(
        "PRODUCTS: Loaded from Supabase:",
        window.products
    );


    // نخبر script.js أن المنتجات جاهزة
    window.dispatchEvent(
        new CustomEvent(
            "productsLoaded",
            {
                detail: window.products
            }
        )
    );


    return window.products;

}


// =====================================================
//              START LOADING
// =====================================================

window.productsReady =
    loadProducts();
