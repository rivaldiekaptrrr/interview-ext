# AI Agent Guidelines & Project Rules — AI Interview Copilot

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
