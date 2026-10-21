/* ── Google Meet E2E Interview Simulator ──
 * Simulates real-time speaker audio (Web Speech API) & live closed captions
 * Integrated directly with TranscriptListener, SmartDebouncer & FloatingWidget
 * The widget ACTUALLY listens to live CC DOM mutations — NOT hardcoded!
 * ────────────────────────────────────────────────────────────────────────── */

import { FloatingWidget } from '../content/floating-widget';
import { SmartDebouncer } from '../content/smart-debouncer';
import { TranscriptListener } from '../content/transcript-listener';
import { loadContext, saveContext, loadUILanguage, saveUILanguage } from '../lib/storage';
import { getI18n, type UILanguage } from '../lib/i18n';
import type {
  ExtensionMessage,
  AIAnswerChunkPayload,
  AIAnswer,
  TranscriptEntry,
} from '../lib/types';

// ── Real Pipeline Instances ──
let widget: FloatingWidget | null = null;
let debouncer: SmartDebouncer | null = null;
let listener: TranscriptListener | null = null;
let conversationHistory: TranscriptEntry[] = [];
let isSpeaking = false;
let speechInterval: ReturnType<typeof setInterval> | null = null;
let currentLang: UILanguage = 'en';

// ── Capture Engine Mode (WebRTC Protobuf vs DOM CC) ──
let currentEngine: 'rtc' | 'dom' = 'rtc';
let mockMessageCounter = 100;

/** Encode Protobuf Varint */
function writeVarint(val: number): number[] {
  const res: number[] = [];
  let n = val;
  while (n > 127) {
    res.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  res.push(n & 0x7f);
  return res;
}

/** Encode Protobuf String Field (Wire 2) */
function writeString(field: number, str: string): number[] {
  const bytes = new TextEncoder().encode(str);
  return [...writeVarint((field << 3) | 2), ...writeVarint(bytes.length), ...bytes];
}

/** Encode Protobuf Varint Field (Wire 0) */
function writeInt(field: number, val: number): number[] {
  return [...writeVarint((field << 3) | 0), ...writeVarint(val)];
}

/**
 * Builds a valid Google Meet captions (v1) binary Protobuf packet
 * Tag 1 (wire 2): deviceId
 * Tag 2 (wire 0): messageId
 * Tag 3 (wire 0): messageVersion
 * Tag 6 (wire 2): text
 */
function encodeCaptionV1Mock(
  deviceId: string,
  messageId: number,
  version: number,
  text: string
): ArrayBuffer {
  const bytes = [
    ...writeString(1, deviceId),
    ...writeInt(2, messageId),
    ...writeInt(3, version),
    ...writeString(6, text),
  ];
  return new Uint8Array(bytes).buffer;
}

/**
 * Builds a valid Google Meet collections binary Protobuf packet
 * Providing participant deviceId and deviceName
 */
function encodeCollectionsMock(
  participants: { deviceId: string; name: string }[]
): ArrayBuffer {
  const chunks: number[] = [];
  for (const p of participants) {
    chunks.push(...writeString(1, p.deviceId));
    chunks.push(...writeString(2, p.name));
  }
  return new Uint8Array(chunks).buffer;
}

function emitMockCollections() {
  const interviewerName = currentLang === 'en' ? 'Sarah Jenkins' : 'Budi Santoso';
  const buffer = encodeCollectionsMock([
    { deviceId: 'devices/interviewer-sim-01', name: interviewerName },
    { deviceId: 'devices/candidate-sim-01', name: 'You' },
  ]);
  window.postMessage(
    {
      source: 'interview-ext-collections',
      buffer,
      time: Date.now(),
    },
    '*'
  );
}

function emitMockCaption(
  deviceId: string,
  messageId: number,
  version: number,
  text: string
) {
  const buffer = encodeCaptionV1Mock(deviceId, messageId, version, text);
  window.postMessage(
    {
      source: 'interview-ext-caption',
      buffer,
      channel: 'captions',
      isV2: false,
      time: Date.now(),
    },
    '*'
  );
}

const QUESTIONS: Record<UILanguage, { q1: string; q2: string; q3: string }> = {
  en: {
    q1: "Could you walk me through your background, your recent role, and the most challenging technical project you've worked on?",
    q2: 'When a web service experiences a sudden traffic spike and response latency increases drastically, what profiling and optimization steps would you take?',
    q3: 'Can you describe a situation where you had a sharp architectural disagreement with team members, and how you resolved it constructively?',
  },
  id: {
    q1: 'Bisa ceritakan tentang diri Anda secara singkat, pengalaman terakhir Anda, dan proyek paling menantang yang pernah Anda kerjakan?',
    q2: 'Ketika sebuah aplikasi web mengalami lonjakan traffic dan respons server melambat drastis, langkah profiling dan optimasi apa yang akan Anda ambil?',
    q3: 'Pernahkah Anda berada dalam situasi di mana ada perbedaan pendapat teknis yang tajam dalam tim mengenai arsitektur, dan bagaimana Anda menyelesaikannya?',
  },
};

// ── DOM Elements ──
const liveClockEl = document.getElementById('live-clock');
const audioRingEl = document.getElementById('audio-ring');
const interviewerMicEl = document.getElementById('interviewer-mic');
const speakerStateEl = document.getElementById('speaker-state');
const captionTextAreaEl = document.getElementById('caption-text-area');
const voiceEnabledCheck = document.getElementById('voice-enabled') as HTMLInputElement | null;
const scenarioPanel = document.getElementById('scenario-panel');
const toggleControlPanelBtn = document.getElementById('toggle-control-panel');
const closePanelBtn = document.getElementById('close-panel-btn');
const btnStopSpeech = document.getElementById('btn-stop-speech');
const customQuestionInput = document.getElementById('custom-question-input') as HTMLTextAreaElement | null;
const playCustomBtn = document.getElementById('play-custom-btn');
const openSettingsShortcut = document.getElementById('open-settings-shortcut');

// ── Initialize Simulator ──
async function initSimulator() {
  console.log('[Meet Simulator] Initializing End-to-End Interview Simulator...');

  // 0. Load persisted UI Language (defaults to English 'en')
  currentLang = await loadUILanguage();

  // 1. Live Clock
  updateClock();
  setInterval(updateClock, 1000);

  // 2. Initialize Floating Widget
  widget = new FloatingWidget();

  // 3. Initialize Smart Debouncer (1.8s silence threshold)
  debouncer = new SmartDebouncer((question: string) => {
    triggerAIAnswer(question);
  }, 1800);

  // 4. Initialize REAL Transcript Listener (MutationObserver on Meet Caption DOM)
  listener = new TranscriptListener((entries, latestText) => {
    conversationHistory = entries;

    console.log('[Meet Simulator -> TranscriptListener observed CC DOM]:', latestText);

    // Update the floating widget live transcript preview FROM WHAT WAS OBSERVED IN CC!
    widget?.updateTranscript(latestText);

    // Feed non-self speaker text into the debouncer
    const latestEntry = entries[entries.length - 1];
    if (latestEntry && !latestEntry.isSelf) {
      debouncer?.feed(latestEntry.text, false);
    }
  });

  // Connect RTC Status to widget badge
  listener.setRtcStatusCallback((active) => {
    widget?.setRtcActive(active);
  });

  // Start observing captions (WebRTC listener + DOM fallback)
  listener.start();

  // Initialize RTC Mock engine by default
  setTimeout(() => {
    emitMockCollections();
    widget?.setRtcActive(true);
  }, 200);

  // 5. Wire up Widget Callbacks
  widget.setCallbacks({
    onStartStop: (listening: boolean) => {
      console.log('[Meet Simulator] Widget listening toggled:', listening);
      if (listening) {
        listener?.start();
        debouncer?.setEnabled(true);
      } else {
        listener?.stop();
        debouncer?.setEnabled(false);
      }
    },
    onAnswerNow: () => {
      debouncer?.forceAnswer();
    },
    onAutoToggle: (enabled: boolean) => {
      debouncer?.setEnabled(enabled);
    },
  });

  // 6. Background message receiver (streaming answers from service worker)
  chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
    switch (message.type) {
      case 'AI_ANSWER_CHUNK': {
        const chunk = message.payload as AIAnswerChunkPayload;
        if (chunk.done) {
          widget?.setStreaming(false);
        } else {
          widget?.appendStreamChunk(chunk.chunk);
        }
        break;
      }
      case 'AI_ANSWER_RESPONSE': {
        const answer = message.payload as AIAnswer;
        widget?.pushAnswer({
          ...answer,
          isLoading: false,
          timestamp: Date.now(),
        });
        break;
      }
      case 'AI_ANSWER_ERROR': {
        const error = message.payload as { id: string; error: string };
        widget?.showError(error.error);
        break;
      }
    }
  });

  // 7. Bind UI Controls
  setupUIEventListeners();

  // 8. Apply current language across Simulator DOM
  applyLanguage(currentLang);

  // 9. React to language changes from Popup
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.ui_language) {
      const nextLang = (changes.ui_language.newValue as UILanguage) || 'en';
      if (nextLang !== currentLang) {
        currentLang = nextLang;
        applyLanguage(nextLang);
      }
    }
  });

  console.log('[Meet Simulator] Simulator ready! Floating Widget is actively observing CC DOM.');
}

// ── Trigger AI Answer via Service Worker ──
function triggerAIAnswer(question: string) {
  if (!question.trim()) return;

  console.log('[Meet Simulator] Triggering AI Answer for question:', question);
  widget?.setStreaming(true, '');

  chrome.runtime.sendMessage(
    {
      type: 'TRIGGER_AI_ANSWER',
      payload: {
        question,
        conversationHistory: conversationHistory.slice(-10),
        preferredLanguage: currentLang,
      },
    } as ExtensionMessage,
    (response) => {
      if (chrome.runtime.lastError) {
        const errMsg = currentLang === 'en'
          ? `Extension connection error: ${chrome.runtime.lastError.message}`
          : `Error koneksi ekstensi: ${chrome.runtime.lastError.message}`;
        widget?.showError(errMsg);
        return;
      }
      if (response && !response.success) {
        const fallback = currentLang === 'en' ? 'Processing error occurred' : 'Terjadi kesalahan pemrosesan';
        widget?.showError(response.error || fallback);
      }
    }
  );
}

// ── Apply Language to Simulator DOM ──
function applyLanguage(lang: UILanguage) {
  currentLang = lang;
  const t = getI18n(lang);

  // Update Toggle Pill Buttons
  const btnEn = document.getElementById('sim-lang-en');
  const btnId = document.getElementById('sim-lang-id');
  if (btnEn && btnId) {
    if (lang === 'en') {
      btnEn.classList.add('active');
      btnId.classList.remove('active');
    } else {
      btnId.classList.add('active');
      btnEn.classList.remove('active');
    }
  }

  // Topbar labels
  const simBadge = document.getElementById('sim-badge');
  if (simBadge) simBadge.textContent = lang === 'en' ? 'Live Simulation' : 'Simulasi Langsung';

  const topbarLabel = document.getElementById('sim-topbar-label');
  if (topbarLabel) topbarLabel.textContent = lang === 'en' ? 'Demo Mode' : 'Mode Demo';

  const togglePanelText = document.getElementById('toggle-control-panel-text');
  if (togglePanelText) togglePanelText.textContent = lang === 'en' ? 'Scenarios & Context' : 'Skenario & Konteks';

  const resetWidgetText = document.getElementById('btn-reset-widget-text');
  if (resetWidgetText) resetWidgetText.textContent = lang === 'en' ? 'Reset Widget' : 'Reset Posisi Widget';

  // Tile & Speaker labels
  const interviewerName = document.getElementById('interviewer-name');
  if (interviewerName) {
    interviewerName.textContent = lang === 'en'
      ? 'Sarah Jenkins (Lead Tech Interviewer)'
      : 'Budi Santoso (Lead Tech Interviewer)';
  }

  const interviewerInitials = document.getElementById('interviewer-initials');
  if (interviewerInitials) interviewerInitials.textContent = lang === 'en' ? 'SJ' : 'BS';

  const candidateName = document.getElementById('candidate-name');
  if (candidateName) candidateName.textContent = lang === 'en' ? 'You' : 'Anda';

  const candidateAvatar = document.getElementById('candidate-avatar-label');
  if (candidateAvatar) candidateAvatar.textContent = lang === 'en' ? 'You (Candidate)' : 'Anda (Kandidat)';

  if (!isSpeaking && speakerStateEl) {
    speakerStateEl.textContent = lang === 'en' ? 'Listening for candidate response...' : 'Mendengarkan respon kandidat...';
  }

  // Settings shortcut
  const openSettingsText = document.getElementById('open-settings-shortcut-text');
  if (openSettingsText) openSettingsText.textContent = t.simOpenSettings;

  // Drawer Header
  const scenarioTitle = document.getElementById('scenario-panel-title');
  if (scenarioTitle) scenarioTitle.textContent = t.simScenarioTitle;

  const scenarioSub = document.getElementById('scenario-panel-sub');
  if (scenarioSub) {
    scenarioSub.textContent = lang === 'en'
      ? 'Click any question below to simulate live speech & captions'
      : 'Klik pertanyaan di bawah untuk mensimulasikan audio & teks live';
  }

  // Candidate Speech Test Translations
  const candidateTestLabel = document.getElementById('candidate-test-label');
  if (candidateTestLabel) {
    candidateTestLabel.textContent = lang === 'en' ? 'Test Candidate Speech ("You")' : 'Uji Bicara Kandidat ("Anda")';
  }

  const candidateTestDesc = document.getElementById('candidate-test-desc');
  if (candidateTestDesc) {
    candidateTestDesc.textContent = lang === 'en'
      ? "Simulate you answering to verify that the CC listener identifies 'You' and ignores self-speech."
      : "Simulasikan Anda menjawab untuk memastikan listener mengenali 'Anda' dan tidak menjawab suara sendiri.";
  }

  const btnPlayCandidateText = document.getElementById('btn-play-candidate-text');
  if (btnPlayCandidateText) {
    btnPlayCandidateText.textContent = lang === 'en' ? 'Simulate Candidate Answering' : 'Simulasikan Jawaban Kandidat';
  }

  // Voice Section
  const voiceToggleLabel = document.getElementById('voice-toggle-label');
  if (voiceToggleLabel) {
    voiceToggleLabel.textContent = lang === 'en' ? 'Enable Interviewer Audio' : 'Aktifkan Suara Pewawancara';
  }

  const btnStopSpeechText = document.getElementById('btn-stop-speech-text');
  if (btnStopSpeechText) btnStopSpeechText.textContent = t.simBtnStopSpeech;

  // Questions
  const q1Badge = document.getElementById('q1-badge');
  if (q1Badge) q1Badge.textContent = t.simPreset1Title;
  const q1Text = document.getElementById('q1-text');
  if (q1Text) q1Text.textContent = `"${QUESTIONS[lang].q1}"`;
  const playQ1Text = document.getElementById('play-q1-text');
  if (playQ1Text) playQ1Text.textContent = lang === 'en' ? 'Play Question 1' : 'Putar Pertanyaan 1';

  const q2Badge = document.getElementById('q2-badge');
  if (q2Badge) q2Badge.textContent = t.simPreset2Title;
  const q2Text = document.getElementById('q2-text');
  if (q2Text) q2Text.textContent = `"${QUESTIONS[lang].q2}"`;
  const playQ2Text = document.getElementById('play-q2-text');
  if (playQ2Text) playQ2Text.textContent = lang === 'en' ? 'Play Question 2' : 'Putar Pertanyaan 2';

  const q3Badge = document.getElementById('q3-badge');
  if (q3Badge) q3Badge.textContent = t.simPreset3Title;
  const q3Text = document.getElementById('q3-text');
  if (q3Text) q3Text.textContent = `"${QUESTIONS[lang].q3}"`;
  const playQ3Text = document.getElementById('play-q3-text');
  if (playQ3Text) playQ3Text.textContent = lang === 'en' ? 'Play Question 3' : 'Putar Pertanyaan 3';

  // Custom question
  const playCustomText = document.getElementById('play-custom-text');
  if (playCustomText) playCustomText.textContent = t.simBtnPlayCustom;

  if (customQuestionInput) {
    customQuestionInput.placeholder = t.simCustomPlaceholder;
  }

  // Context Section
  const contextDesc = document.getElementById('context-section-desc');
  if (contextDesc) {
    contextDesc.textContent = lang === 'en'
      ? 'Customize your profile below. The AI will weave this into its answer scripts.'
      : 'Kustomisasi profil Anda. AI akan menyelaraskan jawaban dengan data ini.';
  }

  const roleInput = document.getElementById('demo-target-role') as HTMLInputElement | null;
  if (roleInput) {
    roleInput.placeholder = lang === 'en'
      ? 'Target Role (e.g. Senior Frontend Engineer)'
      : 'Posisi Target (contoh: Senior Frontend Engineer)';
  }

  const resumeInput = document.getElementById('demo-resume-text') as HTMLTextAreaElement | null;
  if (resumeInput) {
    resumeInput.placeholder = lang === 'en'
      ? 'Type/paste your Resume summary here (experience, tech stack, achievements)...'
      : 'Ketik/tempel ringkasan resume Anda di sini (pengalaman, tech stack, pencapaian)...';
  }

  const saveDemoContextText = document.getElementById('btn-save-demo-context-text');
  if (saveDemoContextText) saveDemoContextText.textContent = lang === 'en' ? 'Save Context' : 'Simpan Konteks';

  const loadDemoContextText = document.getElementById('btn-load-demo-context-text');
  if (loadDemoContextText) loadDemoContextText.textContent = lang === 'en' ? 'Reload' : 'Muat Ulang';

  // Tips section
  const tipsHeading = document.getElementById('tips-heading');
  if (tipsHeading) {
    // preserve svg
    const svg = tipsHeading.querySelector('svg');
    tipsHeading.innerHTML = '';
    if (svg) tipsHeading.appendChild(svg);
    tipsHeading.appendChild(document.createTextNode(' ' + t.simTipsTitle));
  }

  const tipsList = document.getElementById('tips-list');
  if (tipsList) {
    if (lang === 'en') {
      tipsList.innerHTML = `
        <li>Ensure an API Key is configured in the extension popup.</li>
        <li>Click any of the <em>"Play Question"</em> buttons above.</li>
        <li>The interviewer will speak and live captions will appear at the bottom.</li>
        <li>After speech ends, the AI Copilot widget will detect silence and stream structured answers automatically!</li>
      `;
    } else {
      tipsList.innerHTML = `
        <li>Pastikan API Key telah diatur di popup ekstensi.</li>
        <li>Klik salah satu tombol <em>"Putar Pertanyaan"</em> di atas.</li>
        <li>Pewawancara akan berbicara dan closed caption muncul di bagian bawah.</li>
        <li>Setelah ucapan selesai, widget AI Copilot akan mendeteksi keheningan dan menyajikan jawaban secara otomatis!</li>
      `;
    }
  }
}

// ── Simulate Speaker Audio & Live Caption Streaming in DOM ──
function simulateSpeaker(questionText: string, isCandidate: boolean = false) {
  stopCurrentSimulation();

  isSpeaking = true;
  const candidateMicEl = document.querySelector('.candidate-tile .mic-icon');

  if (isCandidate) {
    if (audioRingEl) audioRingEl.className = 'avatar-ring';
    if (interviewerMicEl) interviewerMicEl.className = 'mic-icon';
    if (candidateMicEl) candidateMicEl.className = 'mic-icon speaking';
  } else {
    if (audioRingEl) audioRingEl.className = 'avatar-ring speaking';
    if (interviewerMicEl) interviewerMicEl.className = 'mic-icon speaking';
    if (candidateMicEl) candidateMicEl.className = 'mic-icon';
  }

  const speakerDisplayName = isCandidate
    ? (currentLang === 'en' ? 'You' : 'Anda')
    : (currentLang === 'en' ? 'Sarah Jenkins' : 'Budi Santoso');

  if (speakerStateEl) {
    if (isCandidate) {
      speakerStateEl.textContent = currentLang === 'en'
        ? 'You are speaking...'
        : 'Anda sedang berbicara...';
    } else {
      speakerStateEl.textContent = currentLang === 'en'
        ? `${speakerDisplayName} is speaking...`
        : `${speakerDisplayName} sedang berbicara...`;
    }
  }

  const speakerNameEl = document.getElementById('caption-speaker-name');
  if (speakerNameEl) {
    speakerNameEl.textContent = speakerDisplayName;
    speakerNameEl.className = isCandidate ? 'NWpY1d zs7s8d jxFHg self-speaker' : 'NWpY1d zs7s8d jxFHg';
  }

  // 1. Play Voice Audio via Web Speech API (if enabled)
  const isAudioEnabled = voiceEnabledCheck ? voiceEnabledCheck.checked : true;
  if (isAudioEnabled && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.lang = currentLang === 'en' ? 'en-US' : 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = isCandidate ? 1.2 : 1.0;

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) =>
      currentLang === 'en'
        ? v.lang.includes('en') || v.lang.includes('EN')
        : v.lang.includes('id') || v.lang.includes('ID')
    );
    if (targetVoice) utterance.voice = targetVoice;

    window.speechSynthesis.speak(utterance);
  }

  // 2. Stream Caption Word by Word (DOM + WebRTC Protobuf)
  const interviewerDeviceId = 'devices/interviewer-sim-01';
  const candidateDeviceId = 'devices/candidate-sim-01';
  const speakerDeviceId = isCandidate ? candidateDeviceId : interviewerDeviceId;

  if (currentEngine === 'rtc') {
    emitMockCollections();
  }

  const words = questionText.split(' ');
  let currentWordIdx = 0;
  let accumulatedText = '';
  const mockMsgId = ++mockMessageCounter;

  if (captionTextAreaEl) captionTextAreaEl.innerHTML = '';

  const wordIntervalMs = Math.max(160, Math.min(260, 4000 / words.length));

  speechInterval = setInterval(() => {
    if (currentWordIdx < words.length) {
      const word = words[currentWordIdx];
      const wordSpan = document.createElement('span');
      wordSpan.className = 'VbkSUe';
      wordSpan.textContent = word + ' ';

      // Populate visual DOM CC area (visible when CC is toggled ON)
      captionTextAreaEl?.appendChild(wordSpan);

      currentWordIdx++;
      accumulatedText += (accumulatedText ? ' ' : '') + word;

      // In RTC mode: emit real binary Protobuf packet over WebRTC data channel simulation!
      if (currentEngine === 'rtc') {
        emitMockCaption(speakerDeviceId, mockMsgId, currentWordIdx, accumulatedText);
      }
    } else {
      // Finished speaking — stop animation
      stopSpeakingAnimation();
    }
  }, wordIntervalMs);
}

function stopCurrentSimulation() {
  if (speechInterval) {
    clearInterval(speechInterval);
    speechInterval = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  stopSpeakingAnimation();
}

function stopSpeakingAnimation() {
  isSpeaking = false;
  if (speechInterval) {
    clearInterval(speechInterval);
    speechInterval = null;
  }
  if (audioRingEl) audioRingEl.className = 'avatar-ring';
  if (interviewerMicEl) interviewerMicEl.className = 'mic-icon';
  const candidateMicEl = document.querySelector('.candidate-tile .mic-icon');
  if (candidateMicEl) candidateMicEl.className = 'mic-icon';

  if (speakerStateEl) {
    speakerStateEl.textContent = currentLang === 'en'
      ? 'Listening for candidate response...'
      : 'Mendengarkan respon kandidat...';
  }
}

// ── Bind UI Events ──
function setupUIEventListeners() {
  // Closed Captions (CC) Toggle Button & Keyboard Shortcut 'c'
  const ccBtn = document.getElementById('cc-btn');
  const captionsWrapper = document.getElementById('captions-wrapper');
  let isCCTurnedOn = true;

  const toggleCC = () => {
    isCCTurnedOn = !isCCTurnedOn;
    if (isCCTurnedOn) {
      ccBtn?.classList.add('active');
      captionsWrapper?.classList.remove('hidden');
    } else {
      ccBtn?.classList.remove('active');
      captionsWrapper?.classList.add('hidden');
    }
  };

  ccBtn?.addEventListener('click', toggleCC);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag !== 'input' && activeTag !== 'textarea') {
        toggleCC();
      }
    }
  });

  // Language Switcher Buttons
  document.getElementById('sim-lang-en')?.addEventListener('click', async () => {
    if (currentLang !== 'en') {
      applyLanguage('en');
      await saveUILanguage('en');
      try {
        const ctx = await loadContext();
        if (ctx.language !== 'en') {
          await saveContext({ ...ctx, language: 'en' });
        }
      } catch {}
    }
  });

  document.getElementById('sim-lang-id')?.addEventListener('click', async () => {
    if (currentLang !== 'id') {
      applyLanguage('id');
      await saveUILanguage('id');
      try {
        const ctx = await loadContext();
        if (ctx.language !== 'id') {
          await saveContext({ ...ctx, language: 'id' });
        }
      } catch {}
    }
  });

  // Drawer Toggle
  toggleControlPanelBtn?.addEventListener('click', () => {
    scenarioPanel?.classList.toggle('hidden');
  });

  closePanelBtn?.addEventListener('click', () => {
    scenarioPanel?.classList.add('hidden');
  });

  // Stop Speech
  btnStopSpeech?.addEventListener('click', () => {
    stopCurrentSimulation();
  });

  // Template Questions (Interviewer)
  document.getElementById('play-q1')?.addEventListener('click', () => {
    simulateSpeaker(QUESTIONS[currentLang].q1, false);
  });

  document.getElementById('play-q2')?.addEventListener('click', () => {
    simulateSpeaker(QUESTIONS[currentLang].q2, false);
  });

  document.getElementById('play-q3')?.addEventListener('click', () => {
    simulateSpeaker(QUESTIONS[currentLang].q3, false);
  });

  // Candidate Speech Simulation ("You")
  document.getElementById('btn-play-candidate')?.addEventListener('click', () => {
    const candidateText = currentLang === 'en'
      ? 'Thank you for the question. In my previous role as a senior developer, I led the architecture of our distributed microservices.'
      : 'Terima kasih atas pertanyaannya. Pada posisi sebelumnya sebagai senior developer, saya memimpin arsitektur sistem microservices kami.';
    simulateSpeaker(candidateText, true);
  });

  // Custom Question
  playCustomBtn?.addEventListener('click', () => {
    const customText = customQuestionInput?.value.trim();
    if (!customText) {
      alert(currentLang === 'en' ? 'Please type a question in the text box first!' : 'Ketik pertanyaan terlebih dahulu di kotak teks!');
      return;
    }
    simulateSpeaker(customText, false);
  });

  // Open Settings
  openSettingsShortcut?.addEventListener('click', () => {
    const msg = currentLang === 'en'
      ? 'To update API Key / Model / Resume:\nClick the "AI Interview Copilot" extension icon in your Chrome browser toolbar.'
      : 'Untuk mengubah API Key / Model / Resume:\nKlik ikon ekstensi "AI Interview Copilot" di toolbar browser Chrome Anda.';
    alert(msg);
  });

  // Reset Widget Position
  document.getElementById('btn-reset-widget')?.addEventListener('click', () => {
    widget?.resetPosition();
  });

  // Context Management (Resume & Target Role)
  const loadDemoContext = async () => {
    const ctx = await loadContext();
    const roleInput = document.getElementById('demo-target-role') as HTMLInputElement | null;
    const resumeTextarea = document.getElementById('demo-resume-text') as HTMLTextAreaElement | null;
    if (roleInput) roleInput.value = ctx.targetRole || '';
    if (resumeTextarea) resumeTextarea.value = ctx.resumeText || '';
  };

  loadDemoContext();

  document.getElementById('btn-load-demo-context')?.addEventListener('click', () => {
    loadDemoContext();
  });

  document.getElementById('btn-save-demo-context')?.addEventListener('click', async () => {
    const roleInput = document.getElementById('demo-target-role') as HTMLInputElement | null;
    const resumeTextarea = document.getElementById('demo-resume-text') as HTMLTextAreaElement | null;
    const statusEl = document.getElementById('demo-context-status');

    const current = await loadContext();
    await saveContext({
      ...current,
      targetRole: roleInput?.value.trim() || '',
      resumeText: resumeTextarea?.value.trim() || '',
    });

    if (statusEl) {
      statusEl.textContent = currentLang === 'en'
        ? '✓ Context saved! AI will answer using this profile.'
        : '✓ Konteks tersimpan! AI akan menjawab menggunakan profil ini.';
      statusEl.style.display = 'block';
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
    }
  });
}

// ── Clock Helper ──
function updateClock() {
  if (!liveClockEl) return;
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  liveClockEl.textContent = `${hours}:${minutes}`;
}

// ── Run on DOM Ready ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSimulator);
} else {
  initSimulator();
}

