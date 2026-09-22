// =========================================
// SEARCH MODAL
// =========================================

const searchBtn = document.getElementById("searchBtn");

const searchModal = document.getElementById("searchModal");

const closeSearch = document.getElementById("closeSearch");

const searchInput = document.getElementById("searchInput");


// فتح نافذة البحث

if (searchBtn) {

    searchBtn.addEventListener("click", () => {

        if (!searchModal || !searchInput) return;

        searchModal.classList.add("active");

        searchInput.focus();

    });

}


// إغلاق النافذة

if (closeSearch) {

    closeSearch.addEventListener("click", () => {

        if (!searchModal || !searchInput) return;

        searchModal.classList.remove("active");

        searchInput.value = "";

    });

}


// إغلاق عند الضغط خارج الصندوق

if (searchModal) {

    searchModal.addEventListener("click", (e) => {

        if (e.target === searchModal) {

            if (!searchInput) return;

            searchModal.classList.remove("active");

            searchInput.value = "";

        }

    });

}


// إغلاق بزر ESC

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape" && searchModal && searchInput) {

        searchModal.classList.remove("active");

        searchInput.value = "";

    }

});
// =========================================
// LIVE SEARCH
// =========================================

const searchResults = document.getElementById("searchResults");

function escapeSearchHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


if (searchInput && searchResults) {

    searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.trim().toLowerCase();

    searchResults.innerHTML = "";

    if (keyword === "") return;

   const results = products.filter(product => {

    const name = String(product.name ?? "").toLowerCase();
    const category = String(product.category ?? "").toLowerCase();
    const description = String(product.description ?? "").toLowerCase();

    return name.includes(keyword) ||

    category.includes(keyword) ||

    description.includes(keyword);

});
if (results.length === 0) {

    searchResults.innerHTML = `

        <div class="search-empty">

            <i class="fa-solid fa-magnifying-glass"></i>

            <h3>No products found</h3>

            <p>
                We couldn't find anything matching
                "<strong>${escapeSearchHTML(keyword)}</strong>"
            </p>

        </div>

    `;

    return;

}
    

   results.forEach(product => {

    searchResults.innerHTML += `

        <a href="product-details.html?id=${encodeURIComponent(product.id)}" class="search-item">

            <img src="${escapeSearchHTML(product.image)}" alt="${escapeSearchHTML(product.name)}">

            <div class="search-info">

                <h4>${escapeSearchHTML(product.name)}</h4>

                <p>${escapeSearchHTML(product.category)}</p>

                <span>${escapeSearchHTML(product.price)}</span>

            </div>

        </a>

    `;

});

});

}