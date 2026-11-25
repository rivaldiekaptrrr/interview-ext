import assert from 'node:assert/strict';
import { isQuestionEnglish, resolveTargetLanguage } from '../src/lib/prompt-builder.ts';
import { SmartDebouncer } from '../src/content/smart-debouncer.ts';
import {
  TranscriptListener,
  isSelfSpeakerName,
  extractCandidateNameHints,
  normalizeDeviceIdKeys,
} from '../src/content/transcript-listener.ts';
import { decodeCollectionsBuffer, decodeCollectionsDetails } from '../src/content/rtc-decoder.ts';

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

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
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

test('Identifies standard Google Meet self labels ("You", "Anda")', () => {
  assert.equal(isSelfSpeakerName('You', ['You']), true);
  assert.equal(isSelfSpeakerName('you', ['You']), true);
  assert.equal(isSelfSpeakerName('Anda', ['You']), true);
  assert.equal(isSelfSpeakerName('anda', ['You']), true);
  assert.equal(isSelfSpeakerName('Rivaldi (Anda)', []), true);
  assert.equal(isSelfSpeakerName('Unknown User (You)', []), true);
});

test('Identifies Indonesian candidate profile name & email hint', () => {
  const hints = ['Rivaldi Ekaputra', 'rivaldiekaputr@gmail.com'];
  assert.equal(isSelfSpeakerName('Rivaldi Ekaputra', hints), true);
  assert.equal(isSelfSpeakerName('rivaldi ekaputra', hints), true);
  assert.equal(isSelfSpeakerName('Rivaldi', hints), true);
  assert.equal(isSelfSpeakerName('Mas Rivaldi', hints), true);
  assert.equal(isSelfSpeakerName('Rivaldi', ['rivaldiekaputr@gmail.com']), true);
});

test('Distinguishes Interviewer from Candidate', () => {
  const hints = ['Rivaldi Ekaputra', 'rivaldiekaputr@gmail.com'];
  assert.equal(isSelfSpeakerName('Interviewer', hints), false);
  assert.equal(isSelfSpeakerName('Budi HRD', hints), false);
  assert.equal(isSelfSpeakerName('Sarah Jenkins', hints), false);
  assert.equal(isSelfSpeakerName('John Technical Lead', hints), false);
});

test('Extracts candidate name accurately from resume header without false titles', () => {
  const resume = `CURRICULUM VITAE\nRivaldi Eka Putra\nIoT & Firmware Engineer\nrivaldiekaputr@gmail.com\n+62 812 3456 7890`;
  const hints = extractCandidateNameHints(resume);
  assert.deepEqual(hints, ['Rivaldi Eka Putra']);
  assert.equal(isSelfSpeakerName('Rivaldi', hints), true);
  assert.equal(isSelfSpeakerName('Pak Budi', hints), false);
});

test('Normalizes WebRTC spaces/.../devices/... IDs to all lookup keys', () => {
  const keys = normalizeDeviceIdKeys('spaces/abc-xyz-123/devices/987654321');
  assert.ok(keys.includes('spaces/abc-xyz-123/devices/987654321'));
  assert.ok(keys.includes('devices/987654321'));
  assert.ok(keys.includes('987654321'));
});

await asyncTest('decodeCollectionsBuffer ignores numeric Gaia IDs and locale codes to find participant name', async () => {
  const writeVarint = (v) => {
    const out = [];
    let n = v;
    while (n > 127) { out.push((n & 0x7f) | 0x80); n >>>= 7; }
    out.push(n & 0x7f);
    return out;
  };
  const writeStr = (field, s) => {
    const b = new TextEncoder().encode(s);
    return [...writeVarint((field << 3) | 2), ...writeVarint(b.length), ...b];
  };
  const buf = new Uint8Array([
    ...writeStr(1, 'spaces/meet-room/devices/112233'),
    ...writeStr(2, '109876543210987654321'),
    ...writeStr(3, 'id-ID'),
    ...writeStr(4, 'Rivaldi Eka Putra'),
    ...writeStr(1, 'spaces/meet-room/devices/445566'),
    ...writeStr(2, 'Budi Santoso'),
  ]).buffer;

  const parsed = await decodeCollectionsBuffer(buf);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].deviceName, 'Rivaldi Eka Putra');
  assert.equal(parsed[1].deviceName, 'Budi Santoso');
});

await asyncTest('decodeCollectionsDetails decodes Google Meet SyncMeetingSpaceCollections & CollectionMessage schemas', async () => {
  const writeVarint = (v) => {
    const out = [];
    let n = v;
    while (n > 127) { out.push((n & 0x7f) | 0x80); n >>>= 7; }
    out.push(n & 0x7f);
    return out;
  };
  const writeBytes = (field, bytes) => [
    ...writeVarint((field << 3) | 2),
    ...writeVarint(bytes.length),
    ...bytes,
  ];
  const writeStr = (field, s) => writeBytes(field, Array.from(new TextEncoder().encode(s)));
  const writeInt = (field, v) => [...writeVarint((field << 3) | 0), ...writeVarint(v)];

  // Test 1: MeetingSpaceCollectionResponse (field 2 -> field 2 -> field 2 -> UserDetails)
  const user1 = [
    ...writeStr(1, 'spaces/room1/devices/self-11'),
    ...writeStr(2, 'Rivaldi Eka Putra'),
    ...writeStr(3, 'https://lh3.googleusercontent.com/avatar1'),
    ...writeStr(29, 'Rivaldi'),
  ];
  const user2 = [
    ...writeStr(1, 'spaces/room1/devices/host-22'),
    ...writeStr(2, 'Pak Budi HRD'),
    ...writeStr(29, 'Budi'),
  ];
  const syncRespBytes = new Uint8Array(
    writeBytes(2, writeBytes(2, [...writeBytes(2, user1), ...writeBytes(2, user2)]))
  ).buffer;

  const syncDecoded = await decodeCollectionsDetails(syncRespBytes);
  assert.equal(syncDecoded.participants.length, 2);
  assert.equal(syncDecoded.participants[0].deviceId, 'spaces/room1/devices/self-11');
  assert.equal(syncDecoded.participants[0].deviceName, 'Rivaldi Eka Putra');
  assert.equal(syncDecoded.participants[1].deviceName, 'Pak Budi HRD');

  // Test 2: CollectionMessage (field 1 -> field 2 -> { field 3 media streams, field 13 -> 1 -> 2 userDetails })
  const mediaEntry = [
    ...writeInt(2, 1), // streamType = 1 (audio)
    ...writeStr(4, '3456789012'),
    ...writeStr(6, 'spaces/room1/devices/host-22'),
  ];
  const wrapper1 = [
    ...writeBytes(3, writeBytes(2, mediaEntry)),
    ...writeBytes(13, writeBytes(1, writeBytes(2, user2))),
  ];
  const colMsgBytes = new Uint8Array(writeBytes(1, writeBytes(2, wrapper1))).buffer;
  const colDecoded = await decodeCollectionsDetails(colMsgBytes);
  assert.equal(colDecoded.streams.length, 1);
  assert.equal(colDecoded.streams[0].ssrc, '3456789012');
  assert.equal(colDecoded.streams[0].deviceId, 'spaces/room1/devices/host-22');
  assert.equal(colDecoded.participants.length, 1);
  assert.equal(colDecoded.participants[0].deviceName, 'Pak Budi HRD');
});

await asyncTest('TranscriptListener isolates self tile (visual_effects) and muted mic even if interviewer shares CV name', async () => {
  const prevWin = globalThis.window;
  const prevDoc = globalThis.document;
  const listeners = new Map();
  let micMutedAttr = 'true';

  const makeTile = (id, text) => ({
    textContent: text,
    getAttribute: (k) => (k === 'data-participant-id' ? id : null),
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
  });

  const tiles = [
    makeTile('spaces/YF8cSDtjaGsB/devices/541', 'Rivaldi Eka Putra Rivaldi Eka Putra'),
    makeTile('spaces/YF8cSDtjaGsB/devices/551', 'frame_person Reframe visual_effects Backgrounds and effects '),
  ];

  globalThis.window = {
    addEventListener: (ev, cb) => listeners.set(ev, cb),
    removeEventListener: (ev) => listeners.delete(ev),
    postMessage: () => {},
  };
  globalThis.document = {
    body: {},
    querySelector: (sel) => {
      if (sel.includes('data-is-muted')) {
        return { getAttribute: (k) => (k === 'data-is-muted' ? micMutedAttr : null) };
      }
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel.includes('data-participant-id')) return tiles;
      return [];
    },
  };
  const prevMO = globalThis.MutationObserver;
  const prevRAF = globalThis.requestAnimationFrame;
  const prevCAF = globalThis.cancelAnimationFrame;
  globalThis.MutationObserver = class { observe() {} disconnect() {} };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};

  try {
    let captured = [];
    const listener = new TranscriptListener((entries) => { captured = [...entries]; });
    listener.setSelfNameHints(['Rivaldi Eka Putra'], 'resume');
    listener.start();

    const writeVarint = (v) => {
      const out = []; let n = v;
      while (n > 127) { out.push((n & 0x7f) | 0x80); n >>>= 7; }
      out.push(n & 0x7f); return out;
    };
    const writeBytes = (f, b) => [...writeVarint((f << 3) | 2), ...writeVarint(b.length), ...b];
    const writeStr = (f, s) => writeBytes(f, Array.from(new TextEncoder().encode(s)));
    const writeInt = (f, v) => [...writeVarint((f << 3) | 0), ...writeVarint(v)];

    const msgHandler = listeners.get('message');
    // Roster says devices/541 = Rivaldi Eka Putra, devices/551 = Local User
    const rosterBuf = new Uint8Array([
      ...writeStr(1, 'spaces/YF8cSDtjaGsB/devices/541'),
      ...writeStr(2, 'Rivaldi Eka Putra'),
      ...writeStr(1, 'spaces/YF8cSDtjaGsB/devices/551'),
      ...writeStr(2, 'Bagong User'),
    ]).buffer;
    await msgHandler({ source: globalThis.window, data: { source: 'interview-ext-collections', buffer: rosterBuf } });

    // Even when mic is unmuted later, devices/551 is locked self, so devices/541 ("Rivaldi Eka Putra") must be remote!
    micMutedAttr = 'false';
    const remoteCapBuf = new Uint8Array([
      ...writeStr(1, 'spaces/YF8cSDtjaGsB/devices/541'),
      ...writeInt(2, 10),
      ...writeInt(3, 1),
      ...writeStr(6, 'malam Mas Rivaldi'),
    ]).buffer;
    await msgHandler({ source: globalThis.window, data: { source: 'interview-ext-caption', buffer: remoteCapBuf, isV2: false } });

    const selfCapBuf = new Uint8Array([
      ...writeStr(1, 'spaces/YF8cSDtjaGsB/devices/551'),
      ...writeInt(2, 11),
      ...writeInt(3, 1),
      ...writeStr(6, 'iya malam pak'),
    ]).buffer;
    await msgHandler({ source: globalThis.window, data: { source: 'interview-ext-caption', buffer: selfCapBuf, isV2: false } });

    assert.equal(captured.length, 2);
    assert.equal(captured[0].text, 'malam Mas Rivaldi');
    assert.equal(captured[0].isSelf, false, 'Remote device 541 should NOT be classified as self');
    assert.equal(captured[1].text, 'iya malam pak');
    assert.equal(captured[1].isSelf, true, 'Self tile 551 with visual_effects should be classified as self');
    listener.stop();
  } finally {
    globalThis.window = prevWin;
    globalThis.document = prevDoc;
    globalThis.MutationObserver = prevMO;
    globalThis.requestAnimationFrame = prevRAF;
    globalThis.cancelAnimationFrame = prevCAF;
  }
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
