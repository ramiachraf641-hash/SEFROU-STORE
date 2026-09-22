// =====================================================
//                  SEFROU STORE
//                    MY ORDERS
// =====================================================

// معرف الطلب المختار حالياً للإلغاء
// (كيتعمر ملي المستخدم يضغط على "إلغاء الطلب")
let currentCancelOrderId = null;


document.addEventListener("DOMContentLoaded", () => {

    loadMyOrders();

    initCancelOrderModal();

});


// =====================================================
//                  LOAD MY ORDERS
// =====================================================

async function loadMyOrders() {

    const ordersContainer =
        document.getElementById("myOrders");

    // الصفحة الحالية ما فيهاش قسم الطلبات
    if (!ordersContainer) {
        return;
    }


    console.log("MY ORDERS: Loading...");


    // =================================================
    //              CHECK SUPABASE
    // =================================================

    if (!window.supabaseClient) {

        console.error(
            "MY ORDERS: Supabase client not available."
        );

        showOrdersError();

        return;
    }


    // =================================================
    //                    LOADING
    // =================================================

    ordersContainer.innerHTML = `
        <div class="orders-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <p>
                جاري تحميل طلباتك...
            </p>

        </div>
    `;


    try {

        // =================================================
        //                  GET SESSION
        // =================================================

        const {
            data: sessionData,
            error: sessionError
        } =
            await window.supabaseClient.auth.getSession();


        if (sessionError) {

            console.error(
                "MY ORDERS: Session error:",
                sessionError
            );

            showOrdersError();

            return;
        }


        const session =
            sessionData?.session;


        // =================================================
        //                NOT LOGGED IN
        // =================================================

        if (!session?.user) {

            ordersContainer.innerHTML = `
                <div class="orders-empty">

                    <i class="fa-solid fa-user-lock"></i>

                    <h3>
                        سجل الدخول أولاً
                    </h3>

                    <p>
                        خاصك تسجل الدخول باش تشوف طلباتك.
                    </p>

                    <a href="login.html">
                        تسجيل الدخول
                    </a>

                </div>
            `;

            return;
        }


        const userId =
            session.user.id;


        console.log(
            "MY ORDERS: User ID:",
            userId
        );


        // =================================================
        //                  LOAD ORDERS
        // =================================================

        const {
            data: orders,
            error: ordersError
        } =
            await window.supabaseClient

                .from("orders")

                .select(`
                    id,
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

                .eq(
                    "user_id",
                    userId
                )

                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        // =================================================
        //                  DATABASE ERROR
        // =================================================

        if (ordersError) {

            console.error(
                "MY ORDERS: Database error:",
                ordersError
            );

            showOrdersError();

            return;
        }


        console.log(
            "MY ORDERS: Loaded:",
            orders
        );


        // =================================================
        //                  NO ORDERS
        // =================================================

        if (
            !Array.isArray(orders) ||
            orders.length === 0
        ) {

            ordersContainer.innerHTML = `
                <div class="orders-empty">

                    <i class="fa-solid fa-box-open"></i>

                    <h3>
                        ما عندك حتى طلب حالياً
                    </h3>

                    <p>
                        ملي تدير أول طلب ديالك غادي يبان هنا.
                    </p>

                    <a href="products.html">
                        تصفح المنتجات
                    </a>

                </div>
            `;

            return;
        }


        // =================================================
        //                  DISPLAY ORDERS
        // =================================================

        ordersContainer.innerHTML =
            orders
                .map(order => createOrderHTML(order))
                .join("");


    } catch (error) {

        console.error(
            "MY ORDERS: Unexpected error:",
            error
        );

        showOrdersError();
    }
}


// =====================================================
//                  CREATE ORDER HTML
// =====================================================

function createOrderHTML(order) {

    if (!order) {
        return "";
    }


    // =================================================
    //                    STATUS
    // =================================================

    const status =
        getOrderStatus(order.status);


    // =================================================
    //                     DATE
    // =================================================

    const date =
        formatOrderDate(
            order.created_at
        );


    // =================================================
    //                    ITEMS
    // =================================================

    const items =
        Array.isArray(order.order_items)
            ? order.order_items
            : [];


    let productsHTML = "";


    // =================================================
    //                PRODUCTS HTML
    // =================================================

    items.forEach(item => {

        const productName =
            item?.product_name ||
            "منتج";


        const image =
            item?.product_image ||
            "";


        const price =
            Number(item?.price) || 0;


        const quantity =
            Number(item?.quantity) || 0;


        const subtotal =
            Number(item?.subtotal) ||
            (price * quantity);


        productsHTML += `
            <div class="my-order-product">

                <div class="my-order-product-image">

                    ${
                        image

                            ? `
                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${escapeHTML(productName)}"
                                    loading="lazy"
                                >
                            `

                            : `
                                <i class="fa-solid fa-image"></i>
                            `
                    }

                </div>


                <div class="my-order-product-info">

                    <h4>
                        ${escapeHTML(productName)}
                    </h4>

                    <p>
                        الكمية:
                        ${quantity}
                    </p>

                </div>


                <div class="my-order-product-price">

                    ${subtotal.toFixed(2)} DH

                </div>

            </div>
        `;
    });


    // =================================================
    //             NO PRODUCTS IN ORDER
    // =================================================

    if (!productsHTML) {

        productsHTML = `
            <div class="my-order-no-products">

                <i class="fa-solid fa-box-open"></i>

                <p>
                    لا توجد منتجات في هذا الطلب.
                </p>

            </div>
        `;
    }


    // =================================================
    //                    TOTAL
    // =================================================

    const total =
        Number(order.total) || 0;


    // =================================================
    //               PAYMENT METHOD
    // =================================================

    const paymentMethod =
        getPaymentMethodText(
            order.payment_method
        );


    // =================================================
    //                  CUSTOMER DATA
    // =================================================

    const customerName =
        order.customer_name ||
        "غير مضاف";


    const customerPhone =
        order.customer_phone ||
        "غير مضاف";


    const customerCity =
        order.customer_city ||
        "غير مضاف";


    // =================================================
    //                  ORDER CARD
    // =================================================

    return `
        <article
            class="my-order-card"
            data-order-id="${escapeHTML(order.id || "")}"
        >


            <!-- ================= HEADER ================= -->

            <div class="my-order-header">


                <div class="my-order-number">

                    <span class="my-order-label">
                        رقم الطلب
                    </span>

                    <strong>
                        #${escapeHTML(
                            order.order_number || ""
                        )}
                    </strong>

                </div>


                <div class="my-order-date">

                    <span class="my-order-label">
                        التاريخ
                    </span>

                    <strong>
                        ${date}
                    </strong>

                </div>


                <span
                    class="my-order-status ${status.className}"
                >
                    ${status.text}
                </span>


            </div>



            <!-- ================= CUSTOMER ================= -->

            <div class="my-order-customer">


                <div>

                    <i class="fa-solid fa-user"></i>

                    <span>
                        ${escapeHTML(customerName)}
                    </span>

                </div>


                <div>

                    <i class="fa-solid fa-phone"></i>

                    <span>
                        ${escapeHTML(customerPhone)}
                    </span>

                </div>


                <div>

                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        ${escapeHTML(customerCity)}
                    </span>

                </div>


            </div>



            <!-- ================= PRODUCTS ================= -->

            <div class="my-order-products">

                ${productsHTML}

            </div>


            <!-- ================= ORDER ACTIONS ================= -->

            ${
                String(order.status || "").trim().toLowerCase() === "pending"
                    ? `
                        <div class="my-order-actions">

                            <button
                                type="button"
                                class="cancel-order-btn"
                                data-order-id="${escapeHTML(order.id || "")}"
                            >
                                <i class="fa-solid fa-xmark"></i>
                                إلغاء الطلب
                            </button>

                        </div>
                    `
                    : ""
            }


            <!-- ================= FOOTER ================= -->

            <div class="my-order-footer">


                <div>

                    <span>
                        طريقة الدفع
                    </span>

                    <strong>
                        ${paymentMethod}
                    </strong>

                </div>


                <div class="my-order-total">

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
//                  ORDER STATUS
// =====================================================

function getOrderStatus(status) {

    const normalizedStatus =
        String(
            status || "pending"
        )
            .trim()
            .toLowerCase();


    switch (normalizedStatus) {

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
//                PAYMENT METHOD
// =====================================================

function getPaymentMethodText(
    paymentMethod
) {

    const method =
        String(
            paymentMethod || ""
        )
            .trim()
            .toLowerCase();


    switch (method) {

        case "cash":

        case "cod":

        case "cash_on_delivery":

            return "الدفع عند الاستلام";


        case "card":

            return "البطاقة البنكية";


        case "paypal":

            return "PayPal";


        default:

            return paymentMethod
                ? escapeHTML(paymentMethod)
                : "غير محددة";
    }
}


// =====================================================
//                  FORMAT DATE
// =====================================================

function formatOrderDate(
    dateValue
) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


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

function escapeHTML(value) {

    return String(value ?? "")
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
//                  ERROR MESSAGE
// =====================================================

function showOrdersError() {

    const container =
        document.getElementById(
            "myOrders"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="orders-error">

            <i class="fa-solid fa-circle-exclamation"></i>

            <h3>
                تعذر تحميل الطلبات
            </h3>

            <p>
                وقع مشكل أثناء جلب الطلبات.
                حاول تحديث الصفحة مرة أخرى.
            </p>

            <button
                type="button"
                class="orders-retry-btn"
                onclick="loadMyOrders()"
            >
                <i class="fa-solid fa-rotate-right"></i>
                إعادة المحاولة
            </button>

        </div>
    `;
}


// =====================================================
//              CANCEL ORDER MODAL
// =====================================================
// ملاحظة: الـ HTML ديال هاد المودال (#cancelOrderModal)
// كاين فـ my-orders.html، هنا غير المنطق (JS) اللي كيحركو.

function initCancelOrderModal() {

    const modal =
        document.getElementById("cancelOrderModal");

    const confirmBtn =
        document.getElementById("confirmCancelOrderBtn");


    // الصفحة الحالية ما فيهاش المودال
    if (!modal) {
        return;
    }


    // =================================================
    //         OPEN MODAL (event delegation)
    // =================================================
    // الأزرار ديال "إلغاء الطلب" كيتزادو ديناميكياً مع
    // كل طلب، فخاصنا نستعملو delegation بدل ما نربطو
    // event listener لكل زر بوحدو.

    document.addEventListener(
        "click",
        (event) => {

            const cancelBtn =
                event.target.closest(".cancel-order-btn");


            if (!cancelBtn) {
                return;
            }


            currentCancelOrderId =
                cancelBtn.dataset.orderId || null;


            openCancelOrderModal();
        }
    );


    // =================================================
    //           CLOSE MODAL (X / رجوع)
    // =================================================

    modal
        .querySelectorAll("[data-close-cancel-modal]")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                closeCancelOrderModal
            );
        });


    // =================================================
    //        CLOSE MODAL (click outside content)
    // =================================================

    modal.addEventListener(
        "click",
        (event) => {

            if (event.target === modal) {
                closeCancelOrderModal();
            }
        }
    );


    // =================================================
    //        CLOSE MODAL (Escape key)
    // =================================================

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                modal.classList.contains("active")
            ) {
                closeCancelOrderModal();
            }
        }
    );


    // =================================================
    //              CONFIRM CANCEL
    // =================================================

    if (confirmBtn) {

        confirmBtn.addEventListener(
            "click",
            handleConfirmCancelOrder
        );
    }
}


// =====================================================
//                  OPEN MODAL
// =====================================================

function openCancelOrderModal() {

    const modal =
        document.getElementById("cancelOrderModal");


    if (!modal) {
        return;
    }


    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );
}


// =====================================================
//                  CLOSE MODAL
// =====================================================

function closeCancelOrderModal() {

    const modal =
        document.getElementById("cancelOrderModal");


    if (!modal) {
        return;
    }


    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );


    currentCancelOrderId =
        null;
}


// =====================================================
//               CONFIRM CANCEL ORDER
// =====================================================

async function handleConfirmCancelOrder() {

    if (!currentCancelOrderId) {

        closeCancelOrderModal();

        return;
    }


    if (!window.supabaseClient) {

        console.error(
            "MY ORDERS: Supabase client not available."
        );

        return;
    }


    const confirmBtn =
        document.getElementById("confirmCancelOrderBtn");


    const originalHTML =
        confirmBtn
            ? confirmBtn.innerHTML
            : "";


    if (confirmBtn) {

        confirmBtn.disabled =
            true;

        confirmBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإلغاء...';
    }


    try {

        const {
            data: sessionData,
            error: sessionError
        } = await window.supabaseClient.auth.getSession();

        const userId =
            sessionData?.session?.user?.id;

        if (sessionError || !userId) {
            throw sessionError || new Error("Active user session is required.");
        }

        const {
            data: updatedOrder,
            error
        } = await window.supabaseClient

            .from("orders")

            .update({
                status: "cancelled"
            })

            .eq(
                "id",
                currentCancelOrderId
            )
            .eq(
                "user_id",
                userId
            )
            .eq(
                "status",
                "pending"
            )
            .select("id")
            .maybeSingle();


        if (error) {

            console.error(
                "MY ORDERS: Cancel order error:",
                error
            );

            return;
        }

        if (!updatedOrder) {
            console.warn(
                "MY ORDERS: Order was not updated. It may no longer be pending."
            );

            return;
        }


        closeCancelOrderModal();

        // نعاودو نحملو الطلبات باش يبان التحديث فالحين
        await loadMyOrders();


    } catch (error) {

        console.error(
            "MY ORDERS: Cancel order fatal error:",
            error
        );


    } finally {

        if (confirmBtn) {

            confirmBtn.disabled =
                false;

            confirmBtn.innerHTML =
                originalHTML;
        }
    }
}