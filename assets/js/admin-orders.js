// =====================================================
//                  SEFROU STORE
//                  ADMIN ORDERS
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAdminOrders();
});


// =====================================================
//                  GLOBAL DATA
// =====================================================

let allAdminOrders = [];
let isAdminOrdersLoading = false;


// =====================================================
//              INITIALIZE ADMIN PAGE
// =====================================================

async function initializeAdminOrders() {

    const ordersContainer =
        document.getElementById("adminOrders");

    if (!ordersContainer) {
        return;
    }

    try {

        // =============================================
        // CHECK SUPABASE
        // =============================================

        if (!window.supabaseClient) {
            throw new Error(
                "Supabase client is not available."
            );
        }


        // =============================================
        // GET CURRENT USER
        // =============================================

        const {
            data: userData,
            error: userError
        } =
            await window.supabaseClient.auth.getUser();


        if (
            userError ||
            !userData?.user
        ) {

            showAdminAccessDenied(
                "خاصك تسجل الدخول أولاً."
            );

            return;
        }


        const user = userData.user;


        // =============================================
        // CHECK ADMIN ROLE
        // =============================================

        const {
            data: profile,
            error: profileError
        } = await window.supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError || profile?.role !== "admin") {

            showAdminAccessDenied(
                "ما عندكش الصلاحية للدخول إلى لوحة الإدارة."
            );

            return;
        }


        console.log(
            "ADMIN ORDERS: Admin verified:",
            user.id
        );


        // =============================================
        // LOAD ORDERS
        // =============================================

        await loadAdminOrders();


        // =============================================
        // SETUP SEARCH
        // =============================================

        setupAdminSearch();


        // =============================================
        // SETUP FILTER
        // =============================================

        setupAdminFilter();


        // =============================================
        // SETUP STATUS CONTROLS
        // =============================================

        setupAdminStatusControls();

        setupAdminRefresh();
        setupAdminOrderDetails();

    } catch (error) {

        console.error(
            "ADMIN ORDERS: Initialization error:",
            error
        );

        showAdminAccessDenied(
            "وقع مشكل أثناء فتح لوحة الإدارة."
        );
    }
}


// =====================================================
//                  LOAD ORDERS
// =====================================================

async function loadAdminOrders() {

    const ordersContainer =
        document.getElementById("adminOrders");


    if (!ordersContainer) {
        return false;
    }

    isAdminOrdersLoading = true;
    ordersContainer.setAttribute("aria-busy", "true");


    ordersContainer.innerHTML = `
        <div class="admin-orders-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            جاري تحميل الطلبات...

        </div>
    `;


    try {

        const {
            data: orders,
            error
        } =
            await window.supabaseClient
                .from("orders")
                .select(`
                    id,
                    user_id,
                    order_number,
                    customer_name,
                    customer_phone,
                    customer_email,
                    customer_city,
                    customer_address,
                    payment_method,
                    status,
                    total,
                    created_at,

                    order_items (
                        id,
                        product_id,
                        product_name,
                        product_image,
                        price,
                        quantity,
                        subtotal,
                        created_at
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "ADMIN ORDERS: Database error:",
                error
            );

            throw error;
        }


        allAdminOrders =
            Array.isArray(orders)
                ? orders
                : [];


        console.log(
            "ADMIN ORDERS: Loaded:",
            allAdminOrders
        );


        updateAdminStats(
            allAdminOrders
        );


        renderAdminOrders(
            allAdminOrders
        );

        return true;

    } catch (error) {

        console.error(
            "ADMIN ORDERS: Load error:",
            error
        );


        ordersContainer.removeAttribute("aria-busy");
        ordersContainer.innerHTML = `
            <div class="admin-orders-empty">

                <i class="fa-solid fa-circle-exclamation"></i>

                <h3>
                    تعذر تحميل الطلبات
                </h3>

                <p>
                    وقع مشكل أثناء جلب الطلبات من قاعدة البيانات.
                </p>

            </div>
        `;

        return false;

    } finally {

        isAdminOrdersLoading = false;
    }
}


// =====================================================
//                  RENDER ORDERS
// =====================================================

function renderAdminOrders(orders, isFilteredResult = false) {

    const container =
        document.getElementById("adminOrders");


    if (!container) {
        return;
    }

    container.removeAttribute("aria-busy");

    if (!Array.isArray(orders) || orders.length === 0) {
        renderAdminOrdersEmpty(container, isFilteredResult);
        return;
    }


    if (
        !Array.isArray(orders) ||
        orders.length === 0
    ) {

        container.innerHTML = `
            <div class="admin-orders-empty">

                <i class="fa-solid fa-box-open"></i>

                <h3>
                    لا توجد طلبات
                </h3>

                <p>
                    ما كاين حتى طلب مطابق للبحث أو الفلتر.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        orders
            .map(order =>
                createAdminOrderHTML(order)
            )
            .join("");
}


// =====================================================
//              CREATE ORDER HTML
// =====================================================

function createAdminOrderHTML(order) {

    const status =
        getAdminOrderStatus(
            order?.status
        );


    const date =
        formatAdminOrderDate(
            order?.created_at
        );


    const items =
        Array.isArray(order?.order_items)
            ? order.order_items
            : [];


    let productsHTML = "";


    items.forEach(item => {

        const productName =
            item?.product_name ||
            "منتج";


        const image =
            item?.product_image ||
            "";


        const quantity =
            Number(item?.quantity) || 0;


        const price =
            Number(item?.price) || 0;


        const subtotalValue =
            Number(item?.subtotal);


        const subtotal =
            Number.isFinite(subtotalValue)
                ? subtotalValue
                : price * quantity;


        productsHTML += `
            <div class="admin-order-product">

                <div class="admin-product-image">

                    ${
                        image
                            ? `
                                <img
                                    src="${escapeAdminHTML(image)}"
                                    alt="${escapeAdminHTML(productName)}"
                                    loading="lazy"
                                >
                            `
                            : `
                                <i class="fa-solid fa-image"></i>
                            `
                    }

                </div>


                <div class="admin-product-info">

                    <h4>
                        ${escapeAdminHTML(productName)}
                    </h4>

                    <p>
                        الكمية:
                        ${quantity}
                    </p>

                </div>


                <div class="admin-product-price">
                    ${subtotal.toFixed(2)} DH
                </div>

            </div>
        `;
    });


    if (!productsHTML) {

        productsHTML = `
            <div class="admin-orders-empty">

                <p>
                    لا توجد منتجات في هذا الطلب.
                </p>

            </div>
        `;
    }


    const total =
        Number(order?.total) || 0;


    const payment =
        getAdminPaymentMethod(
            order?.payment_method
        );


    const currentStatus =
        String(
            order?.status || "pending"
        )
            .trim()
            .toLowerCase();


    return `
        <article
            class="admin-order-card"
            data-order-id="${escapeAdminHTML(order?.id || "")}"
        >

            <!-- ================= HEADER ================= -->

            <div class="admin-order-header">

                <div class="admin-order-number">

                    <span class="admin-order-label">
                        رقم الطلب
                    </span>

                    <strong>
                        #${escapeAdminHTML(
                            order?.order_number || ""
                        )}
                    </strong>

                    <span class="admin-order-label">
                        ${date}
                    </span>

                </div>


                <span
                    class="admin-order-status ${status.className}"
                >
                    ${status.text}
                </span>

            </div>


            <!-- ================= CUSTOMER ================= -->

            <div class="admin-order-customer">

                <div class="admin-customer-item">

                    <i class="fa-solid fa-user"></i>

                    <span>
                        ${escapeAdminHTML(
                            order?.customer_name ||
                            "غير مضاف"
                        )}
                    </span>

                </div>


                <div class="admin-customer-item">

                    <i class="fa-solid fa-phone"></i>

                    <span>
                        ${escapeAdminHTML(
                            order?.customer_phone ||
                            "غير مضاف"
                        )}
                    </span>

                </div>


                <div class="admin-customer-item">

                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        ${escapeAdminHTML(
                            order?.customer_city ||
                            "غير مضاف"
                        )}
                    </span>

                </div>

            </div>


            <!-- ================= PRODUCTS ================= -->

            <div class="admin-order-products">

                ${productsHTML}

            </div>


            <!-- ================= STATUS ACTIONS ================= -->

            <div class="admin-order-status-actions">

                <div class="admin-status-action-info">

                    <span>
                        تغيير حالة الطلب
                    </span>

                    <small>
                        الحالة الحالية:
                        ${status.text}
                    </small>

                </div>


                <select
                    class="admin-order-status-select"
                    data-order-status-select
                    data-order-id="${escapeAdminHTML(
                        order?.id || ""
                    )}"
                    aria-label="تغيير حالة الطلب"
                >

                    <option
                        value="pending"
                        ${
                            currentStatus === "pending"
                                ? "selected"
                                : ""
                        }
                    >
                        في انتظار التأكيد
                    </option>


                    <option
                        value="confirmed"
                        ${
                            currentStatus === "confirmed"
                                ? "selected"
                                : ""
                        }
                    >
                        تم تأكيد الطلب
                    </option>


                    <option
                        value="processing"
                        ${
                            currentStatus === "processing"
                                ? "selected"
                                : ""
                        }
                    >
                        جاري تجهيز الطلب
                    </option>


                    <option
                        value="shipped"
                        ${
                            currentStatus === "shipped"
                                ? "selected"
                                : ""
                        }
                    >
                        تم شحن الطلب
                    </option>


                    <option
                        value="delivered"
                        ${
                            currentStatus === "delivered"
                                ? "selected"
                                : ""
                        }
                    >
                        تم التوصيل
                    </option>


                    <option
                        value="cancelled"
                        ${
                            currentStatus === "cancelled"
                                ? "selected"
                                : ""
                        }
                    >
                        تم إلغاء الطلب
                    </option>

                </select>

            </div>


            <!-- ================= FOOTER ================= -->

            <div class="admin-order-footer">

                <div class="admin-payment">

                    <span>
                        طريقة الدفع
                    </span>

                    <strong>
                        ${payment}
                    </strong>

                </div>

                <button
                    type="button"
                    class="admin-order-details-btn"
                    data-view-order-id="${escapeAdminHTML(order?.id || "")}"
                >
                    <i class="fa-solid fa-receipt"></i>
                    تفاصيل الطلب
                </button>


                <div class="admin-total">

                    <span>
                        المجموع
                    </span>

                    <strong>
                        ${total.toFixed(2)} DH
                    </strong>

                </div>

            </div>


        </article>
    `;
}


// =====================================================
//              REFRESH + ORDER DETAILS
// =====================================================

function setupAdminRefresh() {

    const refreshButton =
        document.getElementById("adminOrdersRefresh");

    if (!refreshButton) return;

    refreshButton.addEventListener("click", async () => {

        if (isAdminOrdersLoading) return;

        const originalContent = refreshButton.innerHTML;

        refreshButton.disabled = true;
        refreshButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            \u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u062f\u064a\u062b...
        `;

        const didLoad = await loadAdminOrders();

        if (didLoad) {
            applyAdminFilters();
            showAdminStatusMessage("\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0628\u0646\u062c\u0627\u062d.", "success");
        } else {
            showAdminStatusMessage("\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0637\u0644\u0628\u0627\u062a. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.", "error");
        }

        refreshButton.disabled = false;
        refreshButton.innerHTML = originalContent;

    });

}


function setupAdminOrderDetails() {

    const ordersContainer =
        document.getElementById("adminOrders");

    const modal =
        document.getElementById("adminOrderDetailsModal");

    if (!ordersContainer || !modal) return;

    ordersContainer.addEventListener("click", event => {

        const button = event.target.closest("[data-view-order-id]");

        if (!button) return;

        const orderId = String(button.dataset.viewOrderId || "").trim();
        const order = allAdminOrders.find(item => String(item?.id || "") === orderId);

        if (order) openAdminOrderDetails(order);

    });

    modal.addEventListener("click", event => {

        if (event.target === modal || event.target.closest("[data-close-order-details]")) {
            closeAdminOrderDetails();
        }

    });

    document.addEventListener("keydown", event => {

        if (event.key === "Escape" && modal.classList.contains("is-open")) {
            closeAdminOrderDetails();
        }

    });

}


function openAdminOrderDetails(order) {

    const modal = document.getElementById("adminOrderDetailsModal");
    const subtitle = document.getElementById("adminOrderDetailsSubtitle");
    const content = document.getElementById("adminOrderDetailsContent");

    if (!modal || !subtitle || !content) return;

    const status = getAdminOrderStatus(order?.status);
    const total = Number(order?.total) || 0;
    const orderNumber = escapeAdminHTML(order?.order_number || "-");
    const date = formatAdminOrderDateTime(order?.created_at);
    const customerValue = value => escapeAdminHTML(value || "غير مضاف");
    const items = Array.isArray(order?.order_items) ? order.order_items : [];

    subtitle.textContent = `#${order?.order_number || "-"} · ${date}`;

    const itemsHTML = items.length > 0
        ? items.map(item => {

            const name = item?.product_name || "منتج";
            const image = item?.product_image || "";
            const quantity = Number(item?.quantity) || 0;
            const unitPrice = Number(item?.price) || 0;
            const subtotal = Number.isFinite(Number(item?.subtotal))
                ? Number(item.subtotal)
                : unitPrice * quantity;

            return `
                <article class="admin-details-product">
                    <div class="admin-details-product-image">
                        ${
                            image
                                ? `<img src="${escapeAdminHTML(image)}" alt="${escapeAdminHTML(name)}" loading="lazy">`
                                : '<i class="fa-solid fa-image"></i>'
                        }
                    </div>
                    <div>
                        <h4>${escapeAdminHTML(name)}</h4>
                        <p>الكمية: ${quantity} · سعر الوحدة: ${unitPrice.toFixed(2)} DH</p>
                    </div>
                    <strong class="admin-details-product-total">${subtotal.toFixed(2)} DH</strong>
                </article>
            `;
        }).join("")
        : `
            <div class="admin-orders-empty">
                <i class="fa-solid fa-box-open"></i>
                <p>لا توجد منتجات مسجلة في هذا الطلب.</p>
            </div>
        `;

    content.innerHTML = `
        <div class="admin-details-grid">
            <div class="admin-detail-item">
                <span>رقم الطلب</span>
                <strong>#${orderNumber}</strong>
            </div>
            <div class="admin-detail-item">
                <span>تاريخ الطلب</span>
                <strong>${escapeAdminHTML(date)}</strong>
            </div>
            <div class="admin-detail-item">
                <span>الحالة الحالية</span>
                <strong><em class="admin-order-status ${status.className}">${status.text}</em></strong>
            </div>
            <div class="admin-detail-item">
                <span>طريقة الدفع</span>
                <strong>${getAdminPaymentMethod(order?.payment_method)}</strong>
            </div>
            <div class="admin-detail-item">
                <span>اسم الزبون</span>
                <strong>${customerValue(order?.customer_name)}</strong>
            </div>
            <div class="admin-detail-item">
                <span>الهاتف</span>
                <strong>${customerValue(order?.customer_phone)}</strong>
            </div>
            <div class="admin-detail-item full-width">
                <span>البريد الإلكتروني</span>
                <strong>${customerValue(order?.customer_email)}</strong>
            </div>
            <div class="admin-detail-item">
                <span>المدينة</span>
                <strong>${customerValue(order?.customer_city)}</strong>
            </div>
            <div class="admin-detail-item full-width">
                <span>العنوان</span>
                <strong>${customerValue(order?.customer_address)}</strong>
            </div>
        </div>

        <h3 class="admin-details-section-title">منتجات الطلب</h3>
        <div class="admin-details-products">${itemsHTML}</div>

        <div class="admin-details-total">
            <span>المجموع النهائي</span>
            <strong>${total.toFixed(2)} DH</strong>
        </div>
    `;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

}


function closeAdminOrderDetails() {

    const modal = document.getElementById("adminOrderDetailsModal");

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

}


// =====================================================
//              STATUS CONTROLS
// =====================================================

function setupAdminStatusControls() {

    const container =
        document.getElementById("adminOrders");


    if (!container) {
        return;
    }


    container.addEventListener(
        "change",
        async event => {

            const select =
                event.target.closest(
                    "[data-order-status-select]"
                );


            if (!select) {
                return;
            }


            const orderId =
                String(
                    select.dataset.orderId || ""
                ).trim();


            const newStatus =
                String(
                    select.value || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                !orderId ||
                !newStatus
            ) {
                return;
            }


            const order =
                allAdminOrders.find(
                    item =>
                        String(
                            item?.id || ""
                        ) === orderId
                );


            if (!order) {
                return;
            }


            const oldStatus =
                String(
                    order?.status || "pending"
                )
                    .trim()
                    .toLowerCase();


            if (
                oldStatus === newStatus
            ) {
                return;
            }


            const statusInfo =
                getAdminOrderStatus(
                    newStatus
                );


            const orderNumber =
                order?.order_number || "";


            const confirmed =
                window.confirm(
                    `واش متأكد بغيتي تبدل حالة الطلب #${orderNumber} إلى "${statusInfo.text}"؟`
                );


            if (!confirmed) {

                select.value =
                    oldStatus;

                return;
            }


            await updateAdminOrderStatus(
                orderId,
                newStatus,
                oldStatus,
                select
            );
        }
    );
}


// =====================================================
//              UPDATE ORDER STATUS
// =====================================================

async function updateAdminOrderStatus(
    orderId,
    newStatus,
    oldStatus,
    select
) {

    if (!window.supabaseClient) {

        select.value =
            oldStatus;


        showAdminStatusMessage(
            "Supabase غير متوفر حالياً.",
            "error"
        );

        return;
    }


    select.disabled = true;

    select.classList.add(
        "is-updating"
    );


    try {

        const {
            error
        } = await window.supabaseClient
            .rpc("admin_update_order_status", {
                p_order_id: orderId,
                p_status: newStatus
            });


        if (error) {
            throw error;
        }


        await loadAdminOrders();


        showAdminStatusMessage(
            "تم تحديث حالة الطلب بنجاح.",
            "success"
        );


        console.log(
            "ADMIN ORDERS: Status updated:",
            {
                orderId,
                oldStatus,
                newStatus
            }
        );


    } catch (error) {

        console.error(
            "ADMIN ORDERS: Status update error:",
            error
        );


        select.value =
            oldStatus;


        showAdminStatusMessage(
            "ما قدرناش نحدثو حالة الطلب. تأكد من صلاحيات Supabase.",
            "error"
        );


    } finally {

        select.disabled = false;

        select.classList.remove(
            "is-updating"
        );
    }
}


// =====================================================
//              ADMIN STATUS MESSAGE
// =====================================================

function showAdminStatusMessage(
    message,
    type = "success"
) {

    let messageElement =
        document.getElementById(
            "adminStatusMessage"
        );


    if (!messageElement) {

        messageElement =
            document.createElement(
                "div"
            );


        messageElement.id =
            "adminStatusMessage";


        messageElement.className =
            "admin-status-message";


        document.body.appendChild(
            messageElement
        );
    }


    messageElement.textContent =
        message;


    messageElement.className =
        `admin-status-message ${type}`;


    requestAnimationFrame(() => {

        messageElement.classList.add(
            "show"
        );
    });


    clearTimeout(
        window.adminStatusMessageTimer
    );


    window.adminStatusMessageTimer =
        setTimeout(() => {

            messageElement.classList.remove(
                "show"
            );

        }, 3000);
}


// =====================================================
//                  SEARCH
// =====================================================

function setupAdminSearch() {

    const searchInput =
        document.getElementById(
            "adminOrdersSearch"
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        applyAdminFilters
    );
}


// =====================================================
//                  FILTER
// =====================================================

function setupAdminFilter() {

    const filter =
        document.getElementById(
            "adminOrdersFilter"
        );


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        applyAdminFilters
    );
}


// =====================================================
//              APPLY SEARCH + FILTER
// =====================================================

function applyAdminFilters() {

    const searchInput =
        document.getElementById(
            "adminOrdersSearch"
        );


    const filter =
        document.getElementById(
            "adminOrdersFilter"
        );


    const search =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const selectedStatus =
        String(
            filter?.value || "all"
        )
            .trim()
            .toLowerCase();


    const filtered =
        allAdminOrders.filter(
            order => {

                const searchableText = [

                    order?.order_number,

                    order?.customer_name,

                    order?.customer_phone,

                    order?.customer_email,

                    order?.customer_city,

                    order?.customer_address

                ]
                    .map(
                        value =>
                            String(
                                value || ""
                            ).toLowerCase()
                    )
                    .join(" ");


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const orderStatus =
                    String(
                        order?.status || ""
                    )
                        .trim()
                        .toLowerCase();


                const matchesStatus =
                    selectedStatus === "all" ||
                    orderStatus === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    renderAdminOrders(
        filtered,
        Boolean(search) || selectedStatus !== "all"
    );
}


// =====================================================
//                  STATISTICS
// =====================================================

function updateAdminStats(orders) {

    const safeOrders =
        Array.isArray(orders)
            ? orders
            : [];


    const totalOrders =
        safeOrders.length;


    const pendingOrders =
        safeOrders.filter(
            order =>
                String(
                    order?.status || ""
                )
                    .trim()
                    .toLowerCase()
                ===
                "pending"
        ).length;


    const deliveredOrders =
        safeOrders.filter(
            order =>
                String(
                    order?.status || ""
                )
                    .trim()
                    .toLowerCase()
                ===
                "delivered"
        ).length;


    const totalSales =
        safeOrders
            .filter(
                order =>
                    String(
                        order?.status || ""
                    )
                        .trim()
                        .toLowerCase()
                    !==
                    "cancelled"
            )
            .reduce(
                (
                    total,
                    order
                ) => {

                    const orderTotal =
                        Number(
                            order?.total
                        ) || 0;


                    return (
                        total +
                        orderTotal
                    );
                },
                0
            );


    const totalElement =
        document.getElementById(
            "totalOrdersCount"
        );


    const pendingElement =
        document.getElementById(
            "pendingOrdersCount"
        );


    const deliveredElement =
        document.getElementById(
            "deliveredOrdersCount"
        );


    const salesElement =
        document.getElementById(
            "totalSalesAmount"
        );


    if (totalElement) {

        totalElement.textContent =
            totalOrders;
    }


    if (pendingElement) {

        pendingElement.textContent =
            pendingOrders;
    }


    if (deliveredElement) {

        deliveredElement.textContent =
            deliveredOrders;
    }


    if (salesElement) {

        salesElement.textContent =
            `${totalSales.toFixed(2)} DH`;
    }
}


// =====================================================
//                  ORDER STATUS
// =====================================================

function getAdminOrderStatus(status) {

    const normalized =
        String(
            status || "pending"
        )
            .trim()
            .toLowerCase();


    switch (normalized) {

        case "pending":

            return {
                text: "في انتظار التأكيد",
                className: "status-pending"
            };


        case "confirmed":

            return {
                text: "تم تأكيد الطلب",
                className: "status-confirmed"
            };


        case "processing":

            return {
                text: "جاري تجهيز الطلب",
                className: "status-processing"
            };


        case "shipped":

            return {
                text: "تم شحن الطلب",
                className: "status-shipped"
            };


        case "delivered":

            return {
                text: "تم التوصيل",
                className: "status-delivered"
            };


        case "cancelled":

            return {
                text: "تم إلغاء الطلب",
                className: "status-cancelled"
            };


        default:

            return {
                text: "قيد المعالجة",
                className: "status-pending"
            };
    }
}


// =====================================================
//              PAYMENT METHOD
// =====================================================

function getAdminPaymentMethod(method) {

    const normalized =
        String(
            method || ""
        )
            .trim()
            .toLowerCase();


    switch (normalized) {

        case "cash":

        case "cod":

        case "cash_on_delivery":

            return "الدفع عند الاستلام";


        case "card":

            return "البطاقة البنكية";


        case "paypal":

            return "PayPal";


        default:

            return escapeAdminHTML(
                method ||
                "غير محددة"
            );
    }
}


// =====================================================
//                  DATE
// =====================================================

function formatAdminOrderDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";
    }


    return date.toLocaleDateString(
        "ar-MA",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


// =====================================================
//                  ESCAPE HTML
// =====================================================

function escapeAdminHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// =====================================================
//                ACCESS DENIED
// =====================================================

function showAdminAccessDenied(message) {

    const page =
        document.querySelector(
            ".admin-orders-page"
        );


    if (!page) {
        return;
    }


    page.innerHTML = `
        <div class="admin-access-denied">

            <i class="fa-solid fa-lock"></i>

            <h2>
                ممنوع الدخول
            </h2>

            <p>
                ${escapeAdminHTML(message)}
            </p>

        </div>
    `;
}


function formatAdminOrderDateTime(value) {

    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("ar-MA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}


function renderAdminOrdersEmpty(container, isFilteredResult) {

    const title = isFilteredResult
        ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629"
        : "\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u062d\u0627\u0644\u064a\u064b\u0627";

    const message = isFilteredResult
        ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0628\u062d\u062b \u0623\u0648 \u0627\u0644\u0641\u0644\u062a\u0631 \u0627\u0644\u062d\u0627\u0644\u064a."
        : "\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0645\u0633\u062c\u0644\u0629 \u062d\u0627\u0644\u064a\u064b\u0627. \u0633\u062a\u0638\u0647\u0631 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062c\u062f\u064a\u062f\u0629 \u0647\u0646\u0627 \u0641\u0648\u0631 \u0648\u0635\u0648\u0644\u0647\u0627.";

    container.innerHTML = `
        <div class="admin-orders-empty">
            <i class="fa-solid fa-box-open"></i>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;

}
