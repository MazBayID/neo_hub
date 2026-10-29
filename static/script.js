(() => {
    "use strict";

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
        const target = document.querySelector(`#page-${pageName}`);
        if (!target) return;

        pages.forEach((page) => page.classList.remove("active"));
        target.classList.add("active");

        navLinks.forEach((link) => {
            const active = link.dataset.page === pageName;
            link.classList.toggle("active", active);

            if (active) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        if (breadcrumb) {
            breadcrumb.textContent = pageTitles[pageName] || pageName;
        }

        document.querySelector(".main-area")?.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    navLinks.forEach((link) => {
        link.addEventListener("click", () => showPage(link.dataset.page));
    });

    document.querySelectorAll("[data-go]").forEach((button) => {
        button.addEventListener("click", () => showPage(button.dataset.go));
    });

    const dateElement = document.querySelector("#today-date");
    if (dateElement) {
        dateElement.textContent = new Date()
            .toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric"
            })
            .toUpperCase();
    }

    const money = (value) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return "--";

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: amount > 0 && amount < 1 ? 6 : 2
        }).format(amount);
    };

    const percentage = (value) => {
        if (value === null || value === undefined || !Number.isFinite(Number(value))) {
            return "--";
        }

        const amount = Number(value);
        const sign = amount > 0 ? "+" : "";
        return `${sign}${amount.toFixed(2)}%`;
    };

    function makeMarketRow(coin) {
        const row = document.createElement("div");
        row.className = "market-row";

        const symbol = String(coin.symbol || "").toUpperCase();
        const icon = document.createElement("div");
        icon.className = `asset-icon ${symbol.toLowerCase()}`;
        icon.textContent = {
            BTC: "₿",
            ETH: "◆",
            SOL: "S"
        }[symbol] || symbol.slice(0, 1) || "?";
        icon.setAttribute("aria-hidden", "true");

        const info = document.createElement("div");
        info.className = "asset-info";

        const name = document.createElement("strong");
        name.textContent = coin.name || symbol || "Unknown asset";

        const ticker = document.createElement("small");
        ticker.textContent = `${symbol || "—"} / USD`;
        info.append(name, ticker);

        const status = document.createElement("div");
        status.className = "asset-status";

        const price = document.createElement("span");
        price.textContent = money(coin.price);

        const change = document.createElement("small");
        change.textContent = percentage(coin.change_24h);
        const changeValue = Number(coin.change_24h);
        change.style.color = !Number.isFinite(changeValue)
            ? "inherit"
            : changeValue > 0
                ? "#36d399"
                : changeValue < 0
                    ? "#ff6b81"
                    : "inherit";

        status.append(price, document.createElement("br"), change);
        row.append(icon, info, status);

        return row;
    }

    function renderOverview(coins, stale) {
        const list = document.querySelector("#page-overview .market-list");
        if (list) {
            list.replaceChildren(...coins.map(makeMarketRow));
        }

        const footnote = document.querySelector("#page-overview .panel-footnote");
        if (footnote) {
            footnote.textContent = stale
                ? "CoinGecko · Menampilkan data cache; harga mungkin tidak terbaru."
                : "Sumber: CoinGecko · Harga dalam USD · Perubahan 24 jam.";
        }

        const marketCard = document.querySelector(
            "#page-overview .stats-grid .stat-card"
        );

        if (marketCard) {
            const value = marketCard.querySelector(".stat-value");
            const note = marketCard.querySelector(".stat-note");

            if (value) value.textContent = `${coins.length} aset aktif`;
            if (note) {
                note.textContent = stale
                    ? "Menggunakan data cache"
                    : "Data pasar berhasil dimuat";
            }
        }
    }

    function renderMarkets(coins, stale) {
        const marketPage = document.querySelector("#page-markets");
        if (!marketPage) return;

        const notice = marketPage.querySelector(".notice-card");
        if (notice) {
            const heading = notice.querySelector("strong");
            const description = notice.querySelector("p");

            if (heading) {
                heading.textContent = stale
                    ? "Data cache ditampilkan"
                    : "Data pasar terhubung";
            }

            if (description) {
                description.textContent = stale
                    ? "Koneksi API bermasalah. Data terakhir yang tersimpan sedang ditampilkan."
                    : "Harga crypto diperoleh dari CoinGecko dan diperbarui secara berkala.";
            }
        }

        const stats = marketPage.querySelectorAll(
            ".market-stat-grid .stat-card"
        );

        if (stats[0]) {
            const value = stats[0].querySelector(".stat-value");
            const note = stats[0].querySelector(".stat-note");
            if (value) value.textContent = `${coins.length} aset`;
            if (note) note.textContent = stale ? "Menggunakan cache" : "Crypto aktif";
        }

        if (stats[1]) {
            const value = stats[1].querySelector(".stat-value");
            const note = stats[1].querySelector(".stat-note");
            if (value) value.textContent = "--";
            if (note) note.textContent = "Belum terhubung ke API saham";
        }

        if (stats[2]) {
            const value = stats[2].querySelector(".stat-value");
            const note = stats[2].querySelector(".stat-note");
            if (value) value.textContent = "--";
            if (note) note.textContent = "Belum terhubung ke API emas";
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
        list.replaceChildren(...coins.map(makeMarketRow));

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

            const stale = data.stale === true;
            renderOverview(data.coins, stale);
            renderMarkets(data.coins, stale);

            console.info("Market data diperbarui:", data.source || "API");
        } catch (error) {
            console.error("Gagal memuat market:", error);

            const footnote = document.querySelector(
                "#page-overview .panel-footnote"
            );

            if (footnote) {
                footnote.textContent =
                    "Data pasar gagal dimuat. Periksa koneksi internet lalu coba lagi.";
            }

            const notice = document.querySelector("#page-markets .notice-card");
            if (notice) {
                const heading = notice.querySelector("strong");
                const description = notice.querySelector("p");
                if (heading) heading.textContent = "Data pasar belum tersedia";
                if (description) {
                    description.textContent =
                        "Neo Hub tidak dapat mengambil data pasar saat ini. Coba lagi setelah koneksi pulih.";
                }
            }
        } finally {
            marketRequestRunning = false;
        }
    }

    loadMarketData();
    window.setInterval(loadMarketData, 60_000);

    console.info("Neo Hub UI siap.");
})();
