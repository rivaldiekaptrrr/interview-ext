# 🚀 Panduan Rilis Versi Baru (Release Guide)

Panduan ini mendokumentasikan berkas-berkas yang wajib diperbarui dan langkah-langkah standar setiap kali Anda ingin merilis versi baru **EasyInterview : AI Interview Assistant**.

---

## 📋 Berkas yang Wajib Diubah (Version Bump Checklist)

Ketika menaikkan versi (misal dari `1.0.0` ke `1.0.1` atau `1.1.0`), perbarui berkas berikut:

| No | Lokasi Berkas | Baris / Bagian yang Diubah | Nilai Contoh |
|:---|:---|:---|:---|
| 1 | [`package.json`](./package.json) | `"version": "1.0.1"` | SemVer (`major.minor.patch`) |
| 2 | [`public/manifest.json`](./public/manifest.json) | `"version": "1.0.1"` | Versi ekstensi Chrome Manifest V3 |
| 3 | [`src/lib/i18n.ts`](./src/lib/i18n.ts) *(Opsional)* | `version: 'v1.0.1'` | String versi yang tampil di UI Header Popup |

---

## 🛠️ Langkah Demi Langkah Merilis Versi Baru

### 1. Ubah Nomor Versi di Berkas Terkait
Buka dan ubah nomor versi di [`package.json`](./package.json) dan [`public/manifest.json`](./public/manifest.json).

### 2. Verifikasi Kompilasi Lokal (Wajib)
Pastikan tidak ada error TypeScript maupun bundling Vite sebelum di-push:
```bash
npm run build
```
> Pastikan output menampilkan pesan sukses dan folder `dist/` berhasil ter-generate.

### 3. Commit & Push ke Cabang `main`
Cukup commit perubahan versi tersebut lalu push ke GitHub:
```bash
git add package.json public/manifest.json src/lib/i18n.ts
git commit -m "chore: bump version to v1.0.1"
git push origin main
```

---

## 🤖 Apa yang Dilakukan GitHub Actions Secara Otomatis?

Begitu Anda melakukan `git push origin main`, alur kerja CI/CD di [`.github/workflows/release.yml`](./.github/workflows/release.yml) akan **langsung otomatis bekerja**:

1. **Checkout & Setup**: Mengambil kode terbaru dan menyiapkan Node.js v20.
2. **Build Ekstensi**: Menjalankan `npm ci` dan `npm run build` di server Ubuntu.
3. **Ekstrak Versi**: Otomatis membaca nomor versi dari `package.json` (menjadi tag `v1.0.1`).
4. **Packaging ZIP**:
   - Memampatkan isi folder `dist/` menjadi **`ai-interview-assistant-v1.0.1.zip`**.
   - Menyediakan juga berkas **`ai-interview-assistant-latest.zip`**.
5. **Publish GitHub Release**:
   - Membuat halaman rilis baru di tab **Releases** GitHub Anda.
   - Melampirkan kedua berkas `.zip` di atas.
   - Menghasilkan *release notes* perubahan secara otomatis.

---

## 🔍 Cara Verifikasi Setelah Push

1. **Pantau Proses Build**:
   Buka: 👉 `https://github.com/rivaldiekaptrrr/interview-ext/actions`
   *(Tunggu hingga workflow "Release Chrome Extension Bundle" bercentang hijau ✅)*

2. **Cek Berkas Rilis**:
   Buka: 👉 `https://github.com/rivaldiekaptrrr/interview-ext/releases`
   *(Pastikan versi baru sudah terbit dengan berkas `.zip` yang siap diunduh)*

3. **Cek Cloudflare Worker Update Proxy**:
   Buka: 👉 `https://interview-ext-update-proxy.pbagong75.workers.dev/`
   *(Pastikan versi `tag_name` terbaru sudah muncul, sehingga seluruh pengguna ekstensi akan otomatis mendeteksi update)*
