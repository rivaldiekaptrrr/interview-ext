# AI Agent Guidelines & Project Rules — EasyInterview : AI Interview Assistant

Dokumen ini berisi aturan wajib (**mandatory rules**) bagi setiap AI Agent yang bekerja pada repositori `interview-ext`. Setiap perubahan kode, UI, atau arsitektur harus mematuhi panduan berikut.

---

## 1. Prinsip Desain UI: Bersih, Minimalis, dan User-Friendly (Strict)

- **Dilarang Menampilkan Jargon / Badge Teknis ke Pengguna**:
  - Jangan pernah menampilkan istilah internal developer pada UI (misalnya: `⚡ RTC Live`, `DOM CC`, nama protokol WebRTC, Protobuf, DataChannel, engine switcher, dsb.) baik pada **Floating HUD Widget**, **Popup**, maupun **Simulator**.
  - Bagi user, ekstensi ini adalah asisten wawancara yang bekerja secara magis di latar belakang. Semua mekanisme canggih (seperti WebRTC DataChannel interception atau fallback DOM) harus berjalan **100% silent (senyap)** tanpa membebani user dengan status teknis.
- **Stealth & Clean HUD**:
  - Tampilan floating HUD di Google Meet harus seringkas mungkin agar tidak mencurigakan saat screen-sharing dan tidak mengalihkan perhatian kandidat.
  - Cukup tampilkan indikator audio/live yang sederhana dan ramah pengguna (contoh: ikon mikrofon dengan teks status `LIVE`).

---

## 2. Konsistensi Bahasa Jawaban AI & Default Language (Strict)

- **Default Bahasa Adalah English (EN)**:
  - Keadaan default untuk toggle bahasa di semua UI (**Popup**, **Simulator**, **Floating HUD**) adalah **EN (English)**, bukan ID.
  - Default konteks preferensi bahasa (`DEFAULT_CONTEXT.language`) adalah `'en'`.
- **Aturan Ketat Pencocokan Bahasa**:
  - Jika pertanyaan pewawancara dalam **Bahasa Inggris**, jawaban AI **MUTLAK harus dalam Bahasa Inggris** 100%. Jangan pernah menghasilkan jawaban Bahasa Indonesia untuk pertanyaan Bahasa Inggris, begitu pula sebaliknya jika pertanyaan dalam Bahasa Indonesia.
  - Jika profil/resume pengguna ditulis dalam Bahasa Indonesia, AI harus otomatis menerjemahkan dan mengadaptasi detail pengalaman/teknologi tersebut ke dalam Bahasa Inggris secara natural saat menjawab pertanyaan Bahasa Inggris.
  - Pastikan sinkronisasi bahasa antara pengaturan popup, preferensi pengguna, dan simulator selalu terjaga.

---

## 3. Simulator & Reproduksi Realistis

- Setiap fitur penangkapan transkrip baru wajib didukung dan diuji di halaman **Simulator** (`src/demo/simulator.html`).
- Simulator harus mencerminkan kondisi riil Google Meet semirip mungkin tanpa memerlukan intervensi tombol teknis dari user (jalankan mock WebRTC secara otomatis).

---

## 4. Validasi Build & Standar Kode

- Sebelum menyelesaikan tugas atau melakukan commit:
  - Jalankan `npm run build` dan pastikan **0 error** TypeScript (`tsc --noEmit`) dan Vite bundle.
  - Pastikan tidak ada console log debugging liar yang tertinggal di content script.

---

## 5. Prosedur Git Commit Biasa (Standard Commit SOP)

Setiap kali melakukan commit perubahan biasa (tanpa up version):
1. **Verifikasi Build Lokal**: Jalankan `npm run build` dan pastikan 0 error TypeScript & Vite.
2. **Cek Berkas Terbuka & Sensitif**: Periksa `git status` untuk memastikan tidak ada berkas pribadi/rahasia (seperti `*.pdf`, `*.docx`, atau kredensial API) yang ikut ter-stage.
3. **Format Pesan Commit (Conventional Commits)**:
   - `feat(...)`: Fitur baru (contoh: `feat(cv-parser): add full ATS text extraction`)
   - `fix(...)`: Perbaikan bug (contoh: `fix(manifest): remove deprecated background script`)
   - `refactor(...)`: Perubahan struktur kode tanpa mengubah fungsi (contoh: `refactor(ui): clean up dropzone UI`)
   - `docs(...)`: Perubahan dokumentasi saja (contoh: `docs(readme): update user guide links`)
   - `chore(...)`: Perawatan dependensi/konfigurasi (contoh: `chore: update dependencies`)
4. **Eksekusi Git**:
   - `git add <berkas-yang-relevan>`
   - `git commit -m "<tipe>(<lingkup>): <deskripsi singkat>"`
   - `git push origin main` (jika diminta push oleh user).

---

## 6. Prosedur Up Version / Release Bump (Strict Versioning SOP)

Setiap kali user meminta **"up version"**, AI Agent **WAJIB** mengeksekusi langkah-langkah berikut secara berurutan dan disiplin:

1. **4 Berkas Wajib Diubah Secara Bersamaan (Checklist 4 Berkas)**:
   - [`package.json`](./package.json): Ubah `"version": "x.y.z"`
   - [`public/manifest.json`](./public/manifest.json): Ubah `"version": "x.y.z"`
   - [`src/lib/i18n.ts`](./src/lib/i18n.ts): Ubah `version: 'vx.y.z'` pada **KEDUA** objek kamus (`en` dan `id`).
   - [`package-lock.json`](./package-lock.json): Sinkronkan versi dengan menjalankan:
     ```bash
     npm install --package-lock-only
     ```

2. **Validasi Build Wajib (0 Error)**:
   - Jalankan kompilasi lokal untuk memastikan integritas kode sebelum di-push:
     ```bash
     npm run build
     ```
   - Pastikan output menampilkan kompilasi sukses tanpa ada error TypeScript (`tsc --noEmit`) maupun Vite chunking.

3. **Format Commit & Push Standar**:
   - Format pesan commit **MUTLAK**:
     ```bash
     git add package.json package-lock.json public/manifest.json src/lib/i18n.ts
     git commit -m "chore: bump version to vx.y.z"
     git push origin main
     ```

4. **Sistem Rilis Otomatis (CI/CD)**:
   - Begitu di-push ke branch `main`, GitHub Actions (`.github/workflows/release.yml`) akan otomatis membuat rilis tag `vx.y.z` dan mengemas file ZIP installer terbaru (`ai-interview-assistant-vx.y.z.zip`).

