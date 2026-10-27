import os
import time
import urllib.parse
import urllib.request
import json

from dotenv import load_dotenv
from flask import (
    Flask, render_template, request, redirect, url_for, flash, jsonify
)

import database

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ["SECRET_KEY"]

database.init_db()

#cache harga pasar agar permintaan API tidak berlebihan
_market_cache = {"timestamp": 0, "data": None}
CACHE_SECONDS = 60

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/vault")
def vault():
    items = database.get_all_items()
    return render_template("vault.html", items=items)

@app.route("/vault/add", methods=["POST"])
def add_vault_item():
    title = request.form.get("title", "").strip()
    content = request.form.get("content", "").strip()

    if title and content:
        database.add_item(title, content)
        flash("Catatan berhasil disimpan.")
    else:
        flash("Judul dan isi catatan wanib diisi!!", "error")
    return redirect(url_for("vault"))

@app.route("/api/market")
def market_data():
    now = time.time()

    #Gunakan cache jika masih berlaku
    if (
        _market_cache["data"] is not None
        and now - _market_cache["timestamp"] < CACHE_SECONDS
    ):
        return jsonify(_market_cache["data"])
    params = urllib.parse.urlencode({
        "ids": "bitcoin,ethereum,solana",
        "vs_currencies": "usd",
        "include_24hr_change": "true",
        "include_last_updated_at": "true",
    })
    url = (
        "https://api.coingecko.com/api/v3/simple/price?"
        + params
    )

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "NeoHub/1.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            raw_data = json.loads(response.read().decode("utf-8"))
        coins = []
        for coin_id, symbol, name in [
            ("bitcoin", "BTC", "Bitcoin"),
            ("ethereum", "ETH", "Ethereum"),
            ("solana", "SOL", "Solana"),
        ]:
            item = raw_data.get(coin_id, {})
            price = item.get("usd")

            if price is None:
                continue

            coins.append({
                "id": coin_id,
                "symbol": symbol,
                "name": name,
                "price": price,
                "change_24h": item.get("usd_24h_change"),
                "update_at": item.get("last_updated_at"),
            })

        if not coins:
            raise ValueError("Data harga tidak tersedia.")

        result = {
            "ok": True,
            "source": "CoinGecko",
            "fetched_at": int(time.time()),
            "cache_seconds": CACHE_SECONDS,
            "coins": coins,
        }

        _market_cache["timestamp"] = time.time()
        _market_cache["data"] = result

        return jsonify(result)

    except Exception:
        app.logger.exception("Gagal mengambil data pasar.")

        #Jangan menyamarkan data cache lama sebagai data baru.

        if _market_cache["data"] is not None:
            stale = dict(_market_cache["data"])
            stale["stale"] = True
            stale["ok"] = False
            stale["message"] = (
                "Koneksi API gagal. Menampilkan data cache lama."
            )
            return jsonify(stale), 200

        return jsonify({
            "ok": False,
            "message": (
                "Harga pasar belum tersedia. "
                "Periksa koneksi internet atau batas API."
            ),
            "coins": [],
        }), 503

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )

