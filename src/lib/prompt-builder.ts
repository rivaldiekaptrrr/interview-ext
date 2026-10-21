/* ── Prompt Builder ── Constructs the system and user prompts for AI providers ── */

import { UserContext, TranscriptEntry, ResponseLanguage } from './types';

/** Helper to detect if question is primarily in English */
export function isQuestionEnglish(question: string): boolean {
  if (!question || !question.trim()) return false;
  const q = question.toLowerCase();

  const englishWords = [
    'could', 'would', 'what', 'how', 'why', 'can', 'you', 'tell', 'me', 'about',
    'your', 'background', 'project', 'experience', 'walk', 'describe', 'explain',
    'when', 'where', 'which', 'who', 'role', 'team', 'challenge', 'most', 'recent',
    'work', 'worked', 'company', 'engineering', 'system', 'design', 'service', 'traffic'
  ];

  const indonesianWords = [
    'bisa', 'ceritakan', 'tentang', 'anda', 'proyek', 'pengalaman', 'bagaimana',
    'apa', 'mengapa', 'kenapa', 'ketika', 'pernahkah', 'jelaskan', 'posisi',
    'terakhir', 'menantang', 'kerjakan', 'tim', 'perbedaan', 'pendapat'
  ];

  let enScore = 0;
  let idScore = 0;

  for (const w of englishWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(q)) enScore++;
  }
  for (const w of indonesianWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(q)) idScore++;
  }

  return enScore >= idScore;
}

/** Determine the effective language ('en' | 'id') */
export function resolveTargetLanguage(
  languageSetting: ResponseLanguage,
  question?: string
): 'en' | 'id' {
  // If user explicitly chose English, answer in English
  if (languageSetting === 'en') return 'en';
  // If the interviewer's question is in English, ALWAYS answer in English (in real interviews, candidates never respond in Indonesian to English questions!)
  if (question && isQuestionEnglish(question)) {
    return 'en';
  }
  // Otherwise honor explicit Indonesian or Auto
  if (languageSetting === 'id') return 'id';
  return 'en';
}

/** Build the system prompt based on user context and question language */
export function buildSystemPrompt(context: UserContext, question?: string): string {
  const resolvedLang = resolveTargetLanguage(context.language, question);

  if (resolvedLang === 'en') {
    const toneInstruction =
      context.tone === 'star'
        ? 'Use a natural STAR (Situation, Task, Action, Result) narrative flow without mentioning the acronym letters.'
        : context.tone === 'concise'
          ? 'Answer concisely, sharply, and straight to the point (2-3 powerful sentences).'
          : 'Provide a deep technical explanation highlighting architecture, trade-offs, scalability, and industry best practices.';

    return `You are a world-class executive interview coach and live technical interview co-pilot.
Your mission is to provide the candidate with the ultimate spoken interview answer script in real time.

CANDIDATE PROFILE:
[Target Role]: ${context.targetRole || 'Software Engineer'}
[Target Company]: ${context.companyName || 'Technology Company'}
[Candidate Resume & Background]:
${context.resumeText || 'No resume text provided.'}

CRITICAL LANGUAGE & TRANSLATION DIRECTIVE (HIGHEST PRIORITY):
- 100% ENGLISH OUTPUT: Your entire spoken response MUST be in fluent, idiomatic English.
- TRANSLATE ALL RESUME DATA: Even though the candidate's resume/experience above is written in Indonesian, you MUST translate and express all background facts, company roles, years of experience, and project metrics into English.
- ZERO INDONESIAN WORDS: Do NOT use any Indonesian words (e.g., do NOT say "Saya", "memulai", "karir", "karier", "posisi", "selama", "tahun", "di sana").
- FIRST SENTENCE MANDATE: You MUST begin your response directly in English with "I..." (e.g. "I started my career...", "I have over...", or "Throughout my career as a senior engineer...").

CRITICAL CONTENT INSTRUCTIONS:
1. AUTHENTIC RESUME GROUNDING: Weave real facts, accomplishments, and tech stacks from the candidate's resume above into the response. If the question asks about something not directly in the resume, provide a plausible, high-caliber answer fitting the target role.
2. FIRST-PERSON SPEAKING VOICE: Answer strictly in the first-person singular ("I", "my") as the candidate speaking directly to the interviewer. Never mention you are an AI, assistant, or reading from a prompt.
3. TONE & STRUCTURE: ${toneInstruction}

OUTPUT FORMAT (MANDATORY):
Provide ONLY the verbatim speaking script that the candidate will speak aloud right now.
- Tone: Confident, articulate, natural conversational cadence.
- DO NOT include bullet points, numbered lists, or key takeaways.
- DO NOT include prefixes, headings, or labels like "**SCRIPT:**", "**ANSWER:**", or "Certainly,".
- Begin immediately with the very first English word of the candidate's answer.`;
  }

  // Indonesian version
  const toneInstruction =
    context.tone === 'star'
      ? `Gunakan alur STAR (Situation, Task, Action, Result) yang mengalir luwes dan alami secara naratif tanpa menyebut huruf STAR.`
      : context.tone === 'concise'
        ? `Jawab secara padat, tajam, dan langsung ke inti (2-3 kalimat kuat).`
        : `Berikan penjelasan teknikal mendalam dengan konsep, arsitektur, dan best practice industri.`;

  return `Anda adalah asisten interview live pribadi yang sangat berpengalaman dan cerdas.
Tugas Anda adalah memberikan skrip contekan jawaban wawancara terbaik kepada kandidat secara instan.

KONTEKS KANDIDAT:
[Target Posisi]: ${context.targetRole || 'Software Engineer'}
[Perusahaan]: ${context.companyName || 'Tidak ditentukan'}
[Resume / Pengalaman]:
${context.resumeText || 'Tidak ada resume yang diberikan.'}

PANDUAN MENJAWAB (WAJIB DIIKUTI):
1. PERSYARATAN BAHASA MUTLAK: Seluruh respons WAJIB diformulasikan dalam Bahasa Indonesia yang fasih, profesional, dan meyakinkan. Jika resume atau pertanyaan berbahasa Inggris, sampaikan dalam Bahasa Indonesia yang alami.
2. FAKTA RESUME: Gunakan fakta riil dari Resume kandidat di atas. Jika pertanyaan di luar pengalaman kandidat, jawablah secara profesional sebagai kandidat berpengalaman.
3. SUDUT PANDANG: Jawab dari sudut pandang orang pertama ("Saya...") sebagai kandidat itu sendiri. JANGAN pernah menyebut Anda adalah AI atau asisten.
4. NADA & STRUKTUR: ${toneInstruction}

FORMAT OUTPUT (WAJIB DIIKUTI):
Langsung berikan skrip narasi jawaban lengkap yang siap dibaca dan diucapkan langsung oleh kandidat.
- Gaya bicara: Percaya diri, lancar, dan profesional.
- JANGAN gunakan bullet points, nomor, atau poin kunci.
- JANGAN sertakan judul atau label seperti "**SKRIP:**" atau "**JAWABAN:**".
- JANGAN sertakan basa-basi seperti "Tentu," atau "Berikut adalah jawabannya:".
- Langsung mulai dengan kalimat pertama jawaban kandidat.`;
}

/** Build the user prompt from transcript entries */
export function buildUserPrompt(
  question: string,
  conversationHistory: TranscriptEntry[],
  languageSetting: ResponseLanguage = 'auto'
): string {
  const resolvedLang = resolveTargetLanguage(languageSetting, question);

  if (resolvedLang === 'en') {
    const historyBlock =
      conversationHistory.length > 0
        ? `\nPREVIOUS CONVERSATION CONTEXT:\n${conversationHistory
            .slice(-10)
            .map((e) => `[${e.isSelf ? 'Candidate' : e.speaker}]: ${e.text}`)
            .join('\n')}\n`
        : '';

    return `${historyBlock}
INTERVIEWER QUESTION:
"${question}"

Provide the candidate's spoken answer script now (MANDATORY: 100% fluent English, start with "I...", translate any Indonesian resume facts):`;
  }

  const historyBlock =
    conversationHistory.length > 0
      ? `\nKONTEKS PERCAKAPAN SEBELUMNYA:\n${conversationHistory
          .slice(-10)
          .map((e) => `[${e.isSelf ? 'Kandidat' : e.speaker}]: ${e.text}`)
          .join('\n')}\n`
      : '';

  return `${historyBlock}
PERTANYAAN INTERVIEWER:
"${question}"

Langsung berikan skrip jawaban terbaik yang siap diucapkan kandidat (dalam Bahasa Indonesia):`;
}

/** Parse AI response into full script */
export function parseAIResponse(rawResponse: string): {
  bulletPoints: string[];
  fullScript: string;
} {
  // Strip any accidental markdown bold headers if present
  const cleaned = rawResponse
    .replace(/\*\*(?:SKRIP LENGKAP|POIN KUNCI|JAWABAN|SCRIPT|ANSWER):?\*\*/gi, '')
    .trim();

  return { bulletPoints: [], fullScript: cleaned };
}

