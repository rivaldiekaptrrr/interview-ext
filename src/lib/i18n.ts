/* ── AI Interview Copilot ── Internationalization (i18n) Dictionary ── */

export type UILanguage = 'en' | 'id';

export interface Translations {
  // Brand & Header
  brandName: string;
  brandTagline: string;
  version: string;
  langEn: string;
  langId: string;
  themeLight: string;
  themeDark: string;

  // Tabs
  tabSettings: string;
  tabContext: string;

  // Demo Banner
  demoBannerBadge: string;
  demoBannerTitle: string;
  demoBannerDesc: string;
  demoBannerBtn: string;

  // Settings Tab
  providerSectionTitle: string;
  customEndpointHint: string;
  baseUrlLabel: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  apiKeyHelp: string;
  modelLabel: string;
  customModelPlaceholder: string;
  maxTokensLabel: string;
  temperatureLabel: string;
  btnTesting: string;
  btnTestConnection: string;
  btnSaveSettings: string;
  btnResetDefaults: string;
  toastSettingsSaved: string;
  toastSettingsReset: string;

  // Context Tab
  resumeSectionTitle: string;
  resumeHint: string;
  resumePlaceholder: string;
  targetRoleLabel: string;
  targetRolePlaceholder: string;
  companyNameLabel: string;
  companyNamePlaceholder: string;
  answerLangLabel: string;
  answerLangAuto: string;
  answerLangEn: string;
  answerLangId: string;
  answerToneLabel: string;
  toneStar: string;
  toneConcise: string;
  toneTechnical: string;
  btnSaveContext: string;
  toastContextSaved: string;

  // CV Upload & ATS Extraction
  cvUploadTitle: string;
  cvUploadDesc: string;
  cvUploadBadge: string;
  cvUploadReading: string;
  cvUploadStructuring: string;
  cvUploadSuccess: string;
  cvUploadChangeFile: string;

  // Floating Widget HUD
  hudPillText: string;
  hudTitle: string;
  hudListening: string;
  hudStopped: string;
  hudBtnStart: string;
  hudBtnStop: string;
  hudBtnAuto: string;
  hudBtnAnswerNow: string;
  hudTranscriptBadge: string;
  hudTranscriptWaiting: string;
  hudEmptyTitle: string;
  hudEmptyDesc: string;
  hudQuestionLabel: string;
  hudMinimize: string;
  hudClose: string;

  // Simulator Page
  simTitle: string;
  simSubtitle: string;
  simVoiceToggle: string;
  simSpeaking: string;
  simIdle: string;
  simControlPanelTitle: string;
  simBtnClosePanel: string;
  simScenarioTitle: string;
  simPreset1Title: string;
  simPreset1Desc: string;
  simPreset2Title: string;
  simPreset2Desc: string;
  simPreset3Title: string;
  simPreset3Desc: string;
  simCustomTitle: string;
  simCustomPlaceholder: string;
  simBtnPlayCustom: string;
  simBtnStopSpeech: string;
  simTipsTitle: string;
  simTip1: string;
  simTip2: string;
  simTip3: string;
  simOpenSettings: string;

  // In-App Update Checker
  updateBadge: string;
  updateAvailableDesc: string;
  btnDownloadUpdate: string;
  btnReleaseNotes: string;
  upToDateToast: string;
  checkingUpdateToast: string;
}

export const DICTIONARY: Record<UILanguage, Translations> = {
  en: {
    // Brand & Header
    brandName: 'Interview Copilot',
    brandTagline: 'Real-Time AI Interview Assistant',
    version: 'v1.0.9',
    langEn: 'EN',
    langId: 'ID',
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',

    // Tabs
    tabSettings: 'Settings',
    tabContext: 'Resume & Context',

    // Demo Banner
    demoBannerBadge: 'Simulate',
    demoBannerTitle: 'Google Meet Simulator (Demo Mode)',
    demoBannerDesc: 'Test speech audio, live closed captions, and instant AI answer streaming without joining a real call.',
    demoBannerBtn: 'Open Meet Simulator',

    // Settings Tab
    providerSectionTitle: 'AI Model Provider',
    customEndpointHint: 'Compatible with OpenAI-compatible APIs, Groq, DeepSeek, OpenRouter, and local Ollama.',
    baseUrlLabel: 'Base URL',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'Enter your API key...',
    apiKeyHelp: 'Stored securely & locally in chrome.storage.local',
    modelLabel: 'Model Name',
    customModelPlaceholder: 'e.g. llama3.2, mistral, deepseek-r1',
    maxTokensLabel: 'Max Tokens (Output Limit)',
    temperatureLabel: 'Temperature (Response Creativity)',
    btnTesting: 'Testing...',
    btnTestConnection: 'Test Connection',
    btnSaveSettings: 'Save Settings',
    btnResetDefaults: 'Reset Defaults',
    toastSettingsSaved: 'AI settings saved successfully',
    toastSettingsReset: 'Settings reset to defaults',

    // Context Tab
    resumeSectionTitle: 'Resume & Work Experience',
    resumeHint: 'Paste your resume, notable projects, technical skills, and career highlights. The AI will weave real facts from here into its answers.',
    resumePlaceholder: 'Example:\n- Senior Frontend Engineer with 5+ years of experience in React, TypeScript, Next.js.\n- Led performance optimizations reducing bundle size by 35%.\n- Architected high-traffic microfrontends serving 2M+ daily active users.',
    targetRoleLabel: 'Target Position',
    targetRolePlaceholder: 'e.g. Senior Frontend Engineer',
    companyNameLabel: 'Target Company',
    companyNamePlaceholder: 'e.g. Google, Stripe, Tokopedia',
    answerLangLabel: 'AI Response Language',
    answerLangAuto: 'Auto (Follow interviewer)',
    answerLangEn: 'English',
    answerLangId: 'Bahasa Indonesia',
    answerToneLabel: 'Answer Tone & Style',
    toneStar: 'STAR Method (Situation, Task, Action, Result)',
    toneConcise: 'Concise & Punchy (Direct to the point)',
    toneTechnical: 'Deep Technical (Architectural & Best Practices)',
    btnSaveContext: 'Save Context',
    toastContextSaved: 'Interview context saved successfully',

    // CV Upload & ATS Extraction
    cvUploadTitle: 'Upload CV ATS',
    cvUploadDesc: 'Drop .pdf or .docx file to auto-fill your profile',
    cvUploadBadge: 'ATS Only',
    cvUploadReading: 'Reading document text...',
    cvUploadStructuring: 'Structuring experience with AI...',
    cvUploadSuccess: '✓ Profile extracted from CV! Review below before saving.',
    cvUploadChangeFile: 'Change file',

    // Floating Widget HUD
    hudPillText: 'AI Copilot',
    hudTitle: 'AI Interview Copilot',
    hudListening: 'Listening',
    hudStopped: 'Stopped',
    hudBtnStart: 'Start',
    hudBtnStop: 'Stop',
    hudBtnAuto: 'Auto',
    hudBtnAnswerNow: 'Answer Now',
    hudTranscriptBadge: 'Live',
    hudTranscriptWaiting: 'Waiting for interviewer speech...',
    hudEmptyTitle: 'Listening for Questions...',
    hudEmptyDesc: 'When the interviewer finishes speaking, structured AI answers will stream here automatically.',
    hudQuestionLabel: 'Question',
    hudMinimize: 'Minimize',
    hudClose: 'Hide (Alt+H)',

    // Simulator Page
    simTitle: 'Google Meet Interview Simulator',
    simSubtitle: 'Interactive Real-Time Rehearsal Sandbox',
    simVoiceToggle: 'Enable Synthetic Speech Audio (TTS)',
    simSpeaking: 'Speaking...',
    simIdle: 'Idle / Waiting',
    simControlPanelTitle: 'Interactive Interview Controls',
    simBtnClosePanel: 'Close',
    simScenarioTitle: 'Interview Scenarios',
    simPreset1Title: 'Behavioral & Introduction',
    simPreset1Desc: 'Brief introduction, career journey, and most challenging project.',
    simPreset2Title: 'Deep Technical (High Traffic)',
    simPreset2Desc: 'Server bottleneck analysis, profiling tools, and web optimization.',
    simPreset3Title: 'Team Conflict (STAR)',
    simPreset3Desc: 'Resolving sharp architectural disagreements constructively.',
    simCustomTitle: 'Custom Interviewer Question',
    simCustomPlaceholder: 'Type your custom interviewer question here...',
    simBtnPlayCustom: 'Speak Question',
    simBtnStopSpeech: 'Stop Speech',
    simTipsTitle: 'Testing Tips',
    simTip1: 'The floating HUD actively hooks into the simulated closed captions.',
    simTip2: 'Watch the live debouncer automatically trigger an AI response after speech stops.',
    simTip3: 'Use Alt+H anytime to toggle HUD visibility.',
    simOpenSettings: 'Open Extension Settings',

    // In-App Update Checker
    updateBadge: 'New Update',
    updateAvailableDesc: 'A new version {version} is available on GitHub.',
    btnDownloadUpdate: 'Download ZIP',
    btnReleaseNotes: 'Release Notes',
    upToDateToast: 'You are using the latest version ({version})',
    checkingUpdateToast: 'Checking for updates on GitHub...',
  },
  id: {
    // Brand & Header
    brandName: 'Interview Copilot',
    brandTagline: 'Asisten Wawancara AI Real-Time',
    version: 'v1.0.9',
    langEn: 'EN',
    langId: 'ID',
    themeLight: 'Ganti ke tema terang',
    themeDark: 'Ganti ke tema gelap',

    // Tabs
    tabSettings: 'Pengaturan',
    tabContext: 'Konteks & Resume',

    // Demo Banner
    demoBannerBadge: 'Simulasi',
    demoBannerTitle: 'Simulator Google Meet (Mode Demo)',
    demoBannerDesc: 'Uji coba closed-captions, audio percakapan, dan jawaban AI real-time tanpa perlu membuka panggilan asli.',
    demoBannerBtn: 'Buka Simulator Google Meet',

    // Settings Tab
    providerSectionTitle: 'Provider Model AI',
    customEndpointHint: 'Kompatibel dengan endpoint OpenAI API, Groq, DeepSeek, OpenRouter, dan Ollama lokal.',
    baseUrlLabel: 'Base URL',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'Masukkan API key Anda...',
    apiKeyHelp: 'Tersimpan aman & lokal di chrome.storage.local',
    modelLabel: 'Nama Model',
    customModelPlaceholder: 'misal: llama3.2, mistral, deepseek-r1',
    maxTokensLabel: 'Maksimum Token (Batas Output)',
    temperatureLabel: 'Temperature (Variasi Jawaban)',
    btnTesting: 'Menguji...',
    btnTestConnection: 'Tes Koneksi',
    btnSaveSettings: 'Simpan Settings',
    btnResetDefaults: 'Reset Default',
    toastSettingsSaved: 'Pengaturan AI berhasil disimpan',
    toastSettingsReset: 'Pengaturan direset ke default',

    // Context Tab
    resumeSectionTitle: 'Resume / Riwayat Pengalaman Kerja',
    resumeHint: 'Tempel resume, pencapaian kunci, tech stack, dan histori karir. AI akan mengutip fakta riil dari sini saat menjawab pertanyaan.',
    resumePlaceholder: 'Contoh:\n- Senior Frontend Engineer 5+ tahun pengalaman di React, TypeScript, Next.js.\n- Pernah memimpin migrasi monorepo dan optimasi Core Web Vitals.\n- Mengembangkan sistem mikro-frontend dengan 2jt+ pengguna aktif harian.',
    targetRoleLabel: 'Target Posisi / Jabatan',
    targetRolePlaceholder: 'misal: Senior Frontend Engineer',
    companyNameLabel: 'Perusahaan yang Dilamar',
    companyNamePlaceholder: 'misal: Google, Tokopedia, Stripe',
    answerLangLabel: 'Bahasa Jawaban AI',
    answerLangAuto: 'Otomatis (Ikuti Pewawancara)',
    answerLangEn: 'Bahasa Inggris',
    answerLangId: 'Bahasa Indonesia',
    answerToneLabel: 'Tone & Gaya Jawaban',
    toneStar: 'Metode STAR (Situasi, Tugas, Aksi, Hasil)',
    toneConcise: 'Singkat & Padat (To the point)',
    toneTechnical: 'Deep Technical (Mendalam & Arsitektur)',
    btnSaveContext: 'Simpan Konteks',
    toastContextSaved: 'Konteks interview berhasil disimpan',

    // CV Upload & ATS Extraction
    cvUploadTitle: 'Upload CV ATS',
    cvUploadDesc: 'Tarik & lepas berkas .pdf atau .docx untuk mengisi profil otomatis',
    cvUploadBadge: 'ATS Only',
    cvUploadReading: 'Membaca teks dokumen...',
    cvUploadStructuring: 'Menyusun pengalaman dengan AI...',
    cvUploadSuccess: '✓ Profil berhasil diekstrak dari CV! Silakan tinjau di bawah sebelum menyimpan.',
    cvUploadChangeFile: 'Ganti berkas',

    // Floating Widget HUD
    hudPillText: 'AI Copilot',
    hudTitle: 'AI Interview Copilot',
    hudListening: 'Mendengarkan',
    hudStopped: 'Berhenti',
    hudBtnStart: 'Mulai',
    hudBtnStop: 'Berhenti',
    hudBtnAuto: 'Auto',
    hudBtnAnswerNow: 'Jawab Sekarang',
    hudTranscriptBadge: 'Live',
    hudTranscriptWaiting: 'Menunggu ucapan interviewer...',
    hudEmptyTitle: 'Mendengarkan Pertanyaan...',
    hudEmptyDesc: 'Begitu interviewer selesai bertanya, contekan jawaban AI akan otomatis streaming di sini.',
    hudQuestionLabel: 'Pertanyaan',
    hudMinimize: 'Kecilkan',
    hudClose: 'Sembunyikan (Alt+H)',

    // Simulator Page
    simTitle: 'Simulator Wawancara Google Meet',
    simSubtitle: 'Simulasi Wawancara Real-Time Interaktif',
    simVoiceToggle: 'Aktifkan Audio Ucapan Sintesis (TTS)',
    simSpeaking: 'Sedang Berbicara...',
    simIdle: 'Menunggu...',
    simControlPanelTitle: 'Kontrol Interaktif Simulasi',
    simBtnClosePanel: 'Tutup',
    simScenarioTitle: 'Skenario Pertanyaan Interview',
    simPreset1Title: 'Behavioral & Perkenalan',
    simPreset1Desc: 'Perkenalan singkat, perjalanan karir, dan proyek paling menantang.',
    simPreset2Title: 'Teknis Mendalam (High Traffic)',
    simPreset2Desc: 'Langkah analisis bottleneck server, profiling, dan optimasi web.',
    simPreset3Title: 'Konflik Tim (Metode STAR)',
    simPreset3Desc: 'Menyelesaikan perbedaan tajam pandangan arsitektur secara konstruktif.',
    simCustomTitle: 'Pertanyaan Kustom Interviewer',
    simCustomPlaceholder: 'Ketik pertanyaan wawancara kustom Anda di sini...',
    simBtnPlayCustom: 'Ucapkan Pertanyaan',
    simBtnStopSpeech: 'Hentikan Suara',
    simTipsTitle: 'Tips Pengujian',
    simTip1: 'Widget HUD melayang secara aktif mendengarkan closed captions yang muncul.',
    simTip2: 'Perhatikan smart debouncer yang otomatis memicu respons AI setelah ucapan berhenti.',
    simTip3: 'Gunakan Alt+H kapan saja untuk menyembunyikan widget.',
    simOpenSettings: 'Buka Pengaturan Ekstensi',

    // In-App Update Checker
    updateBadge: 'Update Baru',
    updateAvailableDesc: 'Versi baru {version} telah tersedia di GitHub.',
    btnDownloadUpdate: 'Unduh ZIP',
    btnReleaseNotes: 'Catatan Rilis',
    upToDateToast: 'Anda sudah menggunakan versi terbaru ({version})',
    checkingUpdateToast: 'Memeriksa pembaruan di GitHub...',
  },
};

/** Get translations for the specified language (default: 'en') */
export function getI18n(lang: UILanguage = 'en'): Translations {
  return DICTIONARY[lang] || DICTIONARY.en;
}
