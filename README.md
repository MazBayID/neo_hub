# Neo Hub

Neo Hub adalah dashboard pribadi bergaya futuristik yang sedang dikembangkan menggunakan Python, Flask, HTML, CSS, JavaScript, dan SQLite. Proyek ini masih dalam tahap awal; beberapa bagian antarmuka merupakan placeholder dan belum terhubung ke layanan eksternal.

## Fitur saat ini

- Dashboard dengan tema gelap futuristik.
- Navigasi antarmuka untuk Overview, Markets, Data Vault, Activity, dan Settings.
- Halaman Data Vault terpisah untuk membuat dan melihat catatan.
- Penyimpanan catatan lokal menggunakan SQLite.
- Konfigurasi kunci Flask melalui file lingkungan `.env`.

## Struktur proyek

```text
neo_hub/
├── app.py
├── database.py
├── requirements.txt
├── .env.example
├── .gitignore
├── templates/
│   ├── index.html
│   └── vault.html
└── static/
    ├── script.js
    └── style.css
```

File `.env` dan database `neo_hub.db` dibuat atau disimpan secara lokal dan tidak seharusnya diunggah ke GitHub.

## Persyaratan

- Python 3
- pip
- Koneksi internet untuk memasang dependensi pada penyiapan awal

## Instalasi di Termux (Android)

1. Pasang Python jika belum tersedia:

   ```bash
   pkg update
   pkg install python git
   ```

2. Clone repository dan masuk ke folder proyek:

   ```bash
   git clone https://github.com/MazBayID/neo_hub.git
   cd neo_hub
   ```

   Jika repository sudah ada di perangkat, cukup jalankan `cd ~/neo_hub`.

3. Pasang dependensi:

   ```bash
   python -m pip install -r requirements.txt
   ```

4. Buat file konfigurasi lokal dari contoh:

   ```bash
   cp .env.example .env
   ```

5. Buat kunci rahasia Flask. Perintah berikut menampilkan nilai acak:

   ```bash
   python -c 'import secrets; print(secrets.token_hex(32))'
   ```

   Buka file `.env` dengan editor teks, lalu ganti nilai `SECRET_KEY` dengan hasil perintah tersebut. Jangan membagikan atau mengunggah file `.env`.

## Menjalankan aplikasi

Dari folder proyek, jalankan:

```bash
python app.py
```

Kemudian buka browser Android dan kunjungi:

- Dashboard: http://127.0.0.1:5000/
- Data Vault: http://127.0.0.1:5000/vault

Untuk menghentikan server, tekan `Ctrl+C` di Termux.

## Data dan privasi

- Catatan Data Vault disimpan dalam file lokal `neo_hub.db`.
- File database diabaikan oleh Git melalui aturan `*.db`.
- File rahasia `.env` diabaikan oleh Git.
- Jangan menyimpan kata sandi, token, atau informasi sangat sensitif di Data Vault pada versi ini. Aplikasi belum memiliki autentikasi pengguna atau sistem enkripsi khusus untuk catatan.

## Status pengembangan

- **Dashboard UI:** tersedia sebagai antarmuka awal.
- **Data Vault:** dapat menyimpan dan menampilkan catatan lokal melalui halaman `/vault`.
- **Market data:** belum terhubung ke API; harga real-time belum tersedia.
- **Activity log:** belum diimplementasikan.
- **User accounts and authentication:** belum diimplementasikan.
- **Settings:** masih berupa antarmuka dasar.

## Teknologi

- [Python](https://www.python.org/)
- [Flask](https://flask.palletsprojects.com/)
- [python-dotenv](https://pypi.org/project/python-dotenv/)
- SQLite
- HTML, CSS, JavaScript

## Catatan pengembangan

Neo Hub dikembangkan secara bertahap. Sebelum digunakan untuk data penting atau dibuka ke jaringan publik, tambahkan autentikasi, perlindungan data, validasi keamanan, dan konfigurasi deployment yang sesuai. Server saat ini hanya bind ke `127.0.0.1`, sehingga ditujukan untuk akses lokal dari perangkat yang sama.
