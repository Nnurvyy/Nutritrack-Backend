# ⚡ NutriTrack Backend API 🧠
> **"Serverless, Ringkas, dan Cepat Berbasis Cloudflare Workers & Hono Framework!"**

Repository ini berisi kode backend untuk aplikasi **NutriTrack**. Backend ini dirancang sebagai API Gateway wrapper yang bertugas menangani integrasi kecerdasan buatan (Gemini & Groq), pemrosesan gambar Cloudinary, manajemen enkripsi, serta menjembatani transaksi pembayaran dengan Midtrans Snap secara aman.

---

## 🛠️ Tech Stack & Arsitektur

*   **Runtime**: Cloudflare Workers (V8 Serverless Engine) 🌥️
*   **Framework**: Hono (Ultra-fast, lightweight web framework untuk serverless) 🚀
*   **Language**: TypeScript 💻
*   **Package Manager**: Bun / NPM 📦

---

## 🔒 Fitur Keamanan (Security)
Semua route endpoint dilindungi oleh **Middleware Keamanan** yang memverifikasi header `X-App-Secret`. 
*   Aplikasi mobile mengirimkan token rahasia di setiap request.
*   Jika token tidak disertakan atau salah, server akan mengembalikan respon `401 Unauthorized`.
*   Jika token rahasia belum didefinisikan di environment server, server mengembalikan respon `500 Server Configuration Error`.

---

## 📡 Rincian Service & Endpoint API

### 1. Layanan Pembayaran (Midtrans Service) 💳
Menghubungkan aplikasi ke API Midtrans Snap Sandbox tanpa mengekspos `Server Key` di sisi client mobile.
*   `POST /api/payment/charge`
    *   **Deskripsi**: Membuat transaksi baru (*SNAP Token*) dan mendapatkan URL pengalihan pembayaran.
    *   **Payload (JSON)**:
        ```json
        {
          "orderId": "prem_xxxx_1780000000",
          "grossAmount": 20000,
          "name": "Nama Pengguna",
          "email": "user@email.com"
        }
        ```
*   `GET /api/payment/status/:orderId`
    *   **Deskripsi**: Mengambil status transaksi terbaru dari Midtrans (untuk auto-polling di mobile).

### 2. Layanan Pemrosesan Gambar (Cloudinary Service) 📸
*   Menerima gambar makanan dari client, melakukan upload ke Cloudinary, dan menyimpan URL gambar yang diunggah secara aman.

### 3. Layanan Analisis Makanan AI (Gemini Scanner) 🍎
*   Menganalisis foto makanan yang diunggah dan mengekstrak rincian nutrisinya (kalori, karbohidrat, protein, lemak) menggunakan Google Gemini AI dengan respon format JSON terstruktur yang ketat (*Structured Outputs*).

### 4. Layanan Pencarian Gizi Teks (Groq AI) 🔍
*   Menerima kata kunci makanan berbentuk teks dan menghasilkan estimasi kalori serta makro gizi instan menggunakan model Llama-3 via Groq API.

---

## ⚙️ Cara Menjalankan Secara Lokal (Local Development)

1.  Masuk ke direktori backend:
    ```bash
    cd nutritrack-backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # atau menggunakan bun:
    bun install
    ```
3.  Buat file `.dev.vars` di root folder (`nutritrack-backend/.dev.vars`) untuk konfigurasi lokal:
    ```env
    GROQ_API_KEY=gsk_your_groq_api_key
    GEMINI_API_KEY=your_gemini_api_key
    CLOUDINARY_CLOUD_NAME=your_cloudinary_name
    CLOUDINARY_UPLOAD_PRESET=your_upload_preset
    APP_SECRET_TOKEN=nutritrack-secret-key-123
    MIDTRANS_SERVER_KEY=Mid-server-your_midtrans_key
    MIDTRANS_CLIENT_KEY=Mid-client-your_midtrans_client_key
    ```
4.  Jalankan server pengembangan lokal:
    ```bash
    npm run dev
    # atau menggunakan wrangler secara langsung:
    npx wrangler dev
    ```

---

## 🚀 Cara Mendeploy ke Cloudflare Workers (Production Deployment)

Sebelum melakukan deployment, semua nilai kredensial rahasia yang ada di `.dev.vars` wajib didaftarkan terlebih dahulu ke dalam Cloudflare Dashboard sebagai **Secrets**:

### 1. Daftarkan Secrets:
Jalankan perintah di bawah ini satu per satu dan masukkan nilainya saat diminta:
```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_UPLOAD_PRESET
npx wrangler secret put APP_SECRET_TOKEN
npx wrangler secret put MIDTRANS_SERVER_KEY
npx wrangler secret put MIDTRANS_CLIENT_KEY
```

### 2. Deploy Aplikasi:
Setelah semua secrets terdaftar, deploy backend menggunakan perintah:
```bash
npm run deploy
```
*Wrangler akan otomatis membangun project TypeScript Anda dan meluncurkannya secara langsung di infrastruktur Cloudflare Workers.*
