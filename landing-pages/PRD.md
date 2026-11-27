# Product Requirements Document (PRD): EasyInterview Landing Page

- **Produk:** EasyInterview — AI Interview Assistant (Chrome Extension)
- **Lokasi Project Website:** `landing-pages/` (Standalone Vite + React + Tailwind CSS)
- **Status Dokumen:** Siap Implementasi (Finalisasi dari sesi `/grill-me` Putaran 1–3)
- **Bahasa Default UI:** English (`EN`), dilengkapi switcher ke Bahasa Indonesia (`ID`)
- **Target Hosting:** Vercel / Netlify / Cloudflare Pages (`docs/` dibiarkan utuh khusus untuk Privacy Policy Chrome Web Store)

---

## 1. Ringkasan Produk & Positioning

### 1.1 Pernyataan Masalah (Problem Statement)
Banyak kandidat yang sebenarnya kompeten tetap gagal saat wawancara Google Meet karena gugup sesaat, kesulitan merangkai jawaban terstruktur di bawah tekanan waktu, atau lupa mengaitkan detail proyek di CV dengan pertanyaan pewawancara. Di sisi lain, solusi asisten wawancara yang terlalu mencolok, lambat, atau mensyaratkan konfigurasi teknis justru mengganggu fokus kandidat saat panggilan berlangsung.

### 1.2 Solusi & Value Proposition
**EasyInterview** adalah ekstensi Chrome khusus Google Meet yang mendengarkan jalannya wawancara secara senyap di latar belakang, membedakan suara kandidat dari pewawancara secara otomatis, lalu menyusun saran jawaban terstruktur berbasis CV kandidat dalam hitungan detik melalui floating HUD yang ringkas.

### 1.3 Positioning Konsumen (Strict Rule)
- **Target Audiens:** Pencari kerja, kandidat profesional, dan fresh graduate di pasar global (`EN`) serta Indonesia (`ID`) yang menjalani wawancara online via Google Meet.
- **Framing Produk:** Consumer SaaS plug-and-play ("Install dari Chrome Web Store, unggah CV, lalu masuk Google Meet").
- **Batasan Komunikasi Mutlak:**
  - **Dilarang** menyebut istilah teknis developer di seluruh halaman (tidak ada kata *WebRTC*, *Protobuf*, *DataChannel*, *DOM CC*, *BYOK*, *API Key*, atau *endpoint*).
  - **Dilarang** menyertakan tautan GitHub, badge Open Source, atau rilis ZIP manual di mana pun pada landing page.
  - **Tanpa Section Harga:** Ekstensi gratis untuk dipasang dari Chrome Web Store; peningkatan paket berbayar dilakukan di dalam ekstensi setelah terpasang. Penjelasan ini diletakkan secara transparan pada FAQ dan teks ekspektasi pasca-klik.

---

## 2. Tujuan Bisnis & Strategi Konversi

Merujuk panduan `landing-page` dan `landing-page-conversion-audit`:

| Metrik / Kriteria | Target & Implementasi |
| :--- | :--- |
| **Satu Penawaran Utama** | Memasang ekstensi Chrome **EasyInterview** untuk pendampingan wawancara Google Meet secara real-time. |
| **Satu Aksi Utama (Primary CTA)** | **`Add to Chrome`** (EN) / **`Pasang di Chrome`** (ID). |
| **URL Placeholder CTA** | Konstanta terpusat `CHROME_WEB_STORE_URL` di `src/config/links.ts` dengan nilai awal placeholder aman (`#install-extension` atau URL dummy terdokumentasi) agar mudah diganti setelah listing Chrome Web Store disetujui. |
| **5-Second Clarity** | Pengunjung langsung memahami dalam 5 detik pertama: (1) Apa produknya, (2) Untuk siapa (kandidat Google Meet), (3) Apa yang terjadi setelah tombol diklik. |
| **Ekspektasi Pasca-Klik** | Di dekat CTA hero tertera catatan singkat yang faktual mengenai alur pasang di Chrome Web Store dan proses mulai dalam 3 langkah (pasang ekstensi, unggah CV, buka Google Meet). |
| **Instrumentasi Analitik** | Event tracking non-intrusif di layer config: `cta_install_click` (parameter lokasi: `navbar`, `hero`, `final_band`), `simulator_question_select`, `simulator_view_switch` (`bullets` vs `script`), `language_switch` (`en` vs `id`), dan `faq_expand`. |

---

## 3. Arsitektur Teknis & Struktur Project (`landing-pages/`)

Project dibangun sebagai aplikasi web mandiri agar terpisah bersih dari source code ekstensi (`src/`) maupun halaman Privacy Policy lama (`docs/`).

### 3.1 Stack Teknologi
- **Build Tool:** Vite (React + TypeScript)
- **Styling:** Tailwind CSS + CSS custom properties (diselaraskan dengan palet produk ekstensi)
- **Routing / Legal View:** Client-side route atau modal ringan untuk `/terms` (*Terms of Service* placeholder) agar tautan footer berfungsi penuh tanpa dead link
- **Aset Visual:** Memanfaatkan ikon resmi [`public/icons/icon-128.png`](file:///c:/Rivaldi/interview-ext/public/icons/icon-128.png) dan tangkapan layar asli ekstensi [`store-assets/cws-screenshot-1-1280x800.png`](file:///c:/Rivaldi/interview-ext/store-assets/cws-screenshot-1-1280x800.png) yang dioptimasi ke format modern (`webp`/`png` terkompresi) di folder aset landing page

### 3.2 Struktur Direktori Target
```text
landing-pages/
├── PRD.md
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── favicon.png
│   └── images/
│       └── easyinterview-meet-preview.webp
└── src/
    ├── config/
    │   └── links.ts              # CHROME_WEB_STORE_URL, PRIVACY_POLICY_URL, SUPPORT_EMAIL
    ├── i18n/
    │   ├── en.ts                 # Kamus utama English (default)
    │   └── id.ts                 # Kamus Bahasa Indonesia natural
    ├── data/
    │   ├── simulatorPresets.ts   # Pertanyaan sampel EN & ID + stream bullets & script
    │   ├── scenarios.ts          # Skenario pengguna nyata (non-fiktif)
    │   └── faq.ts                # Pertanyaan umum instalasi, fitur, privasi, & billing
    ├── components/
    │   ├── Navbar.tsx
    │   ├── HeroSimulator.tsx     # Simulasi interaktif Google Meet + EasyInterview HUD
    │   ├── ProblemSolution.tsx
    │   ├── Capabilities.tsx
    │   ├── HowItWorks.tsx
    │   ├── UseCaseScenarios.tsx
    │   ├── FaqSection.tsx
    │   ├── FinalCta.tsx
    │   ├── Footer.tsx
    │   └── TermsModal.tsx        # Placeholder Terms of Service yang mudah diedit
    ├── App.tsx
    ├── main.tsx
    └── index.css
```

### 3.3 Konstanta Konfigurasi (`src/config/links.ts`)
- `CHROME_WEB_STORE_URL`: Placeholder yang jelas ditandai komentar TODO untuk ditukar saat review CWS selesai.
- `PRIVACY_POLICY_URL`: `https://rivaldiekaptrrr.github.io/interview-ext/` (merujuk kebijakan privasi resmi yang sudah live; ditampilkan dengan label bersih `Privacy Policy` tanpa menyebut GitHub di teks UI).
- `SUPPORT_EMAIL`: `rivaldiekaputr@gmail.com`.

---

## 4. Sistem Desain & Aturan Anti-Slop UI

Menggabungkan token warna asli [`popup.css`](file:///c:/Rivaldi/interview-ext/src/popup/popup.css) dan [`widget.css`](file:///c:/Rivaldi/interview-ext/src/content/widget.css) dengan panduan `impeccable` (Mode **Persuade**), `frontend-design`, `ui-ux-pro-max`, dan `unslop-ui`.

### 4.1 Arah Visual: Clean Light Mode SaaS
- **Mode Tampilan:** Light Mode penuh tanpa toggle dark mode agar kontras, ketenangan visual, dan kesamaan dengan HUD ekstensi terjaga.
- **Prinsip Surface (`Persuade`):** Viewport pertama langsung berfungsi sebagai pembuktian mekanisme kerja produk secara interaktif, bukan sekadar banner teks dengan tombol.

### 4.2 Palet Warna Resmi (Selaras Brand Ekstensi)
```css
:root {
  --surface-page: #f8fafc;
  --surface-card: #ffffff;
  --surface-subtle: #f1f5f9;
  --text-heading: #0f172a;
  --text-body: #334155;
  --text-muted: #64748b;
  --border-subtle: #e2e8f0;
  --border-field: #cbd5e1;
  --brand-solid: #4f46e5;
  --brand-hover: #4338ca;
  --brand-tint: #eef2ff;
  --brand-border: #c7d2fe;
  --brand-text: #3730a3;
  --status-online-bg: #ecfdf5;
  --status-online-border: #a7f3d0;
  --status-online-text: #059669;
  --status-online-dot: #10b981;
}
```

### 4.3 Tipografi Disengaja (Menghindari Font Generik AI)
Mengacu panduan `impeccable`, hindari font klise (*Inter*, *DM Sans*, *Plus Jakarta Sans*, *Space Grotesk*, *Outfit*, *Playfair Display*):
- **Display & Headings:** `Bricolage Grotesque` (600–700 weight, tracking rapat `-0.02em` pada `h1`). Memberi karakter editorial modern tanpa terasa kaku.
- **UI & Body Copy:** `IBM Plex Sans` (400–600 weight, panjang baris baca maksimal `65ch–72ch` agar nyaman dipindai).
- **Keyboard Shortcuts Only:** `JetBrains Mono` khusus untuk badge tombol pintas nyata seperti `Alt+H` dan `Alt+J`.

### 4.4 Aturan Ketat Anti-Slop (`unslop-ui` & `frontend-design`)
Setiap komponen dan baris teks pada landing page wajib lulus filter berikut sebelum dirilis:
1. **Tanpa Eyebrow ALL-CAPS (`U1`):** Dilarang menaruh label huruf kapital kecil di atas setiap judul section.
2. **Penomoran Hanya untuk Urutan Nyata (`U2`):** Label angka `1 / 2 / 3` hanya boleh dipakai di section *How It Works*, dilarang pada card fitur atau skenario.
3. **Tanpa Kalimat Template Bawah CTA (`U3`):** Dilarang menulis *"No credit card required"* atau *"Cancel anytime"* secara generik kecuali menjelaskan alur instalasi gratis & upgrade di ekstensi secara faktual.
4. **Tanpa Ikon Dekoratif Kotak Berwarna & Emoji (`U11`):** Gunakan ikon SVG garis tipis yang fungsional (misalnya Lucide SVG minimal) bila benar-benar membantu identifikasi; hilangkan emoji dari heading maupun daftar fitur.
5. **Tanpa Badge Status Dekoratif (`U9`, `U10`):** Badge indikator `Listening` hijau (`#10b981`) hanya muncul di dalam simulasi Google Meet HUD saat simulasi aktif, bukan sebagai hiasan statis di hero atau kartu.
6. **Tanpa Panah di Label Tombol (`U21`) & Tanpa Link "Learn more" (`U22`):** Teks tombol cukup `Add to Chrome` (tanpa panah `→`), tautan sekunder menggunakan kata yang spesifik seperti `Try interactive preview` atau `Read privacy policy`.
7. **Tanpa Garis Aksen Samping `border-l-4` (`U24`) & Variasi Layout:** Hindari menumpuk seluruh halaman dengan card seragam bersudut sama; selingi area teks bersih, showcase layar produk lebar, dan tabel/grid berstruktur ringan.

---

## 5. Panduan Copywriting & Bilingual (`humanizer` + `humanizer-indonesia`)

### 5.1 Aturan Penulisan English (`en`) & Indonesia (`id`)
- **Bahasa Default:** English (`en`), tersinkronisasi dengan default ekstensi (`DEFAULT_CONTEXT.language = 'en'`).
- **Sentence Case:** Semua judul section dan CTA memakai *sentence case* yang natural, bukan *Title Case* di setiap kata panjang atau huruf kapital penuh.
- **Aktif & Konkret:** Jelaskan manfaat yang langsung dirasakan kandidat saat wawancara berlangsung.
- **Pantangan Teks:**
  - Nol em-dash (`—`) maupun spaced hyphen (` - `) di tengah kalimat.
  - Nol titik dua (`:`) di tengah kalimat narasi.
  - Hindari kata klise AI (*unlock*, *empower*, *elevate*, *seamless*, *game-changer*, *revolutionize*, *delve*, *crucial*) maupun kalke bahasa Indonesia (*dalam rangka*, *oleh karena itu*, *yang tidak kalah penting*, *membuka potensi penuh*).
- **Kejujuran Penuh (`Q11=A`):** Dilarang mencantumkan testimoni fiktif, angka ribuan pengguna buatan, rating bintang palsu, maupun logo perusahaan tempat kerja kandidat yang tidak terverifikasi.

---

## 6. Spesifikasi Tiap Section & Draf Konten Resmi (EN & ID)

### Section 1: Sticky Navbar
- **Elemen (kiri ke kanan):**
  1. Brand lockup: Ikon produk [`icon-128.png`](file:///c:/Rivaldi/interview-ext/public/icons/icon-128.png) + teks `EasyInterview`
  2. Navigasi jangkar (maksimal 3–4 tautan bersih): `Features`, `How it works`, `Scenarios`, `FAQ` (ID: `Fitur`, `Cara kerja`, `Skenario`, `FAQ`)
  3. Toggle bahasa ringkas: `EN | ID` (target klik minimal `44x44px`, `aria-pressed`)
  4. CTA kanan: `Add to Chrome` (ID: `Pasang di Chrome`)
- **Mobile (`< 768px`):** Menu terkompresi rapi dengan tombol bahasa + CTA utama tetap terlihat mudah tanpa horizontal scroll.

---

### Section 2: Hero + Interactive Live Simulator (`Above the Fold`)
Merupakan inti pembuktian produk (`Persuade` surface). Di viewport desktop, sisi kiri memuat tesis produk dan CTA utama; sisi kanan (atau tepat di bawahnya pada mobile `390x844`) memuat **Interactive Google Meet + EasyInterview HUD Preview**.

#### Draf Teks Hero
- **Headline (`h1`):**
  - `EN`: **Answer Google Meet interview questions clearly using your own resume.**
  - `ID`: **Jawab pertanyaan wawancara Google Meet lebih tenang dengan bekal CV Anda sendiri.**
- **Subheadline (2 kalimat pendek):**
  - `EN`: EasyInterview listens quietly during your call, separates the interviewer's voice from yours, and drafts structured answers tailored to your background. Install from the Chrome Web Store, upload your CV once, and stay focused on the conversation.
  - `ID`: EasyInterview mendengarkan panggilan secara senyap, membedakan suara Anda dari pewawancara, lalu menyusun saran jawaban yang sesuai dengan riwayat kerja Anda. Pasang dari Chrome Web Store, unggah CV sekali, dan fokus pada percakapan.
- **Action Group:**
  - **Primary CTA:** `Add to Chrome` (ID: `Pasang di Chrome`) -> mengarah ke `CHROME_WEB_STORE_URL`
  - **Secondary Action (Non-competing):** `Watch how it works` (scroll halus ke `#how-it-works`) atau fokus ke widget simulasi di sebelah
- **Post-Click Expectation & Trust Microcopy (tepat di bawah CTA):**
  - `EN`: Free to install on Chrome. In-extension plans available when you are ready for live calls. Works in English and Indonesian on Google Meet.
  - `ID`: Gratis dipasang di Chrome. Paket berbayar tersedia di dalam ekstensi saat Anda siap menggunakannya untuk wawancara. Mendukung Bahasa Inggris dan Indonesia di Google Meet.

#### Spesifikasi Interactive Google Meet + EasyInterview HUD Preview
Simulasi ini berjalan langsung di browser pengunjung tanpa izin mikrofon apa pun, merespons pilihan bahasa `EN` / `ID` di navbar secara real-time.
1. **Frame Google Meet Simulasi:**
   - Menampilkan dua kartu peserta sederhana: **Interviewer** (aktif saat pertanyaan diputar) dan **You (Candidate)**.
   - Menampilkan status realistis ketika kandidat berbicara: simulator mendemonstrasikan bahwa ucapan Anda sendiri diabaikan agar jawaban tidak terpicu oleh suara Anda sendiri.
2. **Pilihan Pertanyaan Interaktif (2–3 Preset Tombol):**
   - Preset 1 (`EN` / `ID`): Behavioral & Introduction (*"Tell me about a time you solved a difficult problem under a tight deadline."* / *"Ceritakan saat Anda menyelesaikan masalah sulit dengan tenggat waktu ketat."*)
   - Preset 2 (`EN` / `ID`): Role & Technical Depth (*"How did you decide what to prioritize when scaling your previous project?"* / *"Bagaimana cara Anda menentukan prioritas saat menangani peningkatan skala proyek?"*)
   - Preset 3 (`EN` / `ID`): Collaboration & Conflict (*"Tell me about a disagreement with a teammate and how you reached a solution."* / *"Ceritakan ketidaksepakatan dengan rekan kerja dan bagaimana Anda menyelesaikannya."*)
3. **Panel Floating HUD EasyInterview (di dalam frame simulasi):**
   - Mengadaptasi visual frosted-light [`widget.css`](file:///c:/Rivaldi/interview-ext/src/content/widget.css) dengan indikator `Listening` saat pertanyaan masuk.
   - Streaming teks transkrip pertanyaan pewawancara -> jeda singkat -> streaming jawaban terstruktur (STAR Method) berdasarkan contoh profil CV kandidat.
   - Toggle tampilan di dalam HUD: **`Key Bullet Points`** (default untuk dibaca sekilas tanpa terdengar membaca teks) dan **`Full Script`** (untuk konteks lengkap).
   - Petunjuk shortcut nyata yang interaktif/terbaca di footer HUD: `Alt+H` (sembunyikan HUD seketika) dan `Alt+J` (picu jawaban instan).

---

### Section 3: Problem -> Solution
Menjembatani kondisi kandidat sebelum dan sesudah memakai EasyInterview tanpa drama berlebihan.
- **Heading (`h2`):**
  - `EN`: **Stay composed when an unexpected question catches you off guard**
  - `ID`: **Tetap tenang saat pertanyaan tak terduga datang di tengah wawancara**
- **Struktur 2 Kolom Kontras Ringan:**
  - **Without structure (Tanpa panduan terstruktur):** Pikiran mendadak kosong saat pewawancara bertanya contoh kasus, cerita berputar tanpa poin hasil yang jelas, dan Anda lupa mencantumkan pencapaian penting yang sebenarnya sudah tertulis di CV.
  - **With EasyInterview beside your call (Dengan EasyInterview di samping panggilan):** Pertanyaan pewawancara langsung diringkas menjadi kerangka Situation, Task, Action, dan Result yang diambil dari pengalaman Anda sendiri, sehingga Anda bisa menjawab dengan nada bicara alami.

---

### Section 4: Core Capabilities & Product Visual Showcase
Memadukan tampilan tangkapan layar asli [`cws-screenshot-1-1280x800.png`](file:///c:/Rivaldi/interview-ext/store-assets/cws-screenshot-1-1280x800.png) sebagai visual produk nyata bersama 5 kapabilitas inti yang memang ada di ekstensi:

- **Heading (`h2`):**
  - `EN`: **Built to stay out of your way during Google Meet calls**
  - `ID`: **Dirancang agar tidak mengganggu konsentrasi Anda saat Google Meet**
- **5 Kapabilitas Utama (Bahasa Manfaat Pengguna, Nol Jargon Teknis):**
  1. **Automatic speaker separation (Pemisah suara otomatis):** Ekstensi mengenali kapan Anda berbicara dan kapan pewawancara bertanya, baik dalam wawancara satu lawan satu maupun panel beberapa orang, sehingga saran jawaban hanya muncul untuk pertanyaan mereka.
  2. **CV and target role personalization (Jawaban sesuai CV dan posisi tujuan):** Unggah CV format PDF atau DOCX sekali di dalam ekstensi, lalu isi posisi dan nama perusahaan tujuan agar setiap saran jawaban mengutip proyek serta angka pencapaian Anda sendiri.
  3. **Bullet points and full script modes (Poin ringkas dan skrip lengkap):** Pilih tampilan poin cepat supaya kontak mata Anda tetap terjaga di kamera, atau buka skrip lengkap beserta pilihan gaya jawaban STAR, ringkas, dan teknis.
  4. **Bilingual EN and ID language matching (Selaras Bahasa Inggris dan Indonesia):** Jika pewawancara bertanya dalam Bahasa Inggris meski CV Anda ditulis dalam Bahasa Indonesia, EasyInterview menyesuaikan pengalaman Anda ke Bahasa Inggris secara alami.
  5. **Discreet HUD with instant keyboard shortcuts (HUD ringkas dengan tombol pintas cepat):** Atur posisi dan ukuran panel di layar Google Meet, tekan `Alt+H` untuk menyembunyikan panel seketika, atau tekan `Alt+J` saat ingin meminta saran jawaban secara manual.

---

### Section 5: How It Works (True 3-Step Sequence)
Satu-satunya section yang menggunakan penomoran berurutan `1`, `2`, `3`.
- **Heading (`h2`):**
  - `EN`: **Ready in three simple steps**
  - `ID`: **Siap digunakan dalam tiga langkah sederhana**
- **Langkah 1 (`Add EasyInterview to Chrome`):** Pasang ekstensi langsung dari Chrome Web Store ke browser Chrome Anda.
- **Langkah 2 (`Upload your CV and interview role`):** Buka popup ekstensi, unggah file PDF atau DOCX CV Anda, masukkan posisi yang dilamar, dan pilih preferensi bahasa atau gaya jawaban.
- **Langkah 3 (`Join your Google Meet call`):** Panel asisten muncul dengan rapi di ruang rapat dan langsung mendengarkan pertanyaan pewawancara secara otomatis.

---

### Section 6: Use-Case Scenarios & Trust Architecture (Pengganti Testimoni Fiktif)
Sesuai keputusan `Q11=A`, tidak ada rating bintang, jumlah pengguna buatan, maupun kutipan testimoni palsu. Sebagai gantinya, tampilkan skenario wawancara konkret dan pilar kepercayaan yang dapat diverifikasi.

- **Heading (`h2`):**
  - `EN`: **How candidates prepare across different interview rounds**
  - `ID`: **Cara kandidat memanfaatkannya di berbagai tahap wawancara**
- **3 Skenario Nyata:**
  1. **Technical and Engineering Interviews:** Membantu menyusun penjelasan arsitektur sistem, debugging insiden produksi, dan trade-off teknis dari daftar proyek CV tanpa bertele-tele.
  2. **Product, Business, and Operations Rounds:** Menyusun jawaban studi kasus dan pertanyaan behavioral berbasis metode STAR lengkap dengan metrik dampak yang relevan dengan peran tujuan.
  3. **Fresh Graduates and Cross-Border Applicants:** Membantu lulusan baru merapikan pengalaman magang atau proyek kuliah menjadi jawaban profesional berbahasa Inggris maupun Indonesia secara percaya diri.
- **Trust Architecture Bar (4 Pilar Jujur & Terverifikasi):**
  - **Google Meet Ready:** Dibangun khusus mengikuti alur panggilan Google Meet tanpa perlu menyalakan teks takarir di layar rapat.
  - **Local-First Browser Storage:** CV, riwayat transkrip wawancara, dan pengaturan Anda disimpan secara lokal di penyimpanan browser Anda sendiri.
  - **Zero Ad Trackers:** Tanpa pelacak iklan pihak ketiga dan tanpa penjualan data CV maupun percakapan Anda.
  - **Bilingual Support:** Mendukung Bahasa Inggris secara default dan Bahasa Indonesia kapan saja dibutuhkan.

---

### Section 7: FAQ (Instalasi, Monetisasi Dalam Ekstensi, Privasi, & Refund)
Dirancang mengikuti standar AEO/SEO (`landing-page` & `seo`) dengan format `<details>`/`<summary>` atau accordion aksesibel (`aria-expanded`, `aria-controls`).

1. **Is EasyInterview free to install, and how does payment work?**
   - *EN:* Yes, installing EasyInterview from the Chrome Web Store is free. Once installed, you can open the extension to explore setup and choose a paid plan directly inside the extension when you want to use it for interviews.
   - *ID:* Ya, pemasangan EasyInterview dari Chrome Web Store gratis. Setelah terpasang, Anda dapat membuka ekstensi untuk mengatur profil dan memilih paket berbayar langsung di dalam ekstensi saat ingin menggunakannya.
2. **Does it work without turning on Google Meet captions on screen?**
   - *EN:* Yes. EasyInterview listens quietly in the background during Google Meet calls, so you do not have to keep screen captions enabled or interrupt your call layout.
   - *ID:* Ya. EasyInterview mendengarkan panggilan secara senyap di latar belakang sehingga Anda tidak perlu menyalakan takarir (captions) di layar Google Meet.
3. **What happens if I share my screen or want to hide the window quickly?**
   - *EN:* Press `Alt+H` at any time to hide or bring back the floating panel immediately. When presenting your screen during a technical interview, we recommend sharing a specific application window or browser tab rather than your entire monitor.
   - *ID:* Tekan `Alt+H` kapan saja untuk menyembunyikan atau memunculkan kembali panel secara instan. Saat harus membagikan layar di wawancara teknis, kami menyarankan membagikan satu jendela aplikasi atau tab tertentu, bukan seluruh layar monitor.
4. **How does EasyInterview handle my CV and interview transcripts?**
   - *EN:* Your resume text, target job context, and meeting transcripts stay stored locally inside your browser. EasyInterview does not use ad trackers or sell your personal information. You can review the full details in our Privacy Policy.
   - *ID:* Teks CV, target posisi, dan transkrip wawancara disimpan secara lokal di browser Anda. EasyInterview tidak menggunakan pelacak iklan maupun menjual data pribadi Anda. Rincian lengkapnya tersedia di halaman Privacy Policy.
5. **Can it help if my CV is in Indonesian while the interview is in English?**
   - *EN:* Yes. If the interviewer asks in English, EasyInterview automatically drafts your answer in English while translating and adapting relevant experience from your Indonesian resume.
   - *ID:* Bisa. Jika pewawancara bertanya dalam Bahasa Inggris, EasyInterview otomatis menyusun jawaban dalam Bahasa Inggris dengan mengadaptasi pengalaman dari CV berbahasa Indonesia Anda.
6. **Does it work for panel interviews with multiple interviewers?**
   - *EN:* Yes. It tracks incoming voices automatically, ignores when you are speaking, and collects the interviewer's question before drafting a response.
   - *ID:* Ya. Ekstensi mengenali suara peserta lain, mengabaikan saat Anda sedang berbicara, lalu merangkai konteks pertanyaan sebelum menyusun saran jawaban.
7. **How do billing support and refund requests work for in-extension plans?**
   - *EN:* All billing support, subscription questions, and refund inquiries are handled directly via email at `rivaldiekaputr@gmail.com`. Please include the email linked to your plan and a brief note on your request, and our support team will respond with clear next steps.
   - *ID:* Bantuan penagihan, pertanyaan langganan, dan pengajuan refund untuk paket di dalam ekstensi ditangani langsung melalui email ke `rivaldiekaputr@gmail.com`. Sertakan email yang terdaftar pada paket Anda beserta rincian singkat kendala agar dapat segera diproses.

---

### Section 8: Final CTA Band
- **Heading (`h2`):**
  - `EN`: **Walk into your next Google Meet interview prepared**
  - `ID`: **Hadapi wawancara Google Meet berikutnya dengan lebih siap**
- **Supporting line:**
  - `EN`: Install EasyInterview from the Chrome Web Store and tailor your first answer framework in minutes.
  - `ID`: Pasang EasyInterview dari Chrome Web Store dan siapkan kerangka jawaban berbasis CV Anda dalam hitungan menit.
- **CTA Button:** `Add to Chrome` (ID: `Pasang di Chrome`) -> identik dengan Hero CTA (`CHROME_WEB_STORE_URL`).

---

### Section 9: Footer
- **Kolom Kiri:** Logo + `EasyInterview` + deskripsi 1 kalimat singkat (`Real-time interview assistance for Google Meet.`).
- **Kolom Navigasi:** Anchor links (`Features`, `How it works`, `Scenarios`, `FAQ`).
- **Kolom Legal & Support:**
  - `Privacy Policy` -> tautan ke `https://rivaldiekaptrrr.github.io/interview-ext/` (buka tab baru `rel="noopener noreferrer"` tanpa label atau ikon GitHub)
  - `Terms of Service` -> membuka modal/route `/terms` berisi kerangka Terms of Service standar SaaS (hak guna ekstensi, kewajiban pengguna menjaga etika wawancara, ketentuan pembayaran dalam ekstensi & refund, batasan tanggung jawab) agar siap dilengkapi saat rilis komersial
  - `Support`: [`rivaldiekaputr@gmail.com`](mailto:rivaldiekaputr@gmail.com)
- **Baris Bawah:** Copyright `© 2026 EasyInterview. All rights reserved.`

---

## 7. Persyaratan SEO, Aksesibilitas & Performa

### 7.1 SEO & Structured Data (`seo` skill)
- **`<title>` (54 karakter):** `EasyInterview | AI Interview Assistant for Google Meet`
- **`<meta name="description">` (150–160 karakter):** `Prepare clearer answers during live Google Meet interviews. EasyInterview listens quietly, reads your CV, and drafts structured STAR responses in Chrome.` (155 karakter)
- **Heading Hierarchy:** Tepat satu `<h1>` pada Hero; semua section memakai `<h2>` dan sub-item memakai `<h3>` secara berurutan.
- **Meta & Social Tags:** `canonical`, `og:title`, `og:description`, `og:type="website"`, `og:image`, dan `twitter:card="summary_large_image"`.
- **JSON-LD Schema:**
  1. `SoftwareApplication` (`applicationCategory: "BrowserApplication"`, `operatingSystem: "Chrome"`, `offers` mencantumkan gratis pasang dengan pembelian dalam ekstensi)
  2. `FAQPage` (mengindeks 7 pertanyaan FAQ utama agar memenuhi syarat rich result / AI answer citations)
- **File Pendukung:** `public/robots.txt` dan `public/sitemap.xml`.

### 7.2 Aksesibilitas & Performa (`ui-ux-pro-max` & `web-design-guidelines`)
- **Kontras:** Minimal `4.5:1` untuk seluruh teks normal dan `3:1` untuk elemen UI/border interaktif (`#0f172a` dan `#334155` di atas `#ffffff` / `#f8fafc`).
- **Navigasi Keyboard & Focus:** Focus ring `#4f46e5` yang terlihat jelas pada seluruh tombol, toggle bahasa, preset simulator, dan accordion FAQ (`tabIndex`, `focus-visible`).
- **Touch Target:** Seluruh elemen interaktif minimal `44x44px` terutama di viewport mobile `390x844`.
- **Zero Horizontal Overflow:** Verifikasi layout penuh di breakpoint `390px` (mobile), `768px` (tablet), dan `1280px+` (desktop).
- **Reduced Motion:** Mendukung `@media (prefers-reduced-motion: reduce)` dengan mematikan animasi streaming bertahap sehingga teks tampil seketika saat preferensi sistem diaktifkan.
- **Core Web Vitals Target:** LCP < `2.5s`, CLS < `0.1` (dimensi gambar eksplisit `width` & `height`, simulator container memiliki `min-height` tetap agar layout tidak bergeser saat streaming berjalan).

---

## 8. Rencana Implementasi & Checklist Verifikasi Build

1. **Inisialisasi Project:** Buat scaffold Vite + React + TypeScript + Tailwind di `landing-pages/` dengan konfigurasi `src/config/links.ts`.
2. **Design Tokens & Typography:** Pasang `Bricolage Grotesque`, `IBM Plex Sans`, dan `JetBrains Mono` serta token warna brand di `index.css`.
3. **Bilingual Engine & Data:** Implementasikan `en.ts` (default), `id.ts`, `simulatorPresets.ts`, dan `faq.ts` sesuai panduan anti-slop (`humanizer` & `humanizer-indonesia`).
4. **Komponen & Simulasi Interaktif:** Bangun komponen section dengan fokus utama pada `HeroSimulator.tsx` dan `TermsModal.tsx`.
5. **Audit Pra-Rilis Wajib:**
   - Jalankan `npm run build` dan `tsc --noEmit` hingga `0 error`.
   - Audit copy untuk memastikan **0 tautan/sebutan GitHub**, **0 istilah teknis WebRTC/API Key/BYOK**, **0 testimoni palsu**, **0 em-dash/kata klise AI**, dan **0 badge dekoratif**.
   - Verifikasi visual & fungsional di viewport desktop (`1280x800`) serta mobile (`390x844`) termasuk menguji toggle `EN`/`ID`, seluruh preset simulator, FAQ accordion, dan modal Terms of Service.
