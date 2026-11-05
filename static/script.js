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

        // Chart panel dikelola terpisah agar tidak terhapus saat quote diperbarui.
    }


    const chartCanvas = document.querySelector("#market-chart");
    const chartAssetSelect = document.querySelector("#chart-asset");
    const chartStatus = document.querySelector("#chart-status");
    const livePriceEl = document.querySelector("#chart-live-price");
    const liveChangeEl = document.querySelector("#chart-live-change");
    const highLowEl = document.querySelector("#chart-high-low");
    const updatedEl = document.querySelector("#chart-updated");
    let marketChart = null;
    let selectedRange = "1h";
    let chartHistory = [];
    let chartCoin = "bitcoin";
    let chartLoading = false;
    let lastLiveTimestamp = 0;

    const coinSymbols = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" };
    const rangeLabels = { "1h":"1 jam", "24h":"24 jam", "7d":"7 hari", "30d":"1 bulan", "365d":"1 tahun", "all":"seluruh periode" };

    function chartTimeLabel(timestamp, range) {
        const date = new Date(timestamp);
        if (range === "1h" || range === "24h") {
            return date.toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit"});
        }
        return date.toLocaleDateString("id-ID", {day:"2-digit", month:"short", year: range === "7d" ? undefined : "2-digit"});
    }

    function drawChart() {
        if (!chartCanvas || typeof Chart === "undefined") {
            if (chartStatus) chartStatus.textContent = "Chart.js gagal dimuat. Periksa koneksi internet/CDN.";
            return;
        }
        const now = Date.now();
        const filtered = selectedRange === "1h"
            ? chartHistory.filter(point => point.time >= now - 3600000)
            : chartHistory;
        const points = filtered.map(point => ({x:point.time, y:point.price}));
        if (!points.length) {
            if (chartStatus) chartStatus.textContent = "Belum ada titik data pada rentang ini.";
            return;
        }
        const data = {
            datasets: [{
                label: coinSymbols[chartCoin] + " / USD",
                data: points,
                borderColor: "#52e4f6",
                backgroundColor: "rgba(82,228,246,0.10)",
                borderWidth: 2,
                pointRadius: points.length > 100 ? 0 : 2,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.22
            }]
        };
        const options = {
            responsive:true, maintainAspectRatio:false, animation:false,
            parsing:false,
            interaction:{mode:"nearest", intersect:false},
            plugins:{
                legend:{display:false},
                tooltip:{callbacks:{label:ctx => money(ctx.parsed.y)}}
            },
            scales:{
                x:{type:"linear", ticks:{maxTicksLimit:6, callback:value => chartTimeLabel(value,selectedRange)}, grid:{color:"rgba(130,145,170,0.10)"}, title:{display:false}},
                y:{grid:{color:"rgba(130,145,170,0.12)"}, ticks:{maxTicksLimit:5, callback:value => money(value)}}
            }
        };
        if (marketChart) {
            marketChart.data = data;
            marketChart.options = options;
            marketChart.update("none");
        } else {
            marketChart = new Chart(chartCanvas, {type:"line", data, options});
        }
        let low=Infinity, high=-Infinity;
        for (const point of filtered) {
            if (point.price < low) low=point.price;
            if (point.price > high) high=point.price;
        }
        if (highLowEl && Number.isFinite(low) && Number.isFinite(high)) {
            highLowEl.textContent = money(high) + " / " + money(low);
        }
        if (chartStatus) chartStatus.textContent = `${coinSymbols[chartCoin]} · ${rangeLabels[selectedRange]} · ${points.length} titik · CoinGecko`;
    }

    async function loadChartHistory() {
        if (!chartCanvas || chartLoading) return;
        chartLoading = true;
        chartCoin = chartAssetSelect?.value || chartCoin;
        if (chartStatus) chartStatus.textContent = "Mengambil data historis…";
        try {
            const response = await fetch(`/api/market/history?coin=${encodeURIComponent(chartCoin)}&range=${encodeURIComponent(selectedRange)}`, {cache:"no-store"});
            const data = await response.json();
            if (!response.ok || !Array.isArray(data.prices) || !data.prices.length) {
                throw new Error(data.message || "Data historis tidak tersedia.");
            }
            chartHistory = data.prices.filter(p => Number.isFinite(p.time) && Number.isFinite(p.price));
            if (selectedRange === "1h") {
                const cutoff = Date.now() - 3600000;
                chartHistory = chartHistory.filter(p => p.time >= cutoff);
            }
            lastLiveTimestamp = 0;
            drawChart();
            if (data.stale && chartStatus) chartStatus.textContent += " · cache lama";
        } catch (error) {
            console.error("Chart history error:", error);
            if (chartStatus) chartStatus.textContent = error.message || "Gagal memuat data chart.";
        } finally {
            chartLoading = false;
        }
    }

    function updateLiveChart(coins) {
        const coin = coins.find(item => item.id === (chartAssetSelect?.value || chartCoin));
        if (!coin) return;
        chartCoin = coin.id;
        if (livePriceEl) livePriceEl.textContent = money(coin.price);
        if (liveChangeEl) {
            liveChangeEl.textContent = percentage(coin.change_24h);
            const change = Number(coin.change_24h);
            liveChangeEl.style.color = change > 0 ? "#36d399" : change < 0 ? "#ff6b81" : "inherit";
        }
        if (updatedEl) updatedEl.textContent = new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
        // Tambahkan quote baru hanya untuk grafik intraday agar tidak mencemari rentang historis panjang.
        if ((selectedRange === "1h" || selectedRange === "24h") && marketChart && Number.isFinite(Number(coin.price))) {
            const timestamp = Date.now();
            if (timestamp - lastLiveTimestamp >= 9000) {
                chartHistory.push({time:timestamp, price:Number(coin.price)});
                lastLiveTimestamp = timestamp;
                const cutoff = timestamp - (selectedRange === "1h" ? 3600000 : 86400000);
                chartHistory = chartHistory.filter(point => point.time >= cutoff);
                drawChart();
            }
        }
    }

    if (chartAssetSelect) chartAssetSelect.addEventListener("change", () => {
        chartCoin = chartAssetSelect.value;
        loadChartHistory();
        loadMarketData();
    });
    document.querySelectorAll(".range-button").forEach(button => {
        button.addEventListener("click", () => {
            selectedRange = button.dataset.range || "24h";
            document.querySelectorAll(".range-button").forEach(item => item.classList.toggle("active", item === button));
            loadChartHistory();
        });
    });

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
            updateLiveChart(data.coins);

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

    loadChartHistory();
    loadMarketData();
    window.setInterval(loadMarketData, 10_000);

    console.info("Neo Hub UI siap.");
})();
