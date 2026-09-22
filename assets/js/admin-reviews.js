let adminReviews = [];
let adminReviewProducts = new Map();
let adminReviewProfiles = new Map();

document.addEventListener("DOMContentLoaded", initializeAdminReviews);

async function initializeAdminReviews() {
    const list = document.getElementById("adminReviewsList");
    if (!list) return;

    try {
        if (!window.supabaseClient) throw new Error("Supabase client is not available.");

        const { data: adminCheck, error: adminError } = await window.supabaseClient
            .rpc("is_store_admin");

        if (adminError || adminCheck !== true) {
            showAdminReviewsDenied("ليس لديك صلاحية الوصول إلى إدارة التقييمات.");
            return;
        }

        setupAdminReviewsControls();
        await loadAdminReviews();
    } catch (error) {
        console.error("ADMIN REVIEWS: Initialization error:", error);
        showAdminReviewsDenied("وقع مشكل أثناء فتح إدارة التقييمات.");
    }
}

async function loadAdminReviews() {
    const list = document.getElementById("adminReviewsList");
    list.innerHTML = '<tr><td colspan="7" class="admin-reviews-loading"><i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل التقييمات...</td></tr>';

    const { data, error } = await window.supabaseClient
        .from("product_reviews")
        .select("id, product_id, user_id, order_id, order_item_id, rating, comment, status, created_at, updated_at")
        .order("created_at", { ascending: false });

    if (error) throw error;
    adminReviews = Array.isArray(data) ? data : [];

    const productIds = [...new Set(adminReviews.map(review => review.product_id).filter(Boolean))];
    const userIds = [...new Set(adminReviews.map(review => review.user_id).filter(Boolean))];
    adminReviewProducts = new Map();
    adminReviewProfiles = new Map();

    if (productIds.length) {
        const { data: products, error: productsError } = await window.supabaseClient
            .from("products")
            .select("id, name")
            .in("id", productIds);
        if (!productsError) (products || []).forEach(product => adminReviewProducts.set(String(product.id), product.name));
    }

    if (userIds.length) {
        const { data: profiles, error: profilesError } = await window.supabaseClient
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);
        if (!profilesError) (profiles || []).forEach(profile => adminReviewProfiles.set(String(profile.id), profile.full_name));
    }

    renderAdminReviews();
}

function setupAdminReviewsControls() {
    document.getElementById("adminReviewsSearch")?.addEventListener("input", renderAdminReviews);
    document.getElementById("adminReviewsFilter")?.addEventListener("change", renderAdminReviews);
    document.getElementById("adminReviewsRefresh")?.addEventListener("click", async event => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
            await loadAdminReviews();
            showAdminReviewsFeedback("تم تحديث التقييمات.", "success");
        } catch (error) {
            console.error("ADMIN REVIEWS: Refresh error:", error);
            showAdminReviewsFeedback("تعذر تحديث التقييمات.", "error");
        } finally {
            button.disabled = false;
        }
    });
    document.getElementById("adminReviewsList")?.addEventListener("click", handleAdminReviewAction);
}

function renderAdminReviews() {
    const list = document.getElementById("adminReviewsList");
    const search = String(document.getElementById("adminReviewsSearch")?.value || "").trim().toLowerCase();
    const filter = document.getElementById("adminReviewsFilter")?.value || "all";
    const filtered = adminReviews.filter(review => {
        const productName = adminReviewProducts.get(String(review.product_id)) || `منتج #${review.product_id}`;
        const matchesSearch = !search || `${productName} ${review.comment || ""}`.toLowerCase().includes(search);
        return matchesSearch && (filter === "all" || review.status === filter);
    });

    updateAdminReviewStats();
    if (!filtered.length) {
        list.innerHTML = '<tr><td colspan="7" class="admin-reviews-empty"><i class="fa-regular fa-face-smile"></i><strong>لا توجد تقييمات حالياً</strong><span>جرّب تغيير البحث أو الفلتر.</span></td></tr>';
        return;
    }

    list.innerHTML = filtered.map(review => {
        const productName = adminReviewProducts.get(String(review.product_id)) || `منتج #${review.product_id}`;
        const customerName = adminReviewProfiles.get(String(review.user_id)) || shortenAdminReviewId(review.user_id);
        const status = getAdminReviewStatus(review.status);
        const date = formatAdminReviewDate(review.created_at);
        const actions = review.status === "pending"
            ? `<button class="admin-review-action approve" data-review-action="approve" data-review-id="${review.id}">موافقة</button><button class="admin-review-action reject" data-review-action="reject" data-review-id="${review.id}">رفض</button>`
            : `<button class="admin-review-action ${review.status === "approved" ? "reject" : "approve"}" data-review-action="${review.status === "approved" ? "reject" : "approve"}" data-review-id="${review.id}">${review.status === "approved" ? "رفض" : "موافقة"}</button>`;

        return `<tr data-review-row="${review.id}">
            <td><strong class="admin-review-product-name">${escapeAdminReviewHTML(productName)}</strong><small>#${escapeAdminReviewHTML(review.product_id)}</small></td>
            <td><span class="admin-review-stars" aria-label="${review.rating} من 5">${renderAdminReviewStars(review.rating)}</span><small>${review.rating}/5</small></td>
            <td><p class="admin-review-comment">${escapeAdminReviewHTML(review.comment)}</p></td>
            <td><strong>${escapeAdminReviewHTML(customerName)}</strong><small>${escapeAdminReviewHTML(shortenAdminReviewId(review.user_id))}</small></td>
            <td><time datetime="${escapeAdminReviewHTML(review.created_at || "")}">${escapeAdminReviewHTML(date)}</time></td>
            <td><span class="admin-review-status ${status.className}">${status.label}</span></td>
            <td><div class="admin-review-actions">${actions}<button class="admin-review-action delete" data-review-action="delete" data-review-id="${review.id}">حذف</button></div></td>
        </tr>`;
    }).join("");
}

function updateAdminReviewStats() {
    const count = status => adminReviews.filter(review => review.status === status).length;
    setAdminReviewText("adminReviewsTotal", adminReviews.length);
    setAdminReviewText("adminReviewsPending", count("pending"));
    setAdminReviewText("adminReviewsApproved", count("approved"));
    setAdminReviewText("adminReviewsRejected", count("rejected"));
}

async function handleAdminReviewAction(event) {
    const button = event.target.closest("[data-review-action]");
    if (!button) return;
    const reviewId = button.dataset.reviewId;
    const action = button.dataset.reviewAction;
    const review = adminReviews.find(item => item.id === reviewId);
    if (!review) return;

    if (action === "delete" && !window.confirm("واش متأكد من حذف هاد التقييم نهائياً؟")) return;
    if (action === "reject" && !window.confirm("واش متأكد من رفض هاد التقييم؟")) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "جاري...";

    try {
        if (action === "delete") {
            const { error } = await window.supabaseClient.from("product_reviews").delete().eq("id", reviewId);
            if (error) throw error;
            adminReviews = adminReviews.filter(item => item.id !== reviewId);
            renderAdminReviews();
            showAdminReviewsFeedback("تم حذف التقييم.", "success");
            return;
        }

        const nextStatus = action === "approve" ? "approved" : "rejected";
        const { data, error } = await window.supabaseClient
            .from("product_reviews")
            .update({ status: nextStatus })
            .eq("id", reviewId)
            .select("id, status")
            .single();
        if (error) throw error;
        review.status = data.status;
        renderAdminReviews();
        showAdminReviewsFeedback(nextStatus === "approved" ? "تمت الموافقة على التقييم." : "تم رفض التقييم.", "success");
    } catch (error) {
        console.error("ADMIN REVIEWS: Action error:", error);
        showAdminReviewsFeedback("تعذر تنفيذ العملية. تأكد من صلاحيات المدير.", "error");
        button.disabled = false;
        button.textContent = originalText;
    }
}

function getAdminReviewStatus(status) {
    return status === "approved"
        ? { label: "مقبول", className: "approved" }
        : status === "rejected"
            ? { label: "مرفوض", className: "rejected" }
            : { label: "قيد المراجعة", className: "pending" };
}

function renderAdminReviewStars(rating) {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

function formatAdminReviewDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("ar-MA", { year: "numeric", month: "short", day: "numeric" });
}

function shortenAdminReviewId(value) {
    const text = String(value || "");
    return text.length > 12 ? `${text.slice(0, 8)}…${text.slice(-4)}` : text || "غير معروف";
}

function escapeAdminReviewHTML(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function setAdminReviewText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function showAdminReviewsFeedback(message, type = "") {
    const element = document.getElementById("adminReviewsFeedback");
    if (!element) return;
    element.textContent = message;
    element.className = `admin-reviews-feedback ${type}`;
}

function showAdminReviewsDenied(message) {
    const page = document.querySelector(".admin-reviews-page");
    if (!page) return;
    page.innerHTML = `<div class="admin-reviews-denied"><i class="fa-solid fa-lock"></i><h1>دخول غير مسموح</h1><p>${escapeAdminReviewHTML(message)}</p><a href="index.html">العودة للمتجر</a></div>`;
}
