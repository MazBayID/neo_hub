
const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".nav-link");
const breadcrumb = document.querySelector("#breadcrumb-current");

const pageTitles = {
    overview: "Overview",
    markets: "Markets",
    vault: "Data Vault",
    activity: "Activity",
    settings: "Settings"
};

function showPage(pageName) {
    const targetPage = document.querySelector(`#page-${pageName}`);

    if (!targetPage) {
        return;
    }

    pages.forEach((page) => {
        page.classList.remove("active");
    });

    targetPage.classList.add("active");

    navLinks.forEach((link) => {
        const isActive = link.dataset.page === pageName;

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    breadcrumb.textContent = pageTitles[pageName];

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        showPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

const dateElement = document.querySelector("#today-date");

if (dateElement) {
    const now = new Date();

    dateElement.textContent = now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).toUpperCase();
}

console.log("Neo Hub UI berhasil dimuat.");
