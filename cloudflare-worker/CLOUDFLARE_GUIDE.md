# 🛡️ Panduan Setup Cloudflare Worker Release Proxy

Panduan ini menjelaskan cara mengamankan repositori privat Anda agar **100% aman dan tidak bisa dicloning/diakses publik**, namun ekstensi Chrome tetap bisa mengecek versi terbaru dan mengunduh file `.zip` rilis secara otomatis.

---

## 🎯 Mengapa Memakai Cloudflare Workers?

1. **Repo GitHub Tetap 100% Private**: Publik/user tidak pernah mengetahui token GitHub, link repo, issue, commit, atau kode sumber Anda.
2. **Download URL Otomatis Terenkripsi**: Worker menghasilkan tautan unduh berbatas waktu resmi dari AWS S3 GitHub (`objects.githubusercontent.com`), sehingga user hanya menerima file zip tanpa bisa melihat repo.
3. **Gratis 100%**: Kuota gratis Cloudflare Workers mencakup hingga **100.000 request per hari** (jauh melampaui kebutuhan ekstensi).

---

## 🔑 Langkah 1: Buat GitHub Access Token (Read-Only)

Token ini hanya boleh memiliki akses membaca (Read-only) ke repositori Anda:

1. Buka [GitHub Token Settings](https://github.com/settings/tokens?type=beta) (Fine-grained personal access tokens).
2. Klik tombol **Generate new token**.
3. Isi kolom:
   - **Token name**: `interview-ext-release-proxy`
   - **Expiration**: Pilih `90 days` atau `Custom` (misal 1 tahun).
   - **Repository access**: Pilih **Only select repositories** -> pilih repo `rivaldiekaptrrr/interview-ext`.
   - **Permissions** -> Klik **Repository permissions**:
     - Cari **Contents** -> Ubah dari *No access* menjadi **Read-only**.
4. Gulir ke paling bawah dan klik **Generate token**.
5. **Salin token** tersebut (dimulai dengan `github_pat_...`). Simpan sementara di notepad.

---

## 🚀 Langkah 2: Deploy Cloudflare Worker

Pilih salah satu metode di bawah ini:

### Cara A: Melalui Dashboard Cloudflare (Paling Mudah, Tanpa Install Apapun)

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) (Daftar/Login akun gratis).
2. Di menu samping kiri, klik **Workers & Pages**.
3. Klik tombol **Create application** -> pilih tab **Workers** -> klik **Create Worker**.
4. Beri nama worker Anda, contoh: `interview-ext-update-proxy`, lalu klik **Deploy**.
5. Setelah terdeploy, klik tombol **Edit code**:
   - Hapus semua kode bawaan di editor sebelah kiri.
   - Buka file [`cloudflare-worker/worker.js`](./worker.js) di repositori ini, salin seluruh kodenya, dan tempelkan ke editor Cloudflare.
   - Klik tombol **Deploy** di pojok kanan atas.
6. Sekarang tambahkan Token GitHub sebagai Secret:
   - Kembali ke halaman detail Worker Anda.
   - Klik tab **Settings** -> pilih menu **Variables and Secrets**.
   - Di bagian **Environment Variables**, klik **Add**.
   - Masukkan:
     - **Variable name**: `GH_TOKEN`
     - Klik tombol **Encrypt** (agar tersimpan aman sebagai Secret).
     - **Value**: Tempelkan token `github_pat_...` yang sudah Anda buat di Langkah 1.
   - *(Opsional)* Jika nama repositori berbeda, tambahkan juga variable `GITHUB_OWNER` dan `GITHUB_REPO`. Jika sama, biarkan default (`rivaldiekaptrrr` dan `interview-ext`).
   - Klik **Deploy**.
7. Salin URL Worker Anda yang ada di bagian atas, contoh:
   `https://interview-ext-update-proxy.subdomain.workers.dev`

---

### Cara B: Melalui Terminal (Wrangler CLI)

Jika Anda menyukai CLI:

```bash
cd cloudflare-worker

# 1. Simpan Token GitHub ke Cloudflare Secret
npx wrangler secret put GH_TOKEN
# (Masukkan token github_pat_... saat diminta)

# 2. Deploy Worker
npx wrangler deploy
```

Setelah selesai, terminal akan menampilkan URL Worker Anda.

---

## 🧪 Langkah 3: Uji Coba Worker

Buka browser Anda dan akses URL Worker:
```text
https://interview-ext-update-proxy.<subdomain>.workers.dev
```

Jika berhasil, Worker akan mengembalikan data JSON rilis terbaru:
```json
{
  "tag_name": "v1.0.3",
  "version": "1.0.3",
  "name": "v1.0.3",
  "download_url": "https://interview-ext-update-proxy.<subdomain>.workers.dev/download",
  "has_assets": true
}
```

Dan jika Anda membuka URL:
```text
https://interview-ext-update-proxy.<subdomain>.workers.dev/download
```
Browser akan langsung mengunduh file `.zip` ekstensi rilis terbaru tanpa membuka GitHub!

---

## 🔌 Langkah 4: Hubungkan ke Ekstensi

1. Buka file [`src/lib/update-checker.ts`](../src/lib/update-checker.ts).
2. Cari baris berikut:
   ```typescript
   export const UPDATE_PROXY_URL = '';
   ```
3. Tempelkan URL Worker Anda:
   ```typescript
   export const UPDATE_PROXY_URL = 'https://interview-ext-update-proxy.<subdomain>.workers.dev';
   ```
4. Build kembali ekstensi Anda jika ingin mempublikasikan versi baru:
   ```bash
   npm run build
   ```

Sekarang ekstensi Anda memiliki sistem pembaruan otomatis yang aman, privat, dan profesional!
