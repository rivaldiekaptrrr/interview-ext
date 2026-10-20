/* ── Prompt Builder ── Constructs the system and user prompts for AI providers ── */

import { UserContext, TranscriptEntry } from './types';

/** Build the system prompt based on user context */
export function buildSystemPrompt(context: UserContext): string {
  const langInstruction =
    context.language === 'id'
      ? 'Jawab dalam Bahasa Indonesia.'
      : context.language === 'en'
        ? 'Answer in English.'
        : 'Jawab menggunakan bahasa yang sama dengan pertanyaan yang diberikan (Auto-detect).';

  const toneInstruction =
    context.tone === 'star'
      ? `Gunakan alur STAR (Situation, Task, Action, Result) yang mengalir luwes dan alami secara naratif.`
      : context.tone === 'concise'
        ? `Jawab secara padat, tajam, dan langsung ke inti (2-3 kalimat kuat).`
        : `Berikan penjelasan teknikal mendalam dengan konsep, arsitektur, dan best practice industri.`;

  return `Anda adalah asisten interview live pribadi yang sangat berpengalaman dan cerdas.
Tugas Anda adalah memberikan skrip contekan jawaban wawancara terbaik kepada kandidat secara instan.

KONTEKS KANDIDAT:
[Target Posisi]: ${context.targetRole || 'Tidak ditentukan'}
[Perusahaan]: ${context.companyName || 'Tidak ditentukan'}
[Resume / Pengalaman]:
${context.resumeText || 'Tidak ada resume yang diberikan.'}

PANDUAN MENJAWAB:
1. Jika pertanyaan relevan dengan pengalaman kandidat, gunakan fakta riil dari Resume kandidat di atas.
2. Jika pertanyaan di luar pengalaman kandidat, jawablah secara natural, cerdas, dan profesional seolah-olah Anda adalah kandidat yang sangat berpengalaman.
3. JANGAN pernah menyebutkan bahwa Anda adalah AI atau asisten. Jawab dari sudut pandang orang pertama ("Saya...") sebagai kandidat itu sendiri.
4. ${toneInstruction}
5. ${langInstruction}

FORMAT OUTPUT (WAJIB DIIKUTI):
Langsung berikan skrip narasi jawaban lengkap yang siap dibaca dan diucapkan langsung oleh kandidat.
- Gaya bicara: Percaya diri, lancar, dan profesional.
- JANGAN sertakan analisis pertanyaan, jangan ulangi role/task Anda, dan jangan buat catatan penjelasan.
- JANGAN gunakan bullet points, nomor, atau poin kunci.
- JANGAN sertakan judul atau label seperti "**SKRIP:**" atau "**JAWABAN:**".
- JANGAN sertakan basa-basi seperti "Tentu," atau "Berikut adalah jawabannya:".
- Langsung mulai dengan kalimat pertama jawaban kandidat.`;
}

/** Build the user prompt from transcript entries */
export function buildUserPrompt(
  question: string,
  conversationHistory: TranscriptEntry[]
): string {
  const historyBlock =
    conversationHistory.length > 0
      ? `\nKONTEKS PERCAKAPAN SEBELUMNYA:\n${conversationHistory
          .slice(-10) // Keep last 10 entries for context window efficiency
          .map((e) => `[${e.isSelf ? 'Kandidat' : e.speaker}]: ${e.text}`)
          .join('\n')}\n`
      : '';

  return `${historyBlock}
PERTANYAAN INTERVIEWER:
"${question}"

Langsung berikan skrip jawaban terbaik yang siap diucapkan kandidat.`;
}

/** Parse AI response into full script */
export function parseAIResponse(rawResponse: string): {
  bulletPoints: string[];
  fullScript: string;
} {
  // Strip any accidental markdown bold headers if present
  const cleaned = rawResponse
    .replace(/\*\*(?:SKRIP LENGKAP|POIN KUNCI|JAWABAN):?\*\*/gi, '')
    .trim();

  return { bulletPoints: [], fullScript: cleaned };
}

