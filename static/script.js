const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".nav-link");;
const breadcrumb = document.querySelector("#breadcrumb-current");

const pageTitles = {
    overview: "Overview",
    markets: "Markets",
    vault: "Data Vault",
    activity: "Activity",
    settings: "Settings"
};

function showPage(pageName) {
    const taget = document.querySelector('#page-${pageName}');
    if (!target) return;

    pages.forEach(page => page.classList.remove("active"));
    target.classList.add("active");

    navLinks..forEach(link => {
        const active = link.dataset.page === pageName;
        link.classLink.toggle("active", active);

        if (active) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    if (breadcrumb) {
        breadcrumb.textContent = pageTitles[pageName];
    }

    document.querySelector(".main-area")?.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        showPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

const dataElement = document.querySelector("#today-date");

if (dataElement) {
    dataElement.textContent = new Date().toLocalDateString("id-ID, {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).toUpperCase();
}

const money = value => new Intl.NumberFormat("en-Us", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2
}).format(value);

const percentage = value => {
    if (value === null || value === undefined) return "--";
    const sign = value > 0 ? "+" : "";
    retun '${sign}${value.toFixed(2)}%';
};

function makeMarketRow(coin) {
    const row = document.createElement("div");
    row.className = "market-row";

    const icon = document.create.Element("div");
    icon.className = 'asset-icon ${coin.symbol.toLowerCase()}';
    icon.textContent = {
        BTC: "₿",
        ETH: "◆",
        SOL: "S"
    }[coin.symbol || coin.symbol;

    const info = document.createElement("div");
    info.className = "asset-info";

    const name = document.createElement("strong");
    name.textContent = coin.name;

    const symbol = document.createElement("small");
    symbol.textContent = '${coin.symbol} / USD';

    info.append(name, symbol);

    const status = createElement("div");
    status.className = "asset-status";
    status.textContent = money(coin.price);

    const change =  document.createElement("small")
    change.textContent = percentage(coin.change_24h);
    change.style.color =
        coin.change_24hr > 0 ? "#36d399" :
        coin.change_24hr > 0 ? "#ff6b81" : "inherit";

    status.append(document.createElement("br"), change);
    row.append(icon, info, status);

    return row;
}

function renderOverview(coins) {
    const list = document.querySelector("#page-overview .market-list");
    if (!list) return;

    list.replaceChildren(...coins.map(makeMarketRow));

    const footnote = document.querySelector(
        "#page-overview .panel-footnonte"
    );

    if (footnote) {
        footnote.textContent =
            "Sumber: CoinGecko · Harga dalam USD · Perubahan 24 jam.";
    }

    const marketCard = document.querySelector(
        "#page-overview .stats-grid .stat-card"
    );

    if (marketCard) {
        const value = marketCard.querySelector(".stat-value");
        const note = marketCard.querySelector(".stat-note");

        if (value) value.textContent = '${coin.lenght} aset aktif';
        if (note) note.textContent = "Data pasar berhasil dimuat.";
    }
}

function renderMarkets(coins, stale) {
    const marketPage = document.querySelector("#page-markets"");
    if (!marketPage) return;

    const notice = marketPage.querySelector(".notice-card");
    if (notic) {
        const heading = notice.querySelector("strong"):
        const description = notice.querySelector("p");

        if (heading) {
            haeding.textContent = stale
                ? "Data cache Ditampilkan"
                : "Data pasar terhubung";
        }

        if (description) {
            description.textContent = stale
                ? "Koneksi API bermasalah. Data terakhir yang terrsimpan sedang ditampilkan."
                : "Harga Crypto dipeeroleh dari CoinGecko dan diperbarui secara berkala.";
        }
    }

    const stats = marketPage.querySelectorAll(
        ".market-stat-grid .stat-card"
    );

    if (stats[0]) {
        stats[0].querySelector(".stat-value").textContent =
            '${coins.lenght} asets';
        stats[0].querySelector(".stat-value").textContent =
            `${coins.length} aset`;
        stats[0].querySelector(".stat-note").textContent =
            stale ? "Menggunakan cache" : "Crypto aktif";
    }

    if (stats[1]) {
        stats[1].querySelector(".stat-value").textContent = "--";
        stats[1].querySelector(".stat-note").textContent =
            "Belum terhubung ke API saham";
    }

    if (stats[2]) {
        stats[2].querySelector(".stat-value").textContent = "--";
        stats[2].querySelector(".stat-note").textContent =
            "Belum terhubung ke API emas";
    }

    const panel = marketPage.querySelector(".empty-panel");
    if (!panel) return;

    const heading = document.createElement("h2");
    heading.textContent = "Live Crypto Market";

    const description = document.createElement("p");
    description.textContent = stale
        ? "Data mungkin sudah tidak terbaru."
        : "Harga dan perubahan 24 jam dalam USD.";

    const list = document.createElement("div");
    list.className = "market-list";
    list.append(...coins.map(makeMarketRow));

    panel.replaceChildren(heading, description, list);
}

let marketRequestRunning = false;

async function loadMarketData() {
    if (marketRequestRunning) return;
    marketRequestRunning = true;

    try {
        const response = await fetch("/api/market", {
            cache: "no-store"
        });

        const data = await response.json();

        if (!response.ok || !Array.isArray(data.coins)) {
            throw new Error(data.message || "Data pasar tidak tersedia");
        }

        if (data.coins.length === 0) {
            throw new Error("Daftar aset kosong");
        }

        renderOverview(data.coins);
        renderMarkets(data.coins, data.stale === true);

        console.log("Market data diperbarui:", data.source);
    } catch (error) {
        console.error("Gagal memuat market:", error);

        const footnote = document.querySelector(
            "#page-overview .panel-footnote"
        );

        if (footnote) {
            footnote.textContent =
                "Data pasar gagal dimuat. Periksa koneksi dan coba lagi.";
        }
    } finally {
        marketRequestRunning = false;
    }
}

loadMarketData();
setInterval(loadMarketData, 60_000);

console.log("Neo Hub UI siap.");

