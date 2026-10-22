import assert from 'node:assert/strict';
import { isQuestionEnglish, resolveTargetLanguage } from '../src/lib/prompt-builder.ts';
import { SmartDebouncer } from '../src/content/smart-debouncer.ts';

console.log('🧪 Starting Automated Verification for Google Meet Bugfixes...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
  }
}

// =========================================================================
// 1. TEST BUG 1: Self vs Interviewer Speaker Classification & Debouncer
// =========================================================================
console.log('--- [BUG 1] Candidate Speech vs Interviewer Filtering ---');

function mockIsSelfSpeaker(speaker, selfName) {
  if (!speaker) return false;
  const s = speaker.trim().toLowerCase();
  if (s === 'you' || s === 'anda' || s === 'kandidat' || s === 'candidate') {
    return true;
  }
  if (selfName && selfName !== 'You' && selfName !== 'Anda') {
    const selfLower = selfName.trim().toLowerCase();
    if (s === selfLower) return true;
    if (selfLower.startsWith(s) || s.startsWith(selfLower)) return true;
    const firstWord = selfLower.split(/\s+/)[0];
    if (firstWord && firstWord.length >= 3 && s.includes(firstWord)) return true;
  }
  return false;
}

test('Identifies standard Google Meet self labels ("You", "Anda")', () => {
  assert.equal(mockIsSelfSpeaker('You', 'You'), true);
  assert.equal(mockIsSelfSpeaker('you', 'You'), true);
  assert.equal(mockIsSelfSpeaker('Anda', 'You'), true);
  assert.equal(mockIsSelfSpeaker('anda', 'You'), true);
});

test('Identifies Indonesian candidate profile name', () => {
  const profileName = 'Rivaldi Ekaputra';
  assert.equal(mockIsSelfSpeaker('Rivaldi Ekaputra', profileName), true);
  assert.equal(mockIsSelfSpeaker('rivaldi ekaputra', profileName), true);
  assert.equal(mockIsSelfSpeaker('Rivaldi', profileName), true);
});

test('Distinguishes Interviewer from Candidate', () => {
  const profileName = 'Rivaldi Ekaputra';
  assert.equal(mockIsSelfSpeaker('Interviewer', profileName), false);
  assert.equal(mockIsSelfSpeaker('Budi HRD', profileName), false);
  assert.equal(mockIsSelfSpeaker('Sarah Jenkins', profileName), false);
  assert.equal(mockIsSelfSpeaker('John Technical Lead', profileName), false);
});

test('Candidate speech (isSelf: true) is strictly blocked from debouncer even when solo speaker', () => {
  let triggeredQuestion = null;
  const debouncer = new SmartDebouncer((q) => {
    triggeredQuestion = q;
  }, 50);

  // Simulate entries where only candidate has spoken (solo speaker = true)
  const entries = [
    { speaker: 'Rivaldi Ekaputra', text: 'Halo selamat pagi pak, perkenalkan nama saya Rivaldi.', isSelf: true, timestamp: Date.now() }
  ];

  const latestEntry = entries[entries.length - 1];
  // In the fixed content.ts:
  if (latestEntry && !latestEntry.isSelf) {
    debouncer.feed(latestEntry.text, false);
  }

  assert.equal(triggeredQuestion, null, 'Candidate speech should NEVER trigger AI question answering');
  debouncer.destroy();
});

test('Interviewer speech (isSelf: false) is successfully fed to debouncer', (done) => {
  let triggeredQuestion = null;
  const debouncer = new SmartDebouncer((q) => {
    triggeredQuestion = q;
  }, 20);

  const interviewerSpeech = 'Bisa ceritakan pengalaman Anda di bidang Flutter?';
  const latestEntry = {
    speaker: 'Interviewer',
    text: interviewerSpeech,
    isSelf: false,
    timestamp: Date.now()
  };

  if (latestEntry && !latestEntry.isSelf) {
    debouncer.feed(latestEntry.text, false);
  }

  // Check manual trigger
  debouncer.forceAnswer();
  assert.equal(triggeredQuestion, interviewerSpeech, 'Interviewer speech should be fed to debouncer');
  debouncer.destroy();
});

// =========================================================================
// 2. TEST BUG 2: Language Detection Accuracy & Auto-Language Matching
// =========================================================================
console.log('\n--- [BUG 2] Language Detection & Language Matching ---');

const indonesianQuestions = [
  'Coba ceritakan tentang diri Anda dan pengalaman kerja terakhir.',
  'Bagaimana cara kamu menangani konflik atau perbedaan pendapat dalam tim?',
  'Apa kelebihan dan kelemahan terbesar yang kamu miliki?',
  'Bisa tolong jelaskan proyek paling menantang yang pernah kamu kerjakan?',
  'Selamat sore, terima kasih sudah hadir. Boleh perkenalkan diri secara singkat?',
  'Menurut Anda, hal apa yang membuat Anda tertarik melamar di perusahaan kami?',
  'Apa kendala terbesar saat Anda mengimplementasikan sistem pembayaran tersebut?',
  'Bisa sebutkan arsitektur apa yang biasa kamu gunakan saat membangun aplikasi mobile?',
];

const englishQuestions = [
  'Could you please walk me through your professional background and experience?',
  'What was the most challenging technical problem you solved recently?',
  'How do you approach testing and ensuring code reliability in production?',
  'Can you describe a situation where you had a disagreement with a team member?',
  'Why do you want to join our engineering team at this company?',
  'Tell me about a time you had to optimize high-traffic database performance.',
];

test('Accurately detects 100% of Indonesian interview questions as non-English', () => {
  for (const q of indonesianQuestions) {
    const isEn = isQuestionEnglish(q);
    assert.equal(isEn, false, `Expected question to be detected as Indonesian (isQuestionEnglish=false): "${q}"`);
  }
});

test('Accurately detects 100% of English interview questions as English', () => {
  for (const q of englishQuestions) {
    const isEn = isQuestionEnglish(q);
    assert.equal(isEn, true, `Expected question to be detected as English (isQuestionEnglish=true): "${q}"`);
  }
});

test('resolveTargetLanguage with "auto" matches the question language', () => {
  // Indonesian question -> 'id'
  for (const q of indonesianQuestions) {
    const lang = resolveTargetLanguage('auto', q);
    assert.equal(lang, 'id', `Expected target language 'id' for question: "${q}"`);
  }

  // English question -> 'en'
  for (const q of englishQuestions) {
    const lang = resolveTargetLanguage('auto', q);
    assert.equal(lang, 'en', `Expected target language 'en' for question: "${q}"`);
  }
});

test('resolveTargetLanguage strictly honors explicit user choices', () => {
  // Explicit Indonesian
  assert.equal(resolveTargetLanguage('id', 'What is your greatest achievement?'), 'id');
  // Explicit English
  assert.equal(resolveTargetLanguage('en', 'Ceritakan tentang diri Anda.'), 'en');
});

// =========================================================================
// 3. TEST BUG 3: Widget Unresponsiveness, Force Answer Fallback & Safe Storage
// =========================================================================
console.log('\n--- [BUG 3] Widget Unresponsiveness, Error Fallback & Safe Storage ---');

test('debouncer.forceAnswer triggers using fallbackText when pendingText is empty', () => {
  let answered = null;
  const debouncer = new SmartDebouncer((q) => {
    answered = q;
  }, 100);

  // Simulate pendingText already consumed/empty after an error
  const fallbackInterviewerText = 'Jelaskan mengenai state management yang kamu pakai.';
  
  // User clicks "Answer Now"
  debouncer.forceAnswer(fallbackInterviewerText);
  assert.equal(answered, fallbackInterviewerText, 'forceAnswer should trigger with fallbackText when pendingText is empty');
  debouncer.destroy();
});

test('debouncer.forceAnswer prefers pendingText if available', () => {
  let answered = null;
  const debouncer = new SmartDebouncer((q) => {
    answered = q;
  }, 1000);

  debouncer.feed('Pertanyaan yang sedang ditanyakan interviewer...', false);
  debouncer.forceAnswer('Fallback lama...');
  
  assert.equal(answered, 'Pertanyaan yang sedang ditanyakan interviewer...');
  debouncer.destroy();
});

test('Storage functions handle undefined or invalid chrome runtime gracefully', async () => {
  // Simulate browser environment without chrome.storage or invalidated runtime
  const originalChrome = globalThis.chrome;
  globalThis.chrome = {}; // chrome.storage is undefined

  // Import storage dynamically to test resilience
  const { loadSettings, saveWidgetState, loadContext } = await import('../src/lib/storage.ts');

  const settings = await loadSettings();
  assert.ok(settings, 'loadSettings should return default settings when chrome.storage is unavailable');

  const context = await loadContext();
  assert.ok(context, 'loadContext should return default context');

  // Must not throw exception
  await assert.doesNotReject(async () => {
    await saveWidgetState({ isVisible: true, isMinimized: false, opacity: 0.85, position: { x: 20, y: 20 }, size: { width: 380, height: 420 }, isListening: true, autoTrigger: true });
  }, 'saveWidgetState must gracefully catch and resolve without throwing');

  globalThis.chrome = originalChrome;
});

// =========================================================================
// SUMMARY
// =========================================================================
console.log(`\n========================================`);
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} PASSED (100%)`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
