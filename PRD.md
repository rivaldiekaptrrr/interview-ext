# Product Requirements Document (PRD)
## EasyInterview : AI Interview Assistant Chrome Extension (Manifest V3)

- **Dokumen Versi**: 1.0.0
- **Status**: Disetujui (Approved)
- **Terakhir Diperbarui**: 2026-10-20
- **Target Platform**: Google Chrome Extension (Manifest V3)
- **Target Integrasi**: Google Meet & Platform Web Video Call Lainnya

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Latar Belakang
Proses interview kerja seringkali menimbulkan kecemasan tinggi dan memerlukan respon cepat serta terstruktur. Kandidat sering kali kesulitan mengingat detail proyek masa lalu, menyusun jawaban secara sistematis (misal: metode STAR), atau merespons pertanyaan situasional yang rumit dalam waktu singkat.

### 1.2 Visi Produk
Membangun asisten wawancara real-time cerdas berbasis ekstensi browser Chrome (Manifest V3). Ekstensi ini mendengarkan pertanyaan pewawancara, memprosesnya secara instan bersama konteks resume/pengalaman kerja kandidat, dan menyajikan poin-poin jawaban yang strategis, natural, dan terstruktur langsung di layar tanpa mengganggu pandangan mata ke kamera.

---

## 2. Profil Pengguna & Kasus Penggunaan (Use Cases)

### 2.1 Target Pengguna
1. **Job Seekers & Software Engineers**: Kandidat yang mengikuti technical atau behavioral interview online.
2. **Professionals**: Kandidat yang ingin memastikan jawaban mereka selalu relevan dengan riwayat karir dan pencapaian mereka.
3. **Developers / Early Adopters**: Pengguna teknis yang ingin menggunakan model AI mereka sendiri (BYOK - Bring Your Own Key) via OpenAI, Gemini, Claude, atau Ollama/Groq lokal.

### 2.2 Skenario Penggunaan Utama
- **Skenario A (Behavioral Interview)**: Pewawancara menanyakan: *"Ceritakan pengalaman Anda saat menghadapi konflik tim saat deadline rilis?"*. AI mendeteksi pertanyaan, mengaitkannya dengan riwayat kerja yang tersimpan di resume kandidat, dan menampilkan jawaban berformat STAR (Situation, Task, Action, Result).
- **Skenario B (Technical / Konseptual)**: Pewawancara menanyakan konsep di luar resume. AI merespons secara netral, akurat, dan profesional dengan poin-poin ringkas.
- **Skenario C (Stealth & Screen Share)**: Jika kandidat diminta membagikan layar, kandidat dapat menekan tombol pintas panik (*Panic Key*) untuk menyembunyikan widget secara instan.

---

## 3. Fitur Utama & Kebutuhan Fungsional

### 3.1 Menu Settings (Konfigurasi Model & Kunci API)
- **Multi-Provider Support**:
  - **OpenAI**: Mendukung model GPT-4o, GPT-4o-mini, dll.
  - **Google Gemini API**: Mendukung Gemini 1.5 Pro / Flash, Gemini 2.0 Flash via Google Generative AI REST API.
  - **Anthropic Claude**: Mendukung Claude 3.5 Sonnet / Haiku via Messages API.
  - **Custom OpenAI-Compatible Endpoint**: Input fleksibel untuk `Base URL`, `API Key`, dan `Model Name` (mendukung Groq, DeepSeek, OpenRouter, Together AI, atau Ollama lokal `http://localhost:11434/v1`).
- **Parameter Kustomisasi**:
  - Input `Temperature` (0.0 – 1.0, default 0.7).
  - Input `Max Tokens` (default 800 tokens).
- **Arsitektur Monetisasi & Paket Masa Depan**:
  - Abstraksi interface tier (`Free BYOK`, `Pro Tier`, `Enterprise Tier`).
  - Untuk fase rilis awal: Mode *Developer BYOK* (Bring Your Own Key).

### 3.2 Menu Context & Resume Management
- **Field Konteks Terstruktur**:
  - **Resume / Work Experience**: Text area luas untuk paste CV, pencapaian kunci, tech stack, dan histori karir.
  - **Target Posisi & Perusahaan**: Input nama perusahaan (misal: "GoTo", "Google") dan jabatan (misal: "Senior Frontend Engineer").
  - **Bahasa Respon**: Pilihan output Bahasa Indonesia, Bahasa Inggris, atau Otomatis mengikuti bahasa pertanyaan.
  - **Answer Tone**: Pilihan tone respon: *STAR Method (Behavioral)*, *Concise & Punchy*, atau *Deep Technical*.
- **Aksesibilitas**:
  - Tersedia di halaman Popup Ekstensi.
  - Tersedia sebagai *quick-edit drawer* langsung di dalam floating widget saat interview berlangsung.

### 3.3 Audio Listening & Transcript Capture (Hybrid Strategy)
- **Metode Utama (Google Meet Captions Scraper)**:
  - Memanfaatkan fitur bawaan Google Meet *Live Subtitles/Captions*.
  - Menggunakan `MutationObserver` pada container caption DOM Google Meet (`div[jsname="YSxPC"]` / subtitle spans).
  - **Kelebihan**: Latensi 0ms, 100% gratis, bebas konsumsi API speech, serta otomatis membedakan identitas pembicara (Interviewer vs Kandidat).
- **Metode Fallback (Web Speech API / Tab Audio)**:
  - Opsi fallback menggunakan browser speech recognition (`webkitSpeechRecognition`) jika closed captions tidak aktif.

### 3.4 Auto-Trigger & Smart Debounce Engine
- **Logika Otomatis (Default ON)**:
  - **Silence Debounce**: Menunggu jeda hening selama 1.5 – 2.0 detik setelah kalimat lawan bicara berhenti.
  - **Heuristik Kalimat Tanya**: Memeriksa tanda tanya (`?`), kata tanya (*Why, How, What, Ceritakan, Jelaskan, Bagaimana*), serta pergantian giliran bicara (*speaker turn*).
- **Kontrol Manual**:
  - Tombol **Start / Stop Listening** di floating widget.
  - Tombol **"Jawab Sekarang" (Answer Now)** untuk memicu AI tanpa perlu menunggu jeda hening.

### 3.5 Floating Overlay Widget (Injected Shadow DOM)
- **Teknologi Shadow DOM**:
  - Diinjeksi langsung ke dalam DOM Google Meet namun terisolasi 100% di dalam `#shadow-root` (Open mode) agar style CSS Google Meet tidak merusak tampilan widget dan sebaliknya.
- **Manipulasi & Interaktivitas**:
  - **Draggable**: Header widget dapat diklik dan digeser bebas ke posisi mana pun di layar.
  - **Resizable**: Sudut kanan bawah widget dapat ditarik untuk memperbesar atau memperkecil ukuran.
  - **Minimize / Collapse**: Dapat di-minimize menjadi pill/badge kecil di sudut layar.
- **Fitur Keamanan & Stealth**:
  - **Panic Boss Key (`Alt + H` atau `Esc`)**: Menyembunyikan widget secara instan jika tiba-tiba kandidat harus membagikan layar.

### 3.6 Format Penyajian Jawaban AI (Dual-Mode)
- **Mode Ringkas (STAR Bullet Points)**:
  - Ditampilkan pertama kali agar kandidat bisa melirik poin kunci dalam hitungan detik.
  - Menggunakan badge penanda: `[S]` Situation, `[T]` Task, `[A]` Action, `[R]` Result.
- **Mode Naskah Lengkap (Expandable Full Script)**:
  - Tombol accordion / dropdown *"Lihat Skrip Lengkap"* untuk membaca contoh kalimat utuh jika kandidat membutuhkan elaborasi mendalam.

---

## 4. Arsitektur Teknis (Technical Architecture)

### 4.1 Tech Stack
- **Framework**: React 18 / 19 + TypeScript
- **Styling**: Tailwind CSS (dikompilasi ke style sheet yang diinjeksi ke Shadow Root)
- **Bundler & Build Tool**: Vite + `@crxjs/vite-plugin` (atau Vite multi-entry extension build)
- **Manifest Version**: Chrome Manifest V3
- **State & Storage**: `chrome.storage.local` dan `chrome.storage.sync`

### 4.2 Diagram Komponen Sistem

```
+--------------------------------------------------------------------------+
|                              Google Meet Tab                             |
|                                                                          |
|  +---------------------------+        +-------------------------------+  |
|  | Google Meet Subtitles DOM |        | Isolated Shadow DOM Container |  |
|  +-------------+-------------+        +---------------+---------------+  |
|                |                                      ^                  |
|                v                                      |                  |
|     [Content Script: Transcript]                      | [React App]      |
|     - MutationObserver                                - Floating UI      |
|     - Smart Debouncer (1.5s)                          - Drag / Resize    |
|     - Question Heuristics                             - Dual-mode Answer |
|                |                                      |                  |
|                +------------------+-------------------+                  |
|                                   |                                      |
+-----------------------------------|--------------------------------------+
                                    | chrome.runtime.sendMessage
                                    v
+--------------------------------------------------------------------------+
|                     Background Service Worker (V3)                       |
|                                                                          |
|  +------------------------+  +-------------------+  +-----------------+  |
|  | Multi-Provider Client  |  | Context Injector  |  | Storage Manager |  |
|  | (OpenAI/Gemini/Claude) |  | (Prompt Builder)  |  | (Local Sync)    |  |
|  +-----------+------------+  +-------------------+  +-----------------+  |
|              |                                                           |
+--------------|-----------------------------------------------------------+
               | HTTP Fetch (Streaming / REST)
               v
+--------------------------------------------------------------------------+
|                              AI API Endpoints                            |
|       (OpenAI / Google Gemini / Anthropic Claude / Custom Ollama/Groq)   |
+--------------------------------------------------------------------------+
```

### 4.3 Struktur Penyimpanan Data (`chrome.storage.local`)
```typescript
interface ExtensionSettings {
  provider: 'openai' | 'gemini' | 'claude' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  plan: 'byok' | 'pro' | 'enterprise';
}

interface UserContext {
  resumeText: string;
  targetRole: string;
  companyName: string;
  language: 'id' | 'en' | 'auto';
  tone: 'star' | 'concise' | 'technical';
}

interface FloatingWidgetState {
  isListening: boolean;
  autoTrigger: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isVisible: boolean;
}
```

---

## 5. Rencana Prompt Engineering (AI System Prompt)

Prompt sistem dirancang untuk menghasilkan jawaban yang realistis dan terikat dengan konteks kandidat:
```text
Anda adalah asisten interview live pribadi yang sangat berpengalaman.
Tugas Anda adalah memberikan contekan jawaban wawancara terbaik kepada kandidat secara instan.

KONTEKS KANDIDAT:
[Target Posisi]: {{targetRole}}
[Perusahaan]: {{companyName}}
[Resume / Pengalaman]:
{{resumeText}}

PANDUAN MENJAWAB:
1. Jika pertanyaan relevan dengan pengalaman kandidat, gunakan fakta dari Resume kandidat.
2. Jika pertanyaan di luar pengalaman kandidat, jawablah secara natural, cerdas, dan profesional seolah-olah Anda adalah kandidat yang berkualifikasi.
3. Gunakan format output terstruktur:
   - SHORT_POINTS: 3-4 poin kunci utama (gunakan format STAR: Situation, Task, Action, Result jika pertanyaan perilaku).
   - FULL_SCRIPT: 1 paragraf narasi lengkap yang siap diucapkan dengan gaya bicara natural.
4. Bahasa: {{language}}. Jangan gunakan gaya bahasa kaku seperti membaca buku teks.
```

---

## 6. Jadwal Pengembangan & Tahapan Rilis (Milestones)

- **Fase 1: Project Scaffolding & Setup**
  - Inisialisasi Vite + React + TypeScript + Tailwind.
  - Setup Manifest V3 (`manifest.json`), service worker, dan content script injection.
- **Fase 2: Settings, Storage & Context Management**
  - Implementasi Extension Popup UI untuk pengaturan API Key, Base URL, dan Profil Resume.
  - Integrasi Multi-Provider API Client (OpenAI, Gemini, Claude, Custom).
- **Fase 3: Floating Overlay Widget (Shadow DOM)**
  - Implementasi draggable & resizable floating UI di Google Meet.
  - Implementasi shortcut Boss Key (`Alt + H`).
- **Fase 4: Audio Captions Listener & Auto-Trigger**
  - Implementasi MutationObserver pada Google Meet live captions.
  - Integrasi Smart Debouncer & Question Heuristic Engine.
- **Fase 5: UI Jawaban Dual-Mode & Pengujian E2E**
  - Menghubungkan transkrip -> trigger prompt -> streaming/render jawaban AI di floating card.
  - Pengujian latensi dan keandalan di sesi panggilan Google Meet.
