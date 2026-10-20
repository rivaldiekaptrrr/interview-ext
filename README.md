<p align="center">
  <img src="./public/icons/icon-128.png" width="96" height="96" alt="AI Interview Copilot Logo" />
</p>

<h1 align="center">AI Interview Copilot</h1>

<p align="center">
  <strong>Real-Time AI Assistant for Technical & Behavioral Interviews on Google Meet</strong><br>
  <em>Powered by Chrome Extension Manifest V3, Web Streams, and Multi-Provider LLMs</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=googlechrome&logoColor=white" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT" />
</p>

<p align="center">
  🌐 <strong>Select Language / Pilih Bahasa:</strong><br>
  <b><a href="#-english-documentation">English (Default)</a></b> &nbsp;|&nbsp; <b><a href="#-dokumentasi-bahasa-indonesia">Bahasa Indonesia</a></b>
</p>

---

<a name="-english-documentation"></a>
# 🇬🇧 English Documentation

> **AI Interview Copilot** is a discreet, ultra-responsive Chrome Extension designed to pair-program and co-pilot with you during live technical and behavioral interviews on **Google Meet**. It captures interviewer questions directly from closed captions (`CC`), cross-references your actual **Resume & Experience**, and streams structured answers (**STAR method** key points + natural speaking scripts) onto an isolated, translucent floating HUD.

> 📖 **Looking for a step-by-step walkthrough?** Check out the comprehensive **[User Guide (USER_GUIDE.md)](./USER_GUIDE.md)**.

---

### 📑 Table of Contents (English)
- [📖 Complete User Guide (Deep Dive)](./USER_GUIDE.md)
- [✨ Key Features](#-key-features)
- [🖥️ System Prerequisites](#️-system-prerequisites)
- [📦 Installation & Setup Guide](#-installation--setup-guide)
- [⚙️ Initial Configuration (Popup)](#️-initial-configuration-popup)
- [🧪 Testing with Google Meet Simulator](#-testing-with-google-meet-simulator)
- [🎙️ Live Usage in Google Meet](#️-live-usage-in-google-meet)
- [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
- [📂 Architecture & Repository Layout](#-architecture--repository-layout)
- [🔒 Privacy & Local Security](#-privacy--local-security)

---

### ✨ Key Features

- **🎙️ Zero-Invasive Live Caption Capture**: Hooks directly into Google Meet closed captions (`jsname="YSxPC"`) via `MutationObserver`. No audio recording or permission popups required.
- **🤖 Universal Multi-Provider AI Support**:
  - **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini`, etc.
  - **Google Gemini**: `gemini-2.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`.
  - **Anthropic Claude**: `claude-3-5-sonnet`, `claude-3-haiku`, etc.
  - **Custom / Local AI**: Ollama, vLLM, LM Studio, Groq, DeepSeek, OpenRouter via OpenAI-compatible endpoints.
- **📋 Resume & Persona Grounding**: Injects your resume, career milestones, tech stack, and achievements into the system prompt. Answers reflect your authentic background rather than generic textbook responses.
- **🪟 85% Translucent Glass HUD (Shadow DOM)**:
  - Rendered entirely inside an isolated **Shadow DOM**, completely immune to Google Meet CSS pollution.
  - 85% opacity frosted glass aesthetic that remains easy to read without blocking meeting participants.
  - Freely **draggable** and **resizable** to any corner of your monitor.
  - **Dual-Layer Answer Card**: Instant bullet points for quick glance + expandable full script for continuous talking points.
  - **Auto-Debouncer**: Waits for natural pauses (1.8s of silence) before autonomously querying the AI.
- **🌐 Real-Time Bilingual UI (EN / ID)**: English by default with an instantaneous `EN / ID` pill toggle in both the Popup and Simulator. Synchronizes across all browser tabs via `chrome.storage.onChanged`.
- **🔄 In-App Auto Update & Private Cloudflare Proxy**: Automatically detects new releases and lets you download the latest ZIP with 1 click. Powered by a private Cloudflare Worker proxy to protect the repository from public exposure.
- **🎮 Built-In E2E Google Meet Simulator**: Full-fidelity testing sandbox replicating Google Meet UI, synthesized interviewer voices (Web Speech API), and live CC streaming.
- **⌨️ Boss Key Protection**: One-key emergency toggles to instantly hide the HUD during screen shares.

---

### 🖥️ System Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20+` LTS recommended).
- **Package Manager**: `npm` (bundled with Node.js).
- **Chromium-based Browser**: Google Chrome, Microsoft Edge, Brave, or Arc.
- *(Optional)* **Python 3**: If regenerating multi-size PNG icons from the master SVG asset.

---

### 📦 Installation & Setup Guide

#### Option A: Quick Install via ZIP Archive (No Coding Required ⭐)
1. Download the latest release `.zip` directly via the secure proxy link:
   👉 **[Download Latest AI Interview Copilot ZIP](https://interview-ext-update-proxy.pbagong75.workers.dev/download)**
2. Unzip/extract the downloaded archive into a permanent folder on your computer.
3. Install into your preferred browser:
   - **Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi, Arc**:
     - Navigate to `chrome://extensions/` (or `edge://extensions/`).
     - Enable **Developer mode** in the top-right corner.
     - Click **Load unpacked** and select the unzipped folder.
   - **Mozilla Firefox & Zen Browser**:
     - Navigate to `about:debugging#/runtime/this-firefox`.
     - Click **Load Temporary Add-on...** and select the `manifest.json` file inside the unzipped folder.
4. Pin **AI Interview Copilot** to your browser toolbar for fast access!
5. **Future Updates**: Whenever a new version is released, the extension popup will automatically show an **"Update Available"** banner with a 1-click Download button!

#### Option B: Build from Source Code (For Developers)

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/interview-ext.git
cd interview-ext

# 2. Install dependencies
npm install

# 3. Compile distribution bundle
npm run build
```

Then load the compiled `dist/` directory into Chrome:
1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose the `dist` folder inside the project.

---

### ⚙️ Initial Configuration (Popup)

Click the **AI Interview Copilot** extension icon in your browser toolbar to open settings:

#### 1. Settings Tab (`⚙️ Settings`)
- **AI Model Provider**: Select OpenAI, Google Gemini, Anthropic Claude, or Custom Endpoint.
- **API Key**: Enter your secret API key (stored securely and locally in `chrome.storage.local`).
- **Model Name**: Choose your preferred model (e.g. `gemini-2.5-flash` or `gpt-4o`).
- **Connection Test**: Click **"Test Connection"** to verify latency and API connectivity.
- **Save**: Click **"Save Settings"**.

#### 2. Resume & Context Tab (`📋 Resume & Context`)
- **Target Position**: Specify the target job title (e.g., *Senior Frontend Engineer*).
- **Target Company**: Enter company name (e.g., *Google*, *Stripe*).
- **Resume Summary**: Paste work experiences, core technologies, and major achievements.
- **Answer Tone**: Choose between **STAR Method**, **Concise & Direct**, or **Deep Technical**.
- **Save**: Click **"Save Context"**.

---

### 🧪 Testing with Google Meet Simulator

You do not need to wait for a real interview to test the extension:
1. Open the extension popup from your Chrome toolbar.
2. Click **"Open Meet Simulator"** in the top demo banner.
3. An authentic Google Meet testing room will open.
4. Open the side drawer (**Scenarios & Context**) and click any sample question (e.g. *Behavioral*, *High Traffic*, or *STAR Conflict*).
5. The simulated interviewer will speak out loud, live closed captions will appear at the bottom, and the **Floating HUD** will stream structured answers automatically!

---

### 🎙️ Live Usage in Google Meet

1. Join your scheduled interview on **[Google Meet](https://meet.google.com)**.
2. **Important Requirement**: Turn on Closed Captions (CC) by pressing keyboard key **`c`** or clicking the **CC icon** in Google Meet's bottom control bar.
3. The **AI Interview Copilot HUD** will automatically mount onto the page.
4. As the interviewer asks questions, live speech preview appears on the HUD header.
5. Once speech ends, AI answers will stream seamlessly in real time.

---

### ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`Alt + H`** | **Boss Key (Toggle HUD)** | Instantly hides/shows the floating widget (crucial when sharing screen). |
| **`Alt + J`** | **Answer Now** | Forces the AI to generate an answer immediately without waiting for silence. |
| **`c`** | **Google Meet CC** | Native Google Meet shortcut to activate closed captions. |

---

### 📂 Architecture & Repository Layout

```text
interview-ext/
├── public/
│   ├── icons/             # 16, 32, 48, 128px PNGs + master SVG icon
│   └── manifest.json      # Chrome Extension Manifest V3 declaration
├── scripts/
│   └── generate-icons.py  # Headless Chromium high-res icon rasterizer
├── src/
│   ├── ailogo/            # Clean SVG vectors for AI providers & brand icon
│   ├── background/        # Manifest V3 service worker, stream broker, hotkeys
│   ├── content/           # MutationObserver CC scraper & Shadow DOM floating HUD
│   ├── demo/              # Google Meet E2E testbed (simulator.html, css, ts)
│   ├── lib/               # Types, i18n dictionary, storage sync, AI clients
│   └── popup/             # React settings & resume management interface
├── package.json
├── tsconfig.json
├── vite.config.ts         # Multi-entry Vite bundler configuration
└── README.md
```

---

### 🔒 Privacy & Local Security

- **100% Client-Side**: No telemetry, no intermediate proxies, and no external tracking servers.
- **Safe Key Storage**: API Keys are saved directly in `chrome.storage.local` within your browser's private extension partition.
- **Direct LLM Handshake**: Requests travel strictly between your local browser and the official AI provider endpoint you configured.

<p align="right"><a href="#ai-interview-copilot">⬆️ Back to Top</a></p>

---

<a name="-dokumentasi-bahasa-indonesia"></a>
# 🇮🇩 Dokumentasi Bahasa Indonesia

> **AI Interview Copilot** adalah ekstensi Chrome pintar yang mendampingi Anda secara real-time selama sesi wawancara teknis maupun behavioral di **Google Meet**. Ekstensi ini membaca pertanyaan interviewer dari closed captions (`CC`), menyelaraskan jawaban dengan **Resume & Pengalaman Kerja** Anda, serta menyajikan jawaban terstruktur (**metode STAR** + skrip lengkap) pada widget melayang (*HUD*) transparan yang aman dan terisolasi.

> 📖 **Panduan Pengguna Lengkap (Bahasa Inggris):** Lihat **[Panduan Lengkap (USER_GUIDE.md)](./USER_GUIDE.md)** untuk petunjuk detail konfigurasi dan tips wawancara.

---

### 📑 Daftar Isi (Bahasa Indonesia)
- [📖 Panduan Pengguna Lengkap (USER_GUIDE.md)](./USER_GUIDE.md)
- [✨ Fitur Unggulan](#-fitur-unggulan)
- [🖥️ Prasyarat Perangkat](#️-prasyarat-perangkat)
- [📦 Panduan Instalasi Langkah Demi Langkah](#-panduan-instalasi-langkah-demi-langkah)
- [⚙️ Pengaturan Awal (Popup Menu)](#️-pengaturan-awal-popup-menu)
- [🧪 Menguji Ekstensi dengan Simulator Google Meet](#-menguji-ekstensi-dengan-simulator-google-meet)
- [🎙️ Panduan Penggunaan di Google Meet Asli](#️-panduan-penggunaan-di-google-meet-asli)
- [⌨️ Pintasan Keyboard (Hotkeys)](#️-pintasan-keyboard-hotkeys)
- [📂 Struktur Folder & Berkas](#-struktur-folder--berkas)
- [🔒 Privasi & Keamanan Data](#-privasi--keamanan-data)

---

### ✨ Fitur Unggulan

- **🎙️ Scraping Caption Tanpa Izin Audio Khusus**: Memanfaatkan `MutationObserver` untuk membaca closed caption resmi Google Meet (`jsname="YSxPC"`). Tanpa akses mikrofon yang mencurigakan.
- **🤖 Mendukung Beragam Provider AI**:
  - **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini`, dll.
  - **Google Gemini**: `gemini-2.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`.
  - **Anthropic Claude**: `claude-3-5-sonnet`, `claude-3-haiku`, dll.
  - **Custom / Local AI**: Ollama lokal, vLLM, LM Studio, Groq, DeepSeek, OpenRouter.
- **📋 Penyelarasan Riwayat Resume & Pengalaman**: Masukkan riwayat pekerjaan dan pencapaian Anda. Jawaban AI akan memuat fakta riil pengalaman Anda, bukan sekadar jawaban teoritis umum.
- **🪟 Widget Melayang Transparan 85% (Shadow DOM)**:
  - Berjalan di dalam **Shadow DOM** sehingga 100% terisolasi dari stylesheet bawaan Google Meet.
  - Desain frosted glass modern dengan transparansi 85% opacity yang nyaman dilihat dan tidak menutupi lawan bicara.
  - Dapat digeser (*draggable*) dan diatur ukurannya (*resizable*) secara bebas ke seluruh penjuru layar.
  - **Dual-Card Output**: Poin intisari STAR untuk contekan cepat + skrip lengkap yang dapat diekspansi.
  - **Smart Debouncer**: Mendeteksi jeda keheningan 1,8 detik setelah interviewer selesai bicara untuk memicu respons AI secara otomatis.
- **🌐 Antarmuka Bilingual (EN / ID)**: Bahasa Inggris secara default dengan tombol toggle `EN / ID` di Header Popup dan Simulator yang langsung tersinkronisasi ke seluruh tab.
- **🔄 Pembaruan Otomatis (In-App Update) via Cloudflare Proxy**: Otomatis mendeteksi rilis versi baru dan memungkinkan pengunduhan ZIP terbaru dalam 1 klik. Menggunakan proxy Cloudflare Worker terenkripsi sehingga repositori privat Anda tetap aman dan terlindungi dari publik.
- **🎮 Simulator Google Meet Bawaan**: Halaman uji coba mandiri lengkap dengan suara sintetis interviewer (Web Speech API) dan simulasi closed captions.
- **⌨️ Tombol Darurat (Boss Key)**: Pintasan keyboard untuk menyembunyikan widget dalam sekejap saat melakukan share screen.

---

### 🖥️ Prasyarat Perangkat

- **Node.js**: Versi `18.0.0` ke atas (disarankan versi LTS `20+`).
- **Package Manager**: `npm` bawaan Node.js.
- **Browser Chromium**: Google Chrome, Microsoft Edge, Brave, atau Arc.
- *(Opsional)* **Python 3**: Digunakan jika ingin me-render ulang file PNG dari SVG master.

---

### 📦 Panduan Instalasi Langkah Demi Langkah

#### Opsi A: Instal Cepat via Arsip ZIP (Tanpa Koding ⭐)
1. Unduh berkas ZIP rilis terbaru langsung melalui link proxy aman:
   👉 **[Unduh ZIP AI Interview Copilot Terbaru](https://interview-ext-update-proxy.pbagong75.workers.dev/download)**
2. Ekstrak file `.zip` tersebut ke folder komputer Anda.
3. Pasang di browser pilihan Anda:
   - **Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi, Arc**:
     - Buka `chrome://extensions/` (atau `edge://extensions/`).
     - Aktifkan **Developer mode** di pojok kanan atas.
     - Klik **Load unpacked** dan pilih folder hasil ekstrak.
   - **Mozilla Firefox & Zen Browser**:
     - Buka `about:debugging#/runtime/this-firefox`.
     - Klik tombol **Load Temporary Add-on...** dan pilih file `manifest.json` di dalam folder hasil ekstrak.
4. Selesai! Sematkan (*pin*) **AI Interview Copilot** di toolbar browser Anda.
5. **Pembaruan Selanjutnya**: Setiap ada rilis versi baru, popup ekstensi akan otomatis menampilkan banner **"Pembaruan Tersedia"** lengkap dengan tombol download 1-klik!

#### Opsi B: Build Manual dari Source Code (Untuk Pengembang)

```bash
# 1. Kloning repository
git clone https://github.com/<username-anda>/interview-ext.git
cd interview-ext

# 2. Pasang dependensi
npm install

# 3. Kompilasi bundle ekstensi
npm run build
```

Kemudian muat folder `dist` ke browser:
1. Buka `chrome://extensions/`.
2. Aktifkan **Developer mode**.
3. Klik **Load unpacked** dan pilih folder `dist` di dalam project.

---

### ⚙️ Pengaturan Awal (Popup Menu)

Klik ikon ekstensi di toolbar browser Anda untuk membuka jendela konfigurasi:

#### 1. Tab Pengaturan (`⚙️ Settings`)
- **Provider AI**: Pilih OpenAI, Google Gemini, Anthropic Claude, atau Custom Endpoint.
- **API Key**: Masukkan API key rahasia Anda (disimpan aman di `chrome.storage.local`).
- **Nama Model**: Tentukan model pilihan Anda (misal: `gemini-2.5-flash` atau `gpt-4o`).
- **Tes Koneksi**: Klik tombol **"Test Connection"** untuk memastikan koneksi API berhasil.
- **Simpan**: Klik tombol **"Save Settings"**.

#### 2. Tab Konteks & Resume (`📋 Resume & Context`)
- **Posisi Target**: Masukkan jabatan yang dilamar (misal: *Senior Frontend Engineer*).
- **Perusahaan Target**: Masukkan nama perusahaan yang dituju.
- **Ringkasan Resume**: Tempelkan ringkasan CV, keahlian teknis, dan portofolio utama.
- **Gaya Jawaban**: Pilih antara **STAR Method**, **Concise & Direct**, atau **Deep Technical**.
- **Simpan**: Klik tombol **"Save Context"**.

---

### 🧪 Menguji Ekstensi dengan Simulator Google Meet

Anda dapat mencoba performa ekstensi secara langsung tanpa menunggu jadwal panggilan asli:
1. Buka popup ekstensi dari toolbar Chrome.
2. Klik tombol **"Open Meet Simulator"** pada banner demo di bagian atas.
3. Tab simulasi Google Meet akan terbuka.
4. Buka panel samping (**Scenarios & Context**) dan klik salah satu contoh pertanyaan wawancara.
5. Pewawancara virtual akan berbicara, teks closed caption muncul, dan **Floating HUD** akan otomatis menampilkan contekan jawaban!

---

### 🎙️ Panduan Penggunaan di Google Meet Asli

1. Masuk ke ruang rapat **[Google Meet](https://meet.google.com)**.
2. **Kunci Utama**: Aktifkan Closed Captions (CC) Google Meet dengan menekan tombol keyboard **`c`** atau mengklik tombol **ikon CC** pada bar kontrol bawah.
3. Widget **AI Interview Copilot** akan muncul melayang di layar secara otomatis.
4. Saat interviewer berbicara, ucapan akan terdeteksi di bar atas widget.
5. Saat pertanyaan selesai, contekan jawaban STAR beserta skrip lengkap akan langsung tersaji.

---

### ⌨️ Pintasan Keyboard (Hotkeys)

| Pintasan | Aksi | Keterangan |
| :--- | :--- | :--- |
| **`Alt + H`** | **Boss Key (Sembunyikan HUD)** | Menyembunyikan atau menampilkan widget seketika saat presentasi layar. |
| **`Alt + J`** | **Answer Now** | Memaksa AI menjawab percakapan terkini tanpa menunggu jeda hening. |
| **`c`** | **Google Meet CC** | Pintasan bawaan Google Meet untuk mengaktifkan closed captions. |

---

### 📂 Struktur Folder & Berkas

```text
interview-ext/
├── public/
│   ├── icons/             # File ikon ekstensi (16, 32, 48, 128px PNG & SVG)
│   └── manifest.json      # Konfigurasi Chrome Extension Manifest V3
├── scripts/
│   └── generate-icons.py  # Script konversi icon PNG resolusi tinggi
├── src/
│   ├── ailogo/            # Asset logo vector SVG (OpenAI, Claude, Gemini, dll.)
│   ├── background/        # Service Worker Manifest V3, streaming AI, hotkeys
│   ├── content/           # Scraper CC Meet & Floating HUD Shadow DOM
│   ├── demo/              # Halaman simulator Google Meet (HTML, CSS, TS)
│   ├── lib/               # Types, modul i18n, storage helper, AI client
│   └── popup/             # Antarmuka React untuk menu Settings & Context
├── package.json
├── tsconfig.json
├── vite.config.ts         # Konfigurasi bundler Vite multi-entry
└── README.md
```

---

### 🔒 Privasi & Keamanan Data

- **100% Client-Side**: Tanpa server proxy perantara, tanpa analitik pihak ketiga, dan tanpa pengumpulan data kandidat.
- **Penyimpanan Lokal**: API Key tersimpan secara terenkripsi dalam partisi `chrome.storage.local` browser Anda.
- **Koneksi Langsung**: Permintaan inferensi AI langsung dikirimkan dari browser Anda ke endpoint resmi provider AI yang Anda daftarkan.

---

<p align="center">
  Crafted with care for confident tech interviews • MIT License
</p>
