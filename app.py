from flask import Flask, render_template, request, redirect, url_for, flash
import database

app = Flask(__name__)

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
        flash("Catatan berhasil disimpan!", "success")
    else:
        flash("Judul dan isi catatan wajib diisi.", "error")

    return redirect(url_for("vault"))

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)



