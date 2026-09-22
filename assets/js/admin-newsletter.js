let adminNewsletterSubscribers = [];

document.addEventListener("DOMContentLoaded", initializeAdminNewsletter);

async function initializeAdminNewsletter() {
    try {
        if (!window.supabaseClient) throw new Error("Supabase client is not available.");
        const { data: isAdmin, error: adminError } = await window.supabaseClient.rpc("is_store_admin");
        if (adminError || isAdmin !== true) {
            showAdminNewsletterDenied("ليس لديك صلاحية الوصول إلى النشرة البريدية.");
            return;
        }
        setupAdminNewsletterControls();
        await loadAdminNewsletterSubscribers();
    } catch (error) {
        console.error("ADMIN NEWSLETTER: Initialization error:", error);
        showAdminNewsletterFeedback("تعذر تحميل المشتركين حاليًا.", "error");
        renderAdminNewsletterError();
    }
}

function setupAdminNewsletterControls() {
    document.getElementById("adminNewsletterSearch")?.addEventListener("input", renderAdminNewsletter);
    document.getElementById("adminNewsletterComposeForm")?.addEventListener("submit", sendAdminNewsletter);
    document.getElementById("adminNewsletterRefresh")?.addEventListener("click", async event => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
            await loadAdminNewsletterSubscribers();
            showAdminNewsletterFeedback("تم تحديث قائمة المشتركين.", "success");
        } catch (error) {
            console.error("ADMIN NEWSLETTER: Refresh error:", error);
            showAdminNewsletterFeedback("تعذر تحديث القائمة.", "error");
        } finally {
            button.disabled = false;
        }
    });
    document.getElementById("adminNewsletterList")?.addEventListener("click", handleAdminNewsletterAction);
}

async function sendAdminNewsletter(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const subjectInput = document.getElementById("adminNewsletterSubject");
    const contentInput = document.getElementById("adminNewsletterContent");
    const button = document.getElementById("adminNewsletterSend");
    const subject = String(subjectInput?.value || "").trim();
    const content = String(contentInput?.value || "").trim();
    if (!subject || !content) {
        showAdminNewsletterFeedback("المرجو إدخال الموضوع ومحتوى الرسالة.", "error");
        return;
    }
    if (!window.confirm("واش متأكد من إرسال هاد النشرة لجميع المشتركين؟")) return;
    const originalText = button?.innerHTML || "إرسال النشرة";
    if (button) { button.disabled = true; button.textContent = "جاري الإرسال..."; }
    showAdminNewsletterFeedback("جاري إرسال النشرة...", "");
    try {
        const { data, error } = await window.supabaseClient.functions.invoke("send-newsletter", {
            body: { subject, content },
        });
        if (error) throw error;
        const sent = Number(data?.sent || 0);
        const failed = Number(data?.failed || 0);
        showAdminNewsletterFeedback(
            failed ? `تم إرسال ${sent} رسالة، وتعذر إرسال ${failed}.` : `تم إرسال النشرة إلى ${sent} مشترك.`,
            failed ? "error" : "success",
        );
        if (!failed) form.reset();
    } catch (error) {
        console.error("ADMIN NEWSLETTER: Send error:", error);
        showAdminNewsletterFeedback("تعذر إرسال النشرة حاليًا. حاول لاحقًا.", "error");
    } finally {
        if (button) { button.disabled = false; button.innerHTML = originalText; }
    }
}

async function loadAdminNewsletterSubscribers() {
    const list = document.getElementById("adminNewsletterList");
    list.innerHTML = '<tr><td colspan="3" class="admin-newsletter-loading"><i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل المشتركين...</td></tr>';
    const { data, error } = await window.supabaseClient
        .from("newsletter_subscribers")
        .select("id, email, created_at")
        .order("created_at", { ascending: false });
    if (error) throw error;
    adminNewsletterSubscribers = Array.isArray(data) ? data : [];
    renderAdminNewsletter();
}

function renderAdminNewsletter() {
    const list = document.getElementById("adminNewsletterList");
    const search = String(document.getElementById("adminNewsletterSearch")?.value || "").trim().toLowerCase();
    const filtered = adminNewsletterSubscribers.filter(item => !search || String(item.email || "").toLowerCase().includes(search));
    const total = document.getElementById("adminNewsletterTotal");
    if (total) total.textContent = adminNewsletterSubscribers.length;
    if (!filtered.length) {
        list.innerHTML = '<tr><td colspan="3" class="admin-newsletter-empty"><i class="fa-regular fa-envelope"></i><strong>لا يوجد مشتركون حاليًا</strong><span>جرّب تغيير البحث إذا كانت القائمة تحتوي على مشتركين.</span></td></tr>';
        return;
    }
    list.innerHTML = filtered.map(item => `<tr data-newsletter-row="${escapeAdminNewsletterHTML(item.id)}">
        <td><strong class="admin-newsletter-email">${escapeAdminNewsletterHTML(item.email)}</strong></td>
        <td><time datetime="${escapeAdminNewsletterHTML(item.created_at || "")}">${escapeAdminNewsletterHTML(formatAdminNewsletterDate(item.created_at))}</time></td>
        <td><button type="button" class="admin-newsletter-delete" data-subscriber-id="${escapeAdminNewsletterHTML(item.id)}"><i class="fa-regular fa-trash-can"></i> حذف</button></td>
    </tr>`).join("");
}

async function handleAdminNewsletterAction(event) {
    const button = event.target.closest("[data-subscriber-id]");
    if (!button) return;
    const id = button.dataset.subscriberId;
    if (!window.confirm("واش متأكد من حذف هاد المشترك نهائياً؟")) return;
    button.disabled = true;
    button.textContent = "جاري...";
    try {
        const { error } = await window.supabaseClient.from("newsletter_subscribers").delete().eq("id", id);
        if (error) throw error;
        adminNewsletterSubscribers = adminNewsletterSubscribers.filter(item => item.id !== id);
        renderAdminNewsletter();
        showAdminNewsletterFeedback("تم حذف المشترك.", "success");
    } catch (error) {
        console.error("ADMIN NEWSLETTER: Delete error:", error);
        button.disabled = false;
        button.innerHTML = '<i class="fa-regular fa-trash-can"></i> حذف';
        showAdminNewsletterFeedback("تعذر حذف المشترك.", "error");
    }
}

function formatAdminNewsletterDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("ar-MA", { year: "numeric", month: "short", day: "numeric" });
}

function escapeAdminNewsletterHTML(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function showAdminNewsletterFeedback(message, type = "") {
    const element = document.getElementById("adminNewsletterFeedback");
    if (element) { element.textContent = message; element.className = `admin-newsletter-feedback ${type}`; }
}

function renderAdminNewsletterError() {
    const list = document.getElementById("adminNewsletterList");
    if (list) list.innerHTML = '<tr><td colspan="3" class="admin-newsletter-empty error"><i class="fa-solid fa-circle-exclamation"></i><strong>تعذر تحميل المشتركين</strong></td></tr>';
}

function showAdminNewsletterDenied(message) {
    const page = document.querySelector(".admin-newsletter-page");
    if (page) page.innerHTML = `<div class="admin-reviews-denied"><i class="fa-solid fa-lock"></i><h1>دخول غير مسموح</h1><p>${escapeAdminNewsletterHTML(message)}</p><a href="index.html">العودة للمتجر</a></div>`;
}
