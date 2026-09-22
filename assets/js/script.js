// =====================================================
//   PRODUCTS DATABASE
//   products.js كيتحمل قبل script.js
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
//          READ PRODUCT ID (Product Details Page)
// =====================================================

let productId = null;
let product = null;

function hasProductStock(productItem) {

    return productItem &&
        productItem.stock !== null &&
        productItem.stock !== undefined &&
        productItem.stock !== "";

}

const buyNowBtn =
    document.getElementById("buyNowBtn");

const productStock =
    document.getElementById("productStock");

const relatedProductsContainer =
    document.getElementById("relatedProductsContainer");

const productDetailsState =
    document.getElementById("productDetailsState");

const productBadge =
    document.getElementById("productBadge");

const productDiscount =
    document.getElementById("productDiscount");

const thumbnailImages =
    document.getElementById("thumbnailImages");


function getProductImages(productItem) {

    let additionalImages = productItem?.images;

    if (typeof additionalImages === "string") {

        try {
            const parsedImages = JSON.parse(additionalImages);

            additionalImages =
                Array.isArray(parsedImages)
                    ? parsedImages
                    : additionalImages.split(",");

        } catch (_) {
            additionalImages = additionalImages.split(",");
        }

    }

    if (!Array.isArray(additionalImages)) {
        additionalImages = [];
    }

    return [productItem?.image, ...additionalImages]
        .map(image => String(image || "").trim())
        .filter(Boolean)
        .filter((image, index, images) =>
            images.indexOf(image) === index
        );

}


function setProductDetailsState(message, type = "loading") {

    if (!productDetailsState) return;

    productDetailsState.textContent = message;
    productDetailsState.className =
        `product-details-state ${type}`;

}


// =====================================================
//          LOAD CURRENT PRODUCT
// =====================================================

async function loadCurrentProduct() {

    if (
        !window.location.pathname
            .toLowerCase()
            .endsWith("product-details.html")
    ) {
        return;
    }

    setProductDetailsState("جاري تحميل المنتج...", "loading");

    // انتظار تحميل المنتجات من Supabase
    if (window.productsReady) {
        await window.productsReady;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    productId =
        Number(
            params.get("id")
        );

    product =
        products.find(
            item =>
                Number(item.id) === productId
        );

    console.log(
        "Current product:",
        product
    );

    if (!product) {
        console.warn(
            "Product not found:",
            productId
        );

        const productName =
            document.getElementById("productName");

        if (productName) {
            productName.textContent = "المنتج غير موجود";
        }

        if (addToCartBtn) {
            addToCartBtn.disabled = true;
        }

        if (buyNowBtn) {
            buyNowBtn.disabled = true;
        }

        if (wishlistBtn) {
            wishlistBtn.disabled = true;
        }

        setProductDetailsState("المنتج غير موجود أو لم يعد متاحاً.", "error");

        return;
    }

    const productImage =
        document.getElementById(
            "productImage"
        );

    const productName =
        document.getElementById(
            "productName"
        );

    const productCategory =
        document.getElementById(
            "productCategory"
        );

    const productRating =
        document.getElementById(
            "productRating"
        );

    const oldPrice =
        document.getElementById(
            "oldPrice"
        );

    const newPrice =
        document.getElementById(
            "newPrice"
        );

    const productDescription =
        document.getElementById(
            "productDescription"
        );

    const hasStockValue =
        hasProductStock(product);

    const stock =
        Number(product.stock);


    if (productImage) {

        productImage.src =
            product.image || "";

    }


    if (productName) {

        productName.textContent =
            product.name || "";

    }


    if (productCategory) {

        productCategory.textContent =
            product.category || "";

    }


    if (productRating) {
        productRating.innerHTML =
            `<span class="real-product-rating-loading">جاري تحميل التقييمات...</span>`;

    }


    if (oldPrice) {

        oldPrice.textContent =
            Number(product.old_price) > Number(product.price)
                ? formatPrice(product.old_price)
                : "";

        oldPrice.hidden =
            Number(product.old_price) <= Number(product.price);

    }


    if (newPrice) {

        newPrice.textContent =
            formatPrice(product.price);

    }


    if (productDescription) {

        productDescription.textContent =
            product.description || "";

    }

    if (productBadge) {

        const badge =
            product.badge ||
            (
                Number(product.old_price) > Number(product.price)
                    ? "SALE"
                    : ""
            );

        productBadge.textContent = badge;
        productBadge.hidden = !badge;

    }

    if (productDiscount) {

        const currentPrice = Number(product.price);
        const oldPriceValue = Number(product.old_price);
        const discount =
            oldPriceValue > currentPrice && currentPrice >= 0
                ? Math.round((1 - currentPrice / oldPriceValue) * 100)
                : 0;

        productDiscount.textContent =
            discount > 0 ? `-${discount}%` : "";
        productDiscount.hidden = discount <= 0;

    }

    if (productStock) {

        const validStockValue =
            hasStockValue && Number.isFinite(stock);

        const available = !validStockValue || stock > 0;

        productStock.textContent = validStockValue
            ? available
                ? `متوفر: ${stock} قطعة`
                : "غير متوفر حالياً"
            : "المخزون متوفر";

        productStock.classList.toggle("in-stock", available);
        productStock.classList.toggle("out-stock", !available);

        if (addToCartBtn) {
            addToCartBtn.disabled = !available;
        }

        if (buyNowBtn) {
            buyNowBtn.disabled = !available;
        }

    }

    const productImages = getProductImages(product);

    if (productImages.length > 0) {

        if (productImage) {
            productImage.src = productImages[0];
            productImage.alt = product.name || "صورة المنتج";
            productImage.hidden = false;

            productImage.onerror = () => {
                productImage.hidden = true;
            };
        }

        if (thumbnailImages) {

            thumbnailImages.innerHTML = "";

            productImages.forEach((image, index) => {

                const thumbnail = document.createElement("img");

                thumbnail.className =
                    `thumbnail${index === 0 ? " active-thumb" : ""}`;

                thumbnail.src = image;
                thumbnail.alt =
                    `${product.name || "المنتج"} - صورة ${index + 1}`;
                thumbnail.loading = "lazy";

                thumbnail.addEventListener("click", () => {

                    if (!mainImage) return;

                    mainImage.src = image;

                    thumbnailImages
                        .querySelectorAll(".thumbnail")
                        .forEach(item =>
                            item.classList.remove("active-thumb")
                        );

                    thumbnail.classList.add("active-thumb");

                });

                thumbnail.addEventListener("error", () => {
                    thumbnail.remove();
                });

                thumbnailImages.appendChild(thumbnail);

            });

        }

    }


    refreshProductWishlistUI();
    displayRelatedProducts();
    await loadProductReviews();
    setProductDetailsState("", "ready");

}


// =====================================================
//                    THUMBNAIL GALLERY
// =====================================================

const mainImage =
    document.getElementById(
        "productImage"
    );

// =====================================================
//                    CART HELPERS
// =====================================================

function getCart() {

    const cartData =
        localStorage.getItem(
            "cart"
        );

    if (!cartData) return [];

    try {

        const cart = JSON.parse(cartData);

        if (!Array.isArray(cart)) return [];

        return cart
            .map(item => ({
                ...item,
                quantity: Number.isInteger(Number(item.quantity))
                    ? Math.max(1, Number(item.quantity))
                    : 1
            }))
            .filter(item => item.id !== null && item.id !== undefined);

    } catch (error) {

        console.warn("Invalid cart data. Resetting cart.", error);
        localStorage.removeItem("cart");

        return [];

    }

}


function saveCart(cart) {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


function normalizePrice(price) {

    return Number(
        String(price)
            .replace("$", "")
            .replace("DH", "")
            .trim()
    ) || 0;

}


function formatPrice(price) {

    return `${normalizePrice(price).toFixed(2)} DH`;

}


function getCheckoutIdempotencyKey() {

    const storageKey = "checkoutIdempotencyKey";
    const existingKey = localStorage.getItem(storageKey);

    if (existingKey) return existingKey;

    const key = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, character => {
            const random = Math.floor(Math.random() * 16);
            const value = character === "x" ? random : (random & 0x3) | 0x8;
            return value.toString(16);
        });

    localStorage.setItem(storageKey, key);
    return key;

}


function addProductToCart(
    productToAdd,
    quantity
) {

    const cart =
        getCart();

    const safeQuantity =
        Number.isInteger(Number(quantity))
            ? Math.max(1, Number(quantity))
            : 1;

    const hasStock = hasProductStock(productToAdd) &&
        Number.isFinite(Number(productToAdd.stock));

    const maxStock = hasStock
        ? Math.max(0, Number(productToAdd.stock))
        : null;

    if (maxStock === 0) return false;

    const existingItem =
        cart.find(
            item =>
                Number(item.id) ===
                Number(productToAdd.id)
        );


    if (existingItem) {

        existingItem.quantity =
            Math.min(
                existingItem.quantity + safeQuantity,
                maxStock ?? Number.MAX_SAFE_INTEGER
            );

    } else {

        cart.push({

            id:
                productToAdd.id,

            name:
                productToAdd.name,

            price:
                productToAdd.price,

            image:
                productToAdd.image,

            quantity:
                Math.min(
                    safeQuantity,
                    maxStock ?? Number.MAX_SAFE_INTEGER
                )

        });

    }


    saveCart(cart);

    console.log(
        "Cart updated:",
        cart
    );

    return cart;

}


function removeFromCart(
    productId
) {

    let cart =
        getCart();

    cart =
        cart.filter(
            item =>
                Number(item.id) !==
                Number(productId)
        );

    saveCart(cart);

    updateCartCounter();

}


function changeQuantity(
    productId,
    change
) {

    const cart =
        getCart();

    const item =
        cart.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );

    if (!item) return;

    const productInStore =
        (Array.isArray(window.products) ? window.products : [])
            .find(productItem =>
                Number(productItem.id) === Number(productId)
            );

    const nextQuantity =
        item.quantity + Number(change);

    if (
        productInStore &&
        hasProductStock(productInStore) &&
        Number.isFinite(Number(productInStore.stock)) &&
        nextQuantity > Number(productInStore.stock)
    ) {
        return;
    }

    item.quantity = nextQuantity;


    if (item.quantity <= 0) {

        removeFromCart(
            productId
        );

        return;

    }


    saveCart(cart);

    updateCartCounter();

}


function calculateCartTotal() {

    const cart =
        getCart();

    let total = 0;


    cart.forEach(
        item => {

            const price =
                normalizePrice(
                    item.price
                );

            total +=
                price *
                Number(item.quantity);

        }
    );


    return total.toFixed(2);

}


function clearCart() {

    localStorage.removeItem(
        "cart"
    );

    updateCartCounter();

    displayCart();

}


function updateCartCounter() {

    const cartCounter =
        document.getElementById(
            "cartCounter"
        );

    if (!cartCounter) return;


    const cart =
        getCart();

    let totalItems = 0;


    cart.forEach(
        item => {

            totalItems +=
                Number(item.quantity) || 0;

        }
    );


    cartCounter.textContent =
        totalItems;

}


// =====================================================
//                  WISHLIST HELPERS
// =====================================================

function getWishlist() {

    const data =
        localStorage.getItem(
            "wishlist"
        );

    if (!data) return [];

    try {

        const wishlist = JSON.parse(data);

        return Array.isArray(wishlist) ? wishlist : [];

    } catch (error) {

        console.warn("Invalid wishlist data. Resetting wishlist.", error);
        localStorage.removeItem("wishlist");

        return [];

    }

}


function saveWishlist(
    wishlist
) {

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );

    updateWishlistCounter();

}


function updateWishlistCounter() {

    const wishlistLinks =
        document.querySelectorAll(
            '.nav-actions a[href="wishlist.html"]'
        );

    const count =
        getWishlist().length;

    wishlistLinks.forEach(link => {

        let counter =
            link.querySelector(".wishlist-counter");

        if (!counter) {
            counter = document.createElement("span");
            counter.className = "wishlist-counter";
            link.appendChild(counter);
        }

        counter.textContent = count;
        counter.hidden = count === 0;

    });

}


function toggleWishlist(
    productId
) {

    let wishlist =
        getWishlist();

    const index =
        wishlist.findIndex(
            item =>
                Number(item.id) ===
                Number(productId)
        );


    if (index === -1) {

        const productToAdd =
            products.find(
                item =>
                    Number(item.id) ===
                    Number(productId)
            );

        if (!productToAdd) return;

        wishlist.push(
            productToAdd
        );

    } else {

        wishlist.splice(
            index,
            1
        );

    }


    saveWishlist(
        wishlist
    );

}


function removeFromWishlist(
    productId
) {

    const card =
        document.querySelector(
            `[data-id="${productId}"]`
        );


    if (card) {

        card.classList.add(
            "removing"
        );


        setTimeout(
            () => {

                let wishlist =
                    getWishlist();

                wishlist =
                    wishlist.filter(
                        item =>
                            Number(item.id) !==
                            Number(productId)
                    );

                saveWishlist(
                    wishlist
                );

                displayWishlist();

            },
            350
        );

    } else {

        let wishlist =
            getWishlist();

        wishlist =
            wishlist.filter(
                item =>
                    Number(item.id) !==
                    Number(productId)
            );

        saveWishlist(
            wishlist
        );

        displayWishlist();

    }

}


// =====================================================
//       WISHLIST BUTTON - PRODUCT DETAILS
// =====================================================

const wishlistBtn =
    document.getElementById(
        "wishlistBtn"
    );


function refreshProductWishlistUI() {

    if (
        !wishlistBtn ||
        !product
    ) {
        return;
    }


    const wishlistIcon =
        wishlistBtn.querySelector(
            "i"
        );

    if (!wishlistIcon) return;


    const wishlist =
        getWishlist();


    const exists =
        wishlist.some(
            item =>
                Number(item.id) ===
                Number(product.id)
        );


    wishlistIcon.classList.toggle(
        "fa-solid",
        exists
    );

    wishlistIcon.classList.toggle(
        "fa-regular",
        !exists
    );

}


if (wishlistBtn) {

    wishlistBtn.addEventListener(
        "click",
        () => {

            if (!product) return;

            toggleWishlist(
                product.id
            );

            refreshProductWishlistUI();

        }
    );

}


// =====================================================
//       ADD TO CART - PRODUCT DETAILS
// =====================================================

const addToCartBtn =
    document.getElementById(
        "addToCartBtn"
    );


if (addToCartBtn) {

    addToCartBtn.addEventListener(
        "click",
        () => {

            if (!product) {

                console.log(
                    "No product loaded."
                );

                return;

            }


            const quantityInput =
                document.getElementById(
                    "quantity"
                );


            const parsedQuantity = Number(
                quantityInput ? quantityInput.value : 1
            );

            const quantity = Number.isInteger(parsedQuantity)
                ? Math.max(1, parsedQuantity)
                : 1;

            if (hasProductStock(product) && Number.isFinite(Number(product.stock)) && quantity > Number(product.stock)) {
                if (productStock) {
                    productStock.textContent = `الكمية المتاحة هي ${product.stock} فقط`;
                }
                return;
            }


            addProductToCart(
                product,
                quantity
            );


            const productImageEl =
                document.getElementById(
                    "productImage"
                );


            flyToCart(
                productImageEl
            );


            updateCartCounter();


            const originalText =
                addToCartBtn.innerHTML;


            addToCartBtn.innerHTML =
                `<i class="fa-solid fa-check"></i> Added!`;

            addToCartBtn.disabled =
                true;


            setTimeout(
                () => {

                    addToCartBtn.innerHTML =
                        originalText;

                    addToCartBtn.disabled =
                        false;

                },
                1500
            );

        }
    );

}


if (buyNowBtn) {

    buyNowBtn.addEventListener("click", () => {

        if (!product) return;

        const quantityInput =
            document.getElementById("quantity");

        const quantity = Number(quantityInput?.value);

        if (!Number.isInteger(quantity) || quantity < 1) {
            if (productStock) {
                productStock.textContent = "المرجو إدخال كمية صحيحة";
            }

            return;
        }

        if (product.stock !== null &&
            product.stock !== undefined &&
            product.stock !== "" &&
            Number.isFinite(Number(product.stock)) &&
            quantity > Number(product.stock)) {
            if (productStock) {
                productStock.textContent = `الكمية المتاحة هي ${product.stock} فقط`;
            }

            return;
        }

        addProductToCart(product, quantity);
        updateCartCounter();
        window.location.href = "checkout.html";

    });

}


function displayRelatedProducts() {

    if (!relatedProductsContainer || !product) return;

    const relatedProducts =
        (Array.isArray(window.products) ? window.products : [])
            .filter(productItem =>
                Number(productItem.id) !== Number(product.id) &&
                productItem.category === product.category
            )
            .slice(0, 4);

    relatedProductsContainer.innerHTML = relatedProducts.length > 0
        ? relatedProducts.map(createProductCardHTML).join("")
        : `
            <p class="categories-empty">
                لا توجد منتجات مرتبطة حالياً.
            </p>
        `;

}


// =====================================================
//                    CART PAGE
// =====================================================

function displayCart() {

    const cartContainer =
        document.getElementById(
            "cartItems"
        );

    if (!cartContainer) return;


    const cart =
        getCart();


    if (cart.length === 0) {

        cartContainer.innerHTML = `

            <div class="empty-cart">

                <i class="fa-solid fa-cart-shopping"></i>

                <h2>Your Cart Is Empty</h2>

                <p>
                    Looks like you haven't added any products yet.
                </p>

                <a href="products.html">
                    Continue Shopping
                </a>

            </div>

        `;


        const subtotalEl =
            document.getElementById(
                "subtotal"
            );

        const totalEl =
            document.getElementById(
                "totalPrice"
            );


        if (subtotalEl) {

            subtotalEl.textContent =
                "0.00 DH";

        }


        if (totalEl) {

            totalEl.textContent =
                "0.00 DH";

        }


        return;

    }


    cartContainer.innerHTML =
        "";

    let total = 0;


    cart.forEach(
        item => {

            const price =
                normalizePrice(
                    item.price
                );


            const itemTotal =
                price *
                Number(item.quantity);


            total +=
                itemTotal;


            cartContainer.innerHTML += `

                <div class="cart-item">

                    <div class="cart-product">

                        <img
                            src="${escapeHTML(item.image)}"
                            alt="${escapeHTML(item.name)}"
                        >

                        <div>

                            <h3>
                                ${escapeHTML(item.name)}
                            </h3>

                            <p>
                                ID : ${item.id}
                            </p>

                        </div>

                    </div>


                    <div>
                        ${formatPrice(price)}
                    </div>


                    <div class="quantity-box">

                        <button
                            class="quantity-btn"
                            onclick="changeQuantity(${item.id},-1);displayCart();"
                        >
                            -
                        </button>

                        <span class="quantity-value">
                            ${item.quantity}
                        </span>

                        <button
                            class="quantity-btn"
                            onclick="changeQuantity(${item.id},1);displayCart();"
                        >
                            +
                        </button>

                    </div>


                    <div>
                        ${formatPrice(itemTotal)}
                    </div>


                    <button
                        class="remove-btn"
                        onclick="removeFromCart(${item.id});displayCart();"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            `;

        }
    );


    const subtotal =
        document.getElementById(
            "subtotal"
        );

    const totalPrice =
        document.getElementById(
            "totalPrice"
        );


    if (subtotal) {

        subtotal.textContent =
            formatPrice(total);

    }


    if (totalPrice) {

        totalPrice.textContent =
            formatPrice(total);

    }

}


displayCart();


// =====================================================
//              CHECKOUT BUTTON
// =====================================================

const checkoutBtn =
    document.querySelector(
        ".checkout-btn"
    );


if (checkoutBtn) {

    checkoutBtn.addEventListener(
        "click",
        () => {

            const cart =
                getCart();


            if (cart.length === 0) {

                alert(
                    "Your cart is empty!"
                );

                return;

            }


            window.location.href =
                "checkout.html";

        }
    );

}


updateCartCounter();
updateWishlistCounter();


// =====================================================
//              CLEAR CART MODAL
// =====================================================

const customModal =
    document.getElementById(
        "customModal"
    );

const confirmModal =
    document.getElementById(
        "confirmModal"
    );

const cancelModal =
    document.getElementById(
        "cancelModal"
    );

const clearCartBtn =
    document.getElementById(
        "clearCartBtn"
    );


if (clearCartBtn) {

    clearCartBtn.addEventListener(
        "click",
        () => {

            if (customModal) {

                customModal.classList.add(
                    "active"
                );

            }

        }
    );

}


if (cancelModal) {

    cancelModal.addEventListener(
        "click",
        () => {

            if (customModal) {

                customModal.classList.remove(
                    "active"
                );

            }

        }
    );

}


if (confirmModal) {

    confirmModal.addEventListener(
        "click",
        () => {

            clearCart();

            if (customModal) {

                customModal.classList.remove(
                    "active"
                );

            }

        }
    );

}


if (customModal) {

    customModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                customModal
            ) {

                customModal.classList.remove(
                    "active"
                );

            }

        }
    );

}


// =====================================================
//                DISPLAY PRODUCTS
// =====================================================

let selectedCategory =
    "جميع التصنيفات";

let selectedSearchTerm = "";

let minPrice = null;

let maxPrice = null;

let visibleProductsCount = 12;


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


const productsSearchInput =
    document.getElementById("productsSearchInput");

const productsCount =
    document.getElementById("productsCount");

const loadMoreProductsBtn =
    document.getElementById("loadMoreProductsBtn");

const minPriceFilter =
    document.getElementById("minPriceFilter");

const maxPriceFilter =
    document.getElementById("maxPriceFilter");


const categoryFromUrl =
    new URLSearchParams(window.location.search)
        .get("category");


if (categoryFromUrl) {
    selectedCategory = categoryFromUrl;
}


function getProductCategories() {

    const categoryMap = new Map();

    (Array.isArray(window.products) ? window.products : [])
        .forEach(productItem => {

            const category =
                String(productItem.category || "").trim();

            if (!category) return;

            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }

            categoryMap.get(category).push(productItem);

        });

    return [...categoryMap.entries()]
        .map(([name, categoryProducts]) => ({
            name,
            products: categoryProducts,
            count: categoryProducts.length,
            image: categoryProducts.find(item => item.image)?.image || ""
        }))
        .sort((first, second) =>
            first.name.localeCompare(second.name, undefined, {
                sensitivity: "base"
            })
        );

}


function populateCategoryFilter() {

    if (!categoryFilter) return;

    const categories = getProductCategories();

    categoryFilter.innerHTML = `
        <option value="جميع التصنيفات">جميع التصنيفات</option>
        ${categories.map(category => `
            <option value="${escapeHTML(category.name)}">
                ${escapeHTML(category.name)}
            </option>
        `).join("")}
    `;

    const hasSelectedCategory =
        categories.some(category => category.name === selectedCategory);

    categoryFilter.value =
        hasSelectedCategory
            ? selectedCategory
            : "جميع التصنيفات";

    selectedCategory = categoryFilter.value;

}


function displayCategories() {

    const container =
        document.getElementById("categoriesContainer");

    if (!container) return;

    if (window.productsLoadError) {
        container.innerHTML = `
            <p class="categories-empty">
                تعذر تحميل التصنيفات حالياً. حاول تحديث الصفحة.
            </p>
        `;

        return;
    }

    const databaseCategories =
        Array.isArray(window.categories)
            ? window.categories
                .map(category => {

                    const categoryName =
                        category.name || category.title || category.slug;

                    const categoryProducts =
                        (Array.isArray(window.products)
                            ? window.products
                            : []
                        ).filter(productItem =>
                            String(productItem.category || "").trim().toLowerCase() ===
                            String(categoryName || "").trim().toLowerCase()
                        );

                    return {
                        name: categoryName,
                        image:
                            category.image ||
                            categoryProducts.find(productItem => productItem.image)?.image ||
                            "",
                        count: categoryProducts.length
                    };

                })
                .filter(category => category.name)
            : [];

    const categories =
        databaseCategories.length > 0
            ? databaseCategories
            : getProductCategories();

    if (categories.length === 0) {
        container.innerHTML = `
            <p class="categories-empty">
                لا توجد تصنيفات متاحة حالياً.
            </p>
        `;

        return;
    }

    container.innerHTML = categories.map(category => `
        <article class="category-card">
            <a
                href="products.html?category=${encodeURIComponent(category.name)}"
                class="category-link"
                aria-label="تصفح منتجات تصنيف ${escapeHTML(category.name)}">
                <img
                    src="${escapeHTML(category.image || "")}" 
                    alt="${escapeHTML(category.name)}"
                    loading="lazy">
                <div class="category-overlay">
                    <div>
                        <h3>${escapeHTML(category.name)}</h3>
                        <p>${category.count} منتج</p>
                    </div>
                    <span class="category-action">
                        تصفح التصنيف
                        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    </span>
                </div>
            </a>
        </article>
    `).join("");

}


function getSafeContentUrl(value, fallback = "products.html") {

    const url = String(value || "").trim();

    if (!url) return fallback;

    if (/^javascript:/i.test(url)) return fallback;

    return url;

}


function displaySiteBanner() {

    const banner =
        Array.isArray(window.siteBanners)
            ? window.siteBanners[0]
            : null;

    const hero = document.getElementById("hero");
    const title = document.getElementById("heroTitle");
    const subtitle = document.getElementById("heroSubtitle");
    const primaryButton = document.getElementById("heroPrimaryButton");
    const secondaryButton = document.getElementById("heroSecondaryButton");

    if (!hero || !title || !subtitle || !primaryButton || !secondaryButton) {
        return;
    }

    secondaryButton.hidden = false;
    secondaryButton.textContent = "اكتشف المزيد";
    secondaryButton.onclick = () => {
        document.getElementById("categories")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    if (!banner) {
        primaryButton.textContent = "تسوق الآن";
        primaryButton.onclick = () => {
            window.location.href = "products.html";
        };
        return;
    }

    title.textContent = banner.title || "";
    subtitle.textContent = banner.subtitle || "";

    if (banner.image_url) {
        hero.style.setProperty(
            "--hero-desktop-image",
            `url("${String(banner.image_url).replaceAll('"', '%22')}")`
        );
    } else {
        hero.style.removeProperty("--hero-desktop-image");
    }

    if (banner.mobile_image_url) {
        hero.style.setProperty(
            "--hero-mobile-image",
            `url("${String(banner.mobile_image_url).replaceAll('"', '%22')}")`
        );
    } else {
        hero.style.removeProperty("--hero-mobile-image");
    }

    const buttonUrl =
        getSafeContentUrl(banner.button_url);

    primaryButton.textContent =
        banner.button_text || "تسوق الآن";
    primaryButton.onclick = () => {
        window.location.href = buttonUrl;
    };

}


function displayOffer() {

    const section =
        document.getElementById("offersSection");

    const offer =
        Array.isArray(window.offers)
            ? window.offers[0]
            : null;

    if (!section) return;

    if (!offer) {
        section.hidden = true;
        return;
    }

    section.hidden = false;

    const title = document.getElementById("offerTitle");
    const subtitle = document.getElementById("offerSubtitle");
    const tag = document.getElementById("offerTag");
    const button = document.getElementById("offerButton");

    if (title) title.textContent = offer.title || "";
    if (subtitle) subtitle.textContent = offer.subtitle || "";
    if (tag) tag.textContent = offer.button_text || "عرض محدود";

    if (offer.image_url) {
        section.style.backgroundImage =
            `linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)), url("${String(offer.image_url).replaceAll('"', '%22')}")`;
    }

    if (button) {
        button.textContent = offer.button_text || "اكتشف العرض";
        button.onclick = () => {
            window.location.href =
                getSafeContentUrl(offer.button_url);
        };
    }

}


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        () => {

            selectedCategory =
                categoryFilter.value;

            displayProducts();

        }
    );

}


if (productsSearchInput) {

    productsSearchInput.addEventListener(
        "input",
        () => {

            selectedSearchTerm =
                productsSearchInput.value.trim().toLowerCase();

            visibleProductsCount = 12;
            displayProducts();

        }
    );

}


function updatePriceFilter() {

    const parsedMin = Number(minPriceFilter?.value);
    const parsedMax = Number(maxPriceFilter?.value);

    minPrice =
        minPriceFilter?.value !== "" && Number.isFinite(parsedMin)
            ? Math.max(0, parsedMin)
            : null;

    maxPrice =
        maxPriceFilter?.value !== "" && Number.isFinite(parsedMax)
            ? Math.max(0, parsedMax)
            : null;

    visibleProductsCount = 12;
    displayProducts();

}


if (minPriceFilter) {
    minPriceFilter.addEventListener("input", updatePriceFilter);
}

if (maxPriceFilter) {
    maxPriceFilter.addEventListener("input", updatePriceFilter);
}


if (loadMoreProductsBtn) {

    loadMoreProductsBtn.addEventListener(
        "click",
        () => {

            visibleProductsCount += 12;
            displayProducts();

        }
    );

}


// =====================================================
//                    SORT FILTER
// =====================================================

let selectedSort =
    "ترتيب حسب";


const sortFilter =
    document.getElementById(
        "sortFilter"
    );


if (sortFilter) {

    sortFilter.addEventListener(
        "change",
        () => {

            selectedSort =
                sortFilter.value;

            displayProducts();

        }
    );

}


// =====================================================
//                  DISPLAY PRODUCTS
// =====================================================

function createProductCardHTML(productItem) {

    const isFavorite =
        getWishlist().some(
            item => Number(item.id) === Number(productItem.id)
        );

    const badge =
        productItem.badge ||
        (
            Number(productItem.old_price) > Number(productItem.price)
                ? "SALE"
                : ""
        );

    return `
        <article class="product-card">
            ${badge ? `
                <span class="product-badge">
                    ${escapeHTML(badge)}
                </span>
            ` : ""}

            <div class="product-icons">
                <button
                    type="button"
                    class="icon-btn"
                    aria-label="إضافة ${escapeHTML(productItem.name || "المنتج")} للمفضلة"
                    onclick="toggleWishlist(${Number(productItem.id)}); displayProducts(); displayRelatedProducts();">
                    <i class="${isFavorite ? "fa-solid" : "fa-regular"} fa-heart"></i>
                </button>

                <a
                    href="product-details.html?id=${encodeURIComponent(productItem.id)}"
                    class="icon-btn"
                    aria-label="عرض تفاصيل ${escapeHTML(productItem.name || "المنتج")}">
                    <i class="fa-regular fa-eye"></i>
                </a>
            </div>

            <a href="product-details.html?id=${encodeURIComponent(productItem.id)}">
                <img
                    src="${escapeHTML(productItem.image || "")}" 
                    alt="${escapeHTML(productItem.name || "المنتج")}" 
                    loading="lazy">
            </a>

            <div class="product-info">
                <p class="product-category">
                    ${escapeHTML(productItem.category || "")}
                </p>

                <h3>${escapeHTML(productItem.name || "منتج")}</h3>

                <div class="product-price">
                    <div class="price-box">
                        <span class="new-price">
                            ${escapeHTML(formatPrice(productItem.price))}
                        </span>
                        ${Number(productItem.old_price) > Number(productItem.price) ? `
                            <span class="old-price">
                                ${escapeHTML(formatPrice(productItem.old_price))}
                            </span>
                        ` : ""}
                    </div>
                </div>

                <button
                    type="button"
                    class="cart-btn"
                    aria-label="إضافة ${escapeHTML(productItem.name || "المنتج")} للسلة"
                    onclick="addToCartFromHome(${Number(productItem.id)}, this)">
                    <i class="fa-solid fa-cart-shopping"></i>
                    Add To Cart
                </button>
            </div>
        </article>
    `;

}

async function displayProducts() {

    const container =
        document.getElementById(
            "productsContainer"
        );


    if (!container) return;

    container.innerHTML = `
        <p class="products-loading" role="status">
            جاري تحميل المنتجات...
        </p>
    `;


    // انتظار Supabase
    if (window.productsReady) {

        await window.productsReady;

    }

    if (window.productsLoadError) {
        container.innerHTML = `
            <p class="products-error" role="alert">
                تعذر تحميل المنتجات حالياً. حاول تحديث الصفحة.
            </p>
        `;

        if (productsCount) {
            productsCount.textContent = "تعذر التحميل";
        }

        if (loadMoreProductsBtn) {
            loadMoreProductsBtn.hidden = true;
        }

        return;
    }


    let filteredProducts =
        [...products];

    const isHomepageProducts =
        document.body.classList.contains("home-page") &&
        container.id === "productsContainer";

    if (isHomepageProducts) {

        const featuredProducts =
            filteredProducts.filter(productItem =>
                productItem.featured === true
            );

        filteredProducts =
            featuredProducts.length > 0
                ? featuredProducts
                : filteredProducts.slice(0, 4);

    }

    if (selectedCategory !== "جميع التصنيفات") {

        const normalizedCategory =
            selectedCategory.trim().toLowerCase();

        filteredProducts =
            filteredProducts.filter(productItem =>
                String(productItem.category || "")
                    .trim()
                    .toLowerCase() === normalizedCategory
            );

    }

    if (minPrice !== null || maxPrice !== null) {

        filteredProducts =
            filteredProducts.filter(productItem => {

                const price = Number(productItem.price);

                if (!Number.isFinite(price)) return false;
                if (minPrice !== null && price < minPrice) return false;
                if (maxPrice !== null && price > maxPrice) return false;

                return true;

            });

    }

    if (selectedSearchTerm) {

        filteredProducts =
            filteredProducts.filter(productItem => {

                const searchableText = [
                    productItem.name,
                    productItem.category,
                    productItem.description
                ]
                    .map(value => String(value || "").toLowerCase())
                    .join(" ");

                return searchableText.includes(selectedSearchTerm);

            });

    }


    // =================================================
    //                    SORT
    // =================================================

    if (
        selectedSort ===
        "الأحدث"
    ) {

        filteredProducts.sort(
            (a, b) =>
                new Date(
                    b.created_at
                ) -
                new Date(
                    a.created_at
                )
        );


    } else if (
        selectedSort ===
        "السعر: الأقل أولاً"
    ) {

        filteredProducts.sort(
            (a, b) =>
                Number(a.price) -
                Number(b.price)
        );


    } else if (
        selectedSort ===
        "السعر: الأعلى أولاً"
    ) {

        filteredProducts.sort(
            (a, b) =>
                Number(b.price) -
                Number(a.price)
        );


    } else if (
        selectedSort ===
        "الأكثر مبيعًا"
    ) {

        // sales غير موجودة في products.
        // غادي نربطوها لاحقاً مع order_items.

    }


    container.innerHTML =
        "";

    if (productsCount) {
        productsCount.textContent =
            `${filteredProducts.length} منتج`;
    }


    if (
        filteredProducts.length ===
        0
    ) {

        container.innerHTML = `

            <p
                style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:60px 0;
                    color:#777;
                "
            >
                لا توجد منتجات مطابقة لهذا التصنيف.
            </p>

        `;

        if (loadMoreProductsBtn) {
            loadMoreProductsBtn.hidden = true;
        }

        return;

    }


    const productsToRender =
        filteredProducts.slice(
            0,
            visibleProductsCount
        );


    container.innerHTML =
        productsToRender
            .map(createProductCardHTML)
            .join("");

    if (loadMoreProductsBtn) {

        loadMoreProductsBtn.hidden =
            visibleProductsCount >= filteredProducts.length;

    }

}


async function displayLatestProducts() {

    const container =
        document.getElementById("latestProductsContainer");

    if (!container) return;

    if (window.productsReady) {
        await window.productsReady;
    }

    if (window.productsLoadError) {
        container.innerHTML = `
            <p class="categories-empty" role="alert">
                تعذر تحميل المنتجات الجديدة حالياً.
            </p>
        `;

        return;
    }

    const latestProducts =
        [...(Array.isArray(window.products) ? window.products : [])]
            .sort((first, second) =>
                new Date(second.created_at || 0) -
                new Date(first.created_at || 0)
            )
            .slice(0, 4);

    if (latestProducts.length === 0) {
        container.innerHTML = `
            <p class="categories-empty">
                لا توجد منتجات جديدة حالياً.
            </p>
        `;

        return;
    }

    container.innerHTML =
        latestProducts
            .map(createProductCardHTML)
            .join("");

}


// =====================================================
//           START PRODUCTS DISPLAY
// =====================================================

if (window.productsReady) {

    window.productsReady.then(
        () => {
            populateCategoryFilter();
            displayCategories();
            displayProducts();
            displayLatestProducts();
            displaySiteBanner();
            displayOffer();
        }
    );

} else {

    populateCategoryFilter();
    displayCategories();
    displayProducts();
    displayLatestProducts();
    displaySiteBanner();
    displayOffer();

}


// =====================================================
//        ADD TO CART FROM PRODUCTS
// =====================================================

function addToCartFromHome(
    productId,
    button
) {

    const productToAdd =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );


    if (!productToAdd) return;


    addProductToCart(
        productToAdd,
        1
    );


    const image =
        button
            .closest(".product-card")
            ?.querySelector("img");


    flyToCart(
        image
    );


    updateCartCounter();


    const originalText =
        button.innerHTML;


    button.innerHTML =
        `<i class="fa-solid fa-check"></i> Added!`;

    button.disabled =
        true;


    setTimeout(
        () => {

            button.innerHTML =
                originalText;

            button.disabled =
                false;

        },
        1500
    );

}


// =====================================================
//                  FLY TO CART
// =====================================================

function flyToCart(
    imageElement
) {

    const cartIcon =
        document.getElementById(
            "cartIcon"
        );


    if (
        !cartIcon ||
        !imageElement
    ) {
        return;
    }


    const flyingImg =
        imageElement.cloneNode(
            true
        );


    flyingImg.classList.add(
        "flying-product"
    );


    document.body.appendChild(
        flyingImg
    );


    const start =
        imageElement.getBoundingClientRect();


    const end =
        cartIcon.getBoundingClientRect();


    flyingImg.style.left =
        start.left + "px";


    flyingImg.style.top =
        start.top + "px";


    setTimeout(
        () => {

            flyingImg.style.left =
                end.left + "px";

            flyingImg.style.top =
                end.top + "px";

            flyingImg.style.width =
                "20px";

            flyingImg.style.height =
                "20px";

            flyingImg.style.opacity =
                "0.2";

        },
        20
    );


    flyingImg.addEventListener(
        "transitionend",
        () => {

            flyingImg.remove();

        }
    );

}


// =====================================================
//                DISPLAY WISHLIST
// =====================================================

function displayWishlist() {

    const container =
        document.getElementById(
            "wishlistContainer"
        );


    if (!container) return;


    const wishlist =
        getWishlist();


    if (
        wishlist.length ===
        0
    ) {

        container.innerHTML = `

            <div class="empty-wishlist">

                <i
                    class="fa-regular fa-heart"
                ></i>

                <h2>
                    Your Wishlist is Empty
                </h2>

                <p>
                    Looks like you haven't
                    added anything yet.
                </p>

                <a href="products.html">
                    Continue Shopping
                </a>

            </div>

        `;

        return;

    }


    container.innerHTML =
        "";


    wishlist.forEach(
        item => {

            container.innerHTML += `

                <div
                    class="product-card"
                    data-id="${item.id}"
                >

                    <span class="product-badge">
                        FAVORITE
                    </span>


                    <a
                        href="product-details.html?id=${item.id}"
                    >

                        <img
                            src="${escapeHTML(item.image || "")}"
                            alt="${escapeHTML(item.name || "")}"
                        >

                    </a>


                    <div class="product-info">

                        <p class="product-category">
                            ${escapeHTML(item.category || "")}
                        </p>


                        <h3>
                            ${escapeHTML(item.name || "")}
                        </h3>


                        <div class="price-box">

                            <span class="new-price">
                                ${escapeHTML(formatPrice(item.price))}
                            </span>

                            ${
                                Number(item.old_price) > Number(item.price)
                                ? `
                                    <span class="old-price">
                                        ${escapeHTML(formatPrice(item.old_price))}
                                    </span>
                                  `
                                : ""
                            }

                        </div>


                        <button
                            class="cart-btn"
                            onclick="
                                addToCartFromHome(
                                    ${item.id},
                                    this
                                )
                            "
                        >

                            <i
                                class="fa-solid fa-cart-shopping"
                            ></i>

                            Add To Cart

                        </button>


                        <button
                            class="remove-btn"
                            onclick="
                                removeFromWishlist(
                                    ${item.id}
                                )
                            "
                        >

                            <i
                                class="fa-solid fa-trash"
                            ></i>

                            Remove

                        </button>

                    </div>

                </div>

            `;

        }
    );

}


displayWishlist();


// =====================================================
//                    CHECKOUT PAGE
// =====================================================

async function displayCheckout() {

    const container =
        document.getElementById(
            "checkoutProducts"
        );

    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );


    if (
        !container ||
        !totalElement
    ) {
        return;
    }


    const cart =
        getCart();

    if (window.productsReady) {
        await window.productsReady;
    }


    if (
        cart.length ===
        0
    ) {

        const emptyCartOrderButton =
            document.getElementById("placeOrderBtn");

        if (emptyCartOrderButton) {
            emptyCartOrderButton.disabled = true;
            emptyCartOrderButton.setAttribute("aria-disabled", "true");
        }

        container.innerHTML = `

            <div class="empty-checkout">

                <i
                    class="fa-solid fa-cart-shopping"
                ></i>

                <h3>
                    \u0627\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063a\u0629
                </h3>

                <p>
                    \u0623\u0636\u0641 \u0628\u0639\u0636 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0637\u0644\u0628\u0643.
                </p>

                <a href="products.html">
                    \u0645\u0648\u0627\u0635\u0644\u0629 \u0627\u0644\u062a\u0633\u0648\u0642
                </a>

            </div>

        `;


        totalElement.textContent =
            formatPrice(0);


        return;

    }


    container.innerHTML =
        "";

    let total = 0;


    cart.forEach(
        item => {

            const currentProduct =
                (Array.isArray(window.products) ? window.products : [])
                    .find(productItem =>
                        Number(productItem.id) === Number(item.id)
                    );

            const displayItem =
                currentProduct || item;

            const price =
                normalizePrice(
                    displayItem.price
                );


            const itemTotal =
                price *
                Number(item.quantity);


            total +=
                itemTotal;


            container.innerHTML += `

                <div
                    class="checkout-product"
                >

                    <img
                            src="${escapeHTML(displayItem.image || "")}"
                            alt="${escapeHTML(displayItem.name || "")}"
                    >


                    <div
                        class="checkout-product-info"
                    >

                        <h3>
                            ${escapeHTML(displayItem.name)}
                        </h3>

                        <p>
                            Quantity:
                            ${item.quantity}
                        </p>

                        <strong>
                            ${formatPrice(itemTotal)}
                        </strong>

                    </div>

                </div>

            `;

        }
    );


    totalElement.textContent =
        formatPrice(total);

}


displayCheckout();


// =====================================================
//                  PLACE ORDER - SUPABASE
// =====================================================

let placeOrderInProgress = false;

async function placeOrder() {

    if (placeOrderInProgress) {
        return;
    }

    const cart =
        getCart();


    if (
        cart.length ===
        0
    ) {

        alert(
            "السلة فارغة."
        );

        return;

    }

    placeOrderInProgress = true;


    // =================================================
    //                 GET USER SESSION
    // =================================================

    const {
        data: sessionData,
        error: sessionError
    } =
        await  window.supabaseClient.auth.getSession();


    if (sessionError) {

        console.error(
            "Session error:",
            sessionError
        );

        alert(
            "تعذر التحقق من تسجيل الدخول."
        );

        placeOrderInProgress = false;

        return;

    }


    const session =
        sessionData.session;


    if (
        !session ||
        !session.user
    ) {

        alert(
            "المرجو تسجيل الدخول أولاً لإتمام الطلب."
        );

        window.location.href =
            "login.html";

        placeOrderInProgress = false;

        return;

    }


    // =================================================
    //             CUSTOMER INFORMATION
    // =================================================

    const nameElement =
        document.getElementById(
            "customerName"
        );

    const phoneElement =
        document.getElementById(
            "customerPhone"
        );

    const emailElement =
        document.getElementById(
            "customerEmail"
        );

    const cityElement =
        document.getElementById(
            "customerCity"
        );

    const addressElement =
        document.getElementById(
            "customerAddress"
        );


    const name =
        nameElement
            ? nameElement.value.trim()
            : "";


    const phone =
        phoneElement
            ? phoneElement.value.trim()
            : "";


    const email =
        emailElement
            ? emailElement.value.trim() || session.user.email || ""
            : (
                session.user.email ||
                ""
            );


    const city =
        cityElement
            ? cityElement.value.trim()
            : "";


    const address =
        addressElement
            ? addressElement.value.trim()
            : "";


    // =================================================
    //                    VALIDATION
    // =================================================

    const errorBox =
        document.getElementById(
            "checkoutError"
        );


    if (
        !name ||
        !phone ||
        !city ||
        !address
    ) {

        if (errorBox) {

            errorBox.innerHTML = `

                <i
                    class="fa-solid fa-circle-exclamation"
                ></i>

                <span>
                    المرجو إكمال جميع المعلومات المطلوبة.
                </span>

            `;

            errorBox.classList.add(
                "show"
            );

        }

        placeOrderInProgress = false;

        return;

    }

    const availableCartOrderButton =
        document.getElementById("placeOrderBtn");

    if (availableCartOrderButton) {
        availableCartOrderButton.disabled = false;
        availableCartOrderButton.removeAttribute("aria-disabled");
    }

    const selectedPaymentMethod =
        document.querySelector('input[name="paymentMethod"]:checked')?.value || "";

    if (selectedPaymentMethod !== "cash") {
        if (errorBox) {
            errorBox.innerHTML = `
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>طريقة الدفع المتاحة حاليًا هي الدفع عند الاستلام فقط.</span>
            `;
            errorBox.classList.add("show");
        }
        placeOrderInProgress = false;
        return;
    }


    if (errorBox) {

        errorBox.classList.remove(
            "show"
        );

        errorBox.innerHTML =
            "";

    }


    // =================================================
    //                     BUTTON
    // =================================================

    const placeOrderBtn =
        document.getElementById(
            "placeOrderBtn"
        );


    if (placeOrderBtn) {

        placeOrderBtn.disabled =
            true;

        placeOrderBtn.innerHTML = `

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            جاري تأكيد الطلب...

        `;

    }


    try {

        if (window.productsReady) {
            await window.productsReady;
        }

        const currentProducts =
            Array.isArray(window.products)
                ? window.products
                : [];

        const items = cart.map(item => {

            const currentProduct = currentProducts.find(productItem =>
                Number(productItem.id) === Number(item.id)
            );
            const quantity = Number(item.quantity);

            if (!currentProduct || !Number.isInteger(quantity) || quantity < 1) {
                throw new Error("Invalid product or quantity in cart.");
            }

            return {
                product_id: currentProduct.id,
                quantity
            };
        });

        // Prices, availability, stock deduction, and duplicate prevention must
        // happen in Supabase, never in browser JavaScript.
        const clientOrderId = getCheckoutIdempotencyKey();

        const {
            data: createdOrder,
            error: orderError
        } = await window.supabaseClient
            .rpc("create_checkout_order", {
                p_items: items,
                p_customer_name: name,
                p_customer_phone: phone,
                p_customer_email: email,
                p_customer_city: city,
                p_customer_address: address,
                p_payment_method: selectedPaymentMethod,
                p_client_order_id: clientOrderId
            })
            .single();

        if (orderError || !createdOrder) {
            throw orderError || new Error("Order was not created.");
        }

        const order = {
            ...createdOrder,
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            customer_city: city,
            customer_address: address,
            total: Number(createdOrder.total)
        };

        const total = Number(order.total.toFixed(2));


        // =================================================
        //              SAVE LAST ORDER
        // =================================================

        const lastOrder = {

            id:
                order.id,

            orderNumber:
                order.order_number,

            customer: {

                name:
                    order.customer_name,

                phone:
                    order.customer_phone,

                email:
                    order.customer_email,

                city:
                    order.customer_city,

                address:
                    order.customer_address

            },

            products:
                cart,

            total:
                total,

            date:
                order.created_at

        };


        localStorage.setItem(
            "lastOrder",
            JSON.stringify(
                lastOrder
            )
        );


        // =================================================
        //                  CLEAR CART
        // =================================================

        localStorage.removeItem(
            "cart"
        );

        localStorage.removeItem(
            "checkoutIdempotencyKey"
        );

        updateCartCounter();


        // =================================================
        //                  SUCCESS PAGE
        // =================================================

        window.location.href =
            "order-success.html";


    } catch (error) {

        console.error(
            "Place order error:",
            error
        );


        if (errorBox) {

            errorBox.innerHTML = `

                <i
                    class="fa-solid fa-circle-exclamation"
                ></i>

                <span>
                    وقع خطأ أثناء تأكيد الطلب.
                    المرجو المحاولة مرة أخرى.
                </span>

            `;

            errorBox.classList.add(
                "show"
            );

        }


        if (placeOrderBtn) {

            placeOrderBtn.disabled =
                false;

            placeOrderBtn.innerHTML = `

                <i
                    class="fa-solid fa-check"
                ></i>

                تأكيد الطلب

            `;

        }

        placeOrderInProgress = false;

    }

}


// =====================================================
//              PLACE ORDER BUTTON
// =====================================================

const placeOrderBtn =
    document.getElementById(
        "placeOrderBtn"
    );


if (placeOrderBtn) {

    placeOrderBtn.addEventListener(
        "click",
        placeOrder
    );

}


// =====================================================
//              ORDER SUCCESS INFORMATION
// =====================================================

function displayOrderSuccess() {

    const orderData =
        localStorage.getItem(
            "lastOrder"
        );


    if (!orderData) {
        return;
    }


    let order;

    try {

        order = JSON.parse(orderData);

    } catch (error) {

        console.warn("Invalid last order data. Clearing it.", error);
        localStorage.removeItem("lastOrder");

        return;

    }


    const orderNumberElement =
        document.getElementById(
            "successOrderNumber"
        );

    const productCountElement =
        document.getElementById(
            "successProductCount"
        );

    const totalElement =
        document.getElementById(
            "successOrderTotal"
        );

    const dateElement =
        document.getElementById(
            "successOrderDate"
        );


    if (
        !orderNumberElement ||
        !productCountElement ||
        !totalElement ||
        !dateElement
    ) {

        return;

    }


    orderNumberElement.textContent =
        `#${order.orderNumber}`;


    let productCount = 0;


    const products =
        Array.isArray(order.products)
            ? order.products
            : [];

    products.forEach(
        item => {

            productCount +=
                Number(
                    item.quantity
                ) || 0;

        }
    );


    productCountElement.textContent =
        productCount;


    totalElement.textContent =
        formatPrice(order.total);


    const orderDate =
        new Date(
            order.date
        );


    dateElement.textContent =
        orderDate.toLocaleDateString(
            "en-GB"
        );

}


if (
    document.getElementById(
        "successOrderNumber"
    )
) {

    displayOrderSuccess();

}


// =====================================================
//   LOGIN MODAL
//   Authentication is handled by auth.js / Supabase
// =====================================================

function initLoginModal() {

    const loginModal =
        document.getElementById(
            "loginModal"
        );

    const closeLogin =
        document.getElementById(
            "closeLogin"
        );

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const loginMessage =
        document.getElementById(
            "loginMessage"
        );

    const togglePassword =
        document.getElementById(
            "togglePassword"
        );

    const loginPasswordInput =
        document.getElementById(
            "loginPassword"
        );

    const registerLink =
        document.getElementById(
            "registerLink"
        );


    if (
        closeLogin &&
        loginModal
    ) {

        closeLogin.addEventListener(
            "click",
            () => {

                loginModal.classList.remove(
                    "active"
                );

            }
        );

    }


    if (loginModal) {

        loginModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    loginModal
                ) {

                    loginModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (
        togglePassword &&
        loginPasswordInput
    ) {

        togglePassword.addEventListener(
            "click",
            () => {

                const isHidden =
                    loginPasswordInput.type ===
                    "password";


                loginPasswordInput.type =
                    isHidden
                        ? "text"
                        : "password";


                const icon =
                    togglePassword.querySelector(
                        "i"
                    );


                if (icon) {

                    icon.classList.toggle(
                        "fa-eye"
                    );

                    icon.classList.toggle(
                        "fa-eye-slash"
                    );

                }

            }
        );

    }


    // تسجيل الدخول الحقيقي موجود في auth.js
    // لا يوجد هنا localStorage fake login.


    if (registerLink) {

        registerLink.addEventListener(
            "click",
            event => {

                event.preventDefault();

                window.location.href =
                    "register.html";

            }
        );

    }

}


function initMobileMenu() {

    const navbar =
        document.querySelector(".navbar");

    const navLinks =
        document.querySelector(".nav-links");

    if (!navbar || !navLinks || navbar.querySelector(".mobile-menu-btn")) {
        return;
    }

    const menuButton =
        document.createElement("button");

    menuButton.type = "button";
    menuButton.className = "mobile-menu-btn";
    menuButton.setAttribute("aria-label", "فتح القائمة");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';

    menuButton.addEventListener("click", () => {

        const isOpen =
            navLinks.classList.toggle("is-open");

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuButton.setAttribute(
            "aria-label",
            isOpen ? "إغلاق القائمة" : "فتح القائمة"
        );

        menuButton.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';

    });

    navbar.insertBefore(menuButton, navLinks);

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("is-open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "فتح القائمة");
            menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });

}


function initActiveNavigation() {

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav-links a").forEach(link => {

        const linkPage =
            (link.getAttribute("href") || "").split("?")[0];

        const isCurrent =
            linkPage === currentPage ||
            (currentPage === "index.html" && linkPage === "");

        link.classList.toggle("active", isCurrent);

        if (isCurrent) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }

    });

}


function initNewsletter() {

    const form =
        document.getElementById("newsletterForm");

    const emailInput =
        document.getElementById("newsletterEmail");

    const message =
        document.getElementById("newsletterMessage");

    if (!form || !emailInput || !message) return;

    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const normalizedEmail = emailInput.value.trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!normalizedEmail || !emailPattern.test(normalizedEmail) || !emailInput.checkValidity()) {
            message.textContent = "المرجو إدخال بريد إلكتروني صحيح.";
            return;
        }

        const originalButtonText = submitButton?.textContent || "سجّل الآن";
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "جاري الاشتراك...";
        }
        message.textContent = "جاري حفظ الاشتراك...";

        try {

            const { error } = await window.supabaseClient
                .from("newsletter_subscribers")
                .insert({ email: normalizedEmail });

            if (error) throw error;

            message.textContent = "تم الاشتراك بنجاح! سنتواصل معك بآخر المنتجات والعروض.";
            form.reset();

        } catch (error) {

            console.error("Newsletter subscription error:", error);
            const errorText = String(error?.code || "") + " " + String(error?.message || "");
            message.textContent = /23505|duplicate|unique/i.test(errorText)
                ? "هذا البريد الإلكتروني مشترك بالفعل."
                : "تعذر حفظ الاشتراك حاليًا. حاول لاحقًا.";

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }

        }

    });

}


initMobileMenu();
initActiveNavigation();
initNewsletter();
loadCurrentProduct();
// =====================================================
//                  PRODUCT REVIEWS
// =====================================================

let selectedProductReviewRating = 0;
let productReviewPurchase = null;
let productReviewUser = null;

function getProductReviewElements() {
    return {
        form: document.getElementById("productReviewForm"),
        state: document.getElementById("reviewFormState"),
        message: document.getElementById("productReviewMessage"),
        comment: document.getElementById("productReviewComment"),
        submit: document.getElementById("productReviewSubmit"),
        picker: document.getElementById("reviewStarPicker"),
        list: document.getElementById("productReviewsList"),
        averageStars: document.getElementById("reviewsAverageStars"),
        averageScore: document.getElementById("reviewsAverageScore"),
        count: document.getElementById("reviewsCount")
    };
}

function setProductReviewMessage(message, type = "") {
    const { message: element } = getProductReviewElements();
    if (!element) return;
    element.textContent = message;
    element.className = `product-review-message${type ? ` ${type}` : ""}`;
}

function renderReviewStars(rating) {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

function renderRealProductRating(approvedReviews, ownReviews = []) {
    const productRating = document.getElementById("productRating");
    if (!productRating) return;

    const reviews = Array.isArray(approvedReviews) ? approvedReviews : [];
    const count = reviews.length;
    const average = count > 0
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count
        : 0;

    productRating.classList.add("real-product-rating");
    const hasPendingReview = ownReviews.some(review => review.status === "pending");
    const pendingBadge = hasPendingReview
        ? '<span class="real-product-rating-pending">لديك تقييم قيد المراجعة</span>'
        : "";

    productRating.innerHTML = count > 0
        ? `
            <span class="real-product-rating-stars" aria-label="${average.toFixed(1)} من 5 نجوم">${renderReviewStars(Math.round(average))}</span>
            <span class="real-product-rating-score">${average.toFixed(1)}</span>
            <span class="real-product-rating-count">(${count} تقييم)</span>
            ${pendingBadge}
        `
        : `
            <span class="real-product-rating-stars empty" aria-label="لا توجد تقييمات">☆☆☆☆☆</span>
            <span class="real-product-rating-empty">لا توجد تقييمات معتمدة بعد</span>
            ${pendingBadge}
        `;
}

function formatReviewDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("ar-MA", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function getProductReviewCacheKey(userId, currentProductId) {
    return `sefrou-review:${String(userId)}:${String(currentProductId)}`;
}

function cacheProductReview(userId, currentProductId, review) {
    if (!userId || !currentProductId || !review?.id) return;
    try {
        sessionStorage.setItem(
            getProductReviewCacheKey(userId, currentProductId),
            JSON.stringify(review)
        );
    } catch (error) {
        console.warn("PRODUCT REVIEWS: Could not cache submitted review:", error);
    }
}

function getCachedProductReview(userId, currentProductId) {
    if (!userId || !currentProductId) return null;
    try {
        const value = sessionStorage.getItem(
            getProductReviewCacheKey(userId, currentProductId)
        );
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.warn("PRODUCT REVIEWS: Could not read cached review:", error);
        return null;
    }
}

function setReviewPickerValue(rating) {
    selectedProductReviewRating = Number(rating) || 0;
    document.querySelectorAll("[data-review-rating]").forEach(button => {
        const buttonRating = Number(button.dataset.reviewRating);
        const active = buttonRating <= selectedProductReviewRating;
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-checked", buttonRating === selectedProductReviewRating ? "true" : "false");
    });
}

function setupProductReviewPicker() {
    const picker = document.getElementById("reviewStarPicker");
    if (!picker || picker.dataset.ready === "true") return;

    picker.dataset.ready = "true";
    picker.addEventListener("click", event => {
        const button = event.target.closest("[data-review-rating]");
        if (button) setReviewPickerValue(button.dataset.reviewRating);
    });
}

function renderProductReviews(reviews) {
    const elements = getProductReviewElements();
    const approvedReviews = reviews.filter(review => review.status === "approved");
    const total = approvedReviews.length;
    const average = total > 0
        ? approvedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
        : 0;

    const ownReviews = productReviewUser
        ? reviews.filter(review => review.user_id === productReviewUser.id)
        : [];
    renderRealProductRating(approvedReviews, ownReviews);

    if (elements.averageStars) {
        elements.averageStars.textContent = total > 0 ? renderReviewStars(Math.round(average)) : "—";
    }
    if (elements.averageScore) {
        elements.averageScore.textContent = total > 0 ? average.toFixed(1) : "لا توجد تقييمات معتمدة بعد";
    }
    if (elements.count) {
        elements.count.textContent = total > 0 ? `${total} تقييم` : "0 تقييمات معتمدة";
    }
    if (!elements.list) return;

    if (reviews.length === 0) {
        elements.list.innerHTML = '<p class="reviews-empty">لا توجد تقييمات بعد</p>';
        return;
    }

    elements.list.innerHTML = reviews.map(review => {
        const isApproved = review.status === "approved";
        const statusText = isApproved
                ? "مشتري موثّق"
            : review.status === "pending"
                ? "تقييمك قيد المراجعة"
                : "لم تتم الموافقة على هذا التقييم";

        return `
            <article class="product-review-card${isApproved ? "" : " review-private"}">
                <div class="product-review-card-top">
                    <span class="product-review-stars" aria-label="${Number(review.rating)} من 5 نجوم">${renderReviewStars(review.rating)}</span>
                    <time datetime="${escapeHTML(review.created_at || "")}">${escapeHTML(formatReviewDate(review.created_at))}</time>
                </div>
                <p class="product-review-comment">${escapeHTML(review.comment || "")}</p>
                <span class="product-review-status">${statusText}</span>
            </article>
        `;
    }).join("");
}

async function loadProductReviews() {
    const elements = getProductReviewElements();
    if (!elements.list || !Number.isFinite(productId) || !window.supabaseClient) return;

    setupProductReviewPicker();
    elements.list.innerHTML = '<p class="reviews-loading">جاري تحميل التقييمات...</p>';

    try {
        const { data: approvedReviews, error: approvedError } = await window.supabaseClient
            .from("product_reviews")
            .select("id, product_id, user_id, order_id, order_item_id, rating, comment, status, created_at, updated_at")
            .eq("product_id", productId)
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (approvedError) throw approvedError;

        const { data: userData } = await window.supabaseClient.auth.getUser();
        productReviewUser = userData?.user || null;
        let reviews = Array.isArray(approvedReviews) ? [...approvedReviews] : [];
        let ownReviews = [];

        if (productReviewUser) {
            const { data, error } = await window.supabaseClient
                .from("product_reviews")
                .select("id, product_id, user_id, order_id, order_item_id, rating, comment, status, created_at, updated_at")
                .eq("product_id", productId)
                .eq("user_id", productReviewUser.id)
                .order("created_at", { ascending: false });

            if (!error && Array.isArray(data)) {
                ownReviews = data;
                const reviewMap = new Map(reviews.map(review => [review.id, review]));
                ownReviews.forEach(review => reviewMap.set(review.id, review));
                reviews = [...reviewMap.values()].sort((first, second) =>
                    new Date(second.created_at) - new Date(first.created_at)
                );
            } else if (error) {
                console.warn("PRODUCT REVIEWS: Own review read unavailable:", error.message);
            }

            if (ownReviews.length === 0) {
                const cachedReview = getCachedProductReview(productReviewUser.id, productId);
                if (cachedReview && !reviews.some(review => review.id === cachedReview.id)) {
                    ownReviews = [cachedReview];
                    reviews.push(cachedReview);
                }
            }
        }

        renderProductReviews(reviews);
        await prepareProductReviewForm(ownReviews);
    } catch (error) {
        console.error("PRODUCT REVIEWS: Load error:", error);
        elements.list.innerHTML = '<p class="reviews-error">تعذر تحميل التقييمات حالياً.</p>';
        if (elements.state) elements.state.textContent = "تعذر تحميل نظام التقييمات حالياً.";
    }
}

async function prepareProductReviewForm(ownReviews = []) {
    const elements = getProductReviewElements();
    if (!elements.form || !elements.state) return;

    elements.form.hidden = true;
    elements.state.className = "review-form-state";

    if (!productReviewUser) {
        elements.state.innerHTML = 'يمكنك تقييم المنتج بعد <a href="login.html">تسجيل الدخول</a>.';
        return;
    }

    if (ownReviews.length > 0) {
        const latestReview = ownReviews[0];
        const statusText = latestReview.status === "approved"
            ? "تم اعتماد تقييمك لهذا المنتج."
            : latestReview.status === "pending"
                ? "تقييمك قيد المراجعة."
                : "تم رفض تقييمك لهذا المنتج.";
        elements.state.textContent = statusText;
        elements.state.classList.add(latestReview.status === "approved" ? "success" : "notice");
        return;
    }

    const { data: orders, error } = await window.supabaseClient
        .from("orders")
        .select("id, status, order_items(id, product_id)")
        .eq("user_id", productReviewUser.id)
        .eq("status", "delivered");

    if (error) {
        console.error("PRODUCT REVIEWS: Purchase check error:", error);
        elements.state.textContent = "تعذر التحقق من أهلية التقييم حالياً.";
        return;
    }

    productReviewPurchase = (orders || []).flatMap(order =>
        (order.order_items || []).map(item => ({
            orderId: order.id,
            orderItemId: item.id,
            productId: item.product_id
        }))
    ).find(item => Number(item.productId) === Number(productId)) || null;

    if (!productReviewPurchase) {
        elements.state.textContent = "يمكنك تقييم هذا المنتج بعد شرائه وتوصّل طلبك.";
        return;
    }

    elements.state.textContent = "تم التحقق من عملية الشراء. شاركنا رأيك.";
    elements.state.classList.add("success");
    elements.form.hidden = false;
    setupProductReviewForm();
}

function setupProductReviewForm() {
    const form = document.getElementById("productReviewForm");
    if (!form || form.dataset.ready === "true") return;
    form.dataset.ready = "true";

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const elements = getProductReviewElements();
        const comment = elements.comment?.value.trim() || "";

        if (!selectedProductReviewRating) {
            setProductReviewMessage("المرجو اختيار عدد النجوم أولاً.", "error");
            return;
        }
        if (!comment) {
            setProductReviewMessage("المرجو كتابة تعليق قبل الإرسال.", "error");
            return;
        }
        if (!productReviewPurchase) {
            setProductReviewMessage("لا يمكنك تقييم هذا المنتج قبل إتمام الشراء والتوصيل.", "error");
            return;
        }

        elements.submit.disabled = true;
        elements.submit.textContent = "جاري إرسال التقييم...";
        setProductReviewMessage("");

        try {
            const { data, error } = await window.supabaseClient.rpc("create_product_review", {
                p_product_id: productReviewPurchase.productId,
                p_order_id: productReviewPurchase.orderId,
                p_order_item_id: productReviewPurchase.orderItemId,
                p_rating: selectedProductReviewRating,
                p_comment: comment
            });

            if (error) throw error;

            const createdReview = Array.isArray(data) ? data[0] : data;
            cacheProductReview(productReviewUser?.id, productId, createdReview);
            const statusText = createdReview?.status === "pending"
                ? "تم إرسال تقييمك بنجاح، وهو الآن في انتظار المراجعة."
                : "تم إرسال تقييمك بنجاح.";
            setProductReviewMessage(statusText, "success");
            form.reset();
            setReviewPickerValue(0);
            await loadProductReviews();
        } catch (error) {
            console.error("PRODUCT REVIEWS: Submit error:", error);
            const errorText = String(error?.message || "").toLowerCase();
            setProductReviewMessage(
                errorText.includes("already reviewed") || errorText.includes("duplicate")
                    ? "سبق لك تقييم هذا المنتج."
                    : error?.message || "تعذر إرسال التقييم حالياً.",
                "error"
            );
        } finally {
            elements.submit.disabled = false;
            elements.submit.textContent = "إرسال التقييم";
        }
    });
}
