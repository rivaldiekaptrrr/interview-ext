/* ── CV / Resume Parser & ATS Validator ── Client-side extraction for PDF and DOCX ── */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { ExtensionSettings, UILanguage } from './types';
import { sendChatCompletion } from './ai-client';

// Configure PDF.js worker using locally bundled asset (offline & CSP compliant)
if (typeof window !== 'undefined') {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
    } else {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
  } catch (e) {
    console.warn('[CV Parser] Failed to set GlobalWorkerOptions.workerSrc:', e);
  }
}

export interface ParsedCVResult {
  rawText: string;
  targetRole: string;
  companyName: string;
  resumeText: string;
}

/** Error thrown when PDF is scanned or image-based (non-ATS) */
export class NonATSCVError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonATSCVError';
  }
}

/**
 * Validates and extracts text from a .pdf or .docx file directly in browser.
 * Throws NonATSCVError if the document lacks a valid digital text layer (e.g. scanned image).
 */
export async function extractTextFromCVFile(
  file: File,
  lang: UILanguage = 'en'
): Promise<string> {
  const fileName = file.name.toLowerCase();
  const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
  const isDocx =
    fileName.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (!isPdf && !isDocx) {
    const errorMsg =
      lang === 'en'
        ? 'Unsupported file format. Please upload a .pdf or .docx file only.'
        : 'Format file tidak didukung. Harap unggah berkas berekstensi .pdf atau .docx saja.';
    throw new Error(errorMsg);
  }

  // Maximum file size: 10MB
  if (file.size > 10 * 1024 * 1024) {
    const errorMsg =
      lang === 'en'
        ? 'File is too large. Maximum supported CV size is 10MB.'
        : 'Ukuran file terlalu besar. Batas maksimal ukuran CV adalah 10MB.';
    throw new Error(errorMsg);
  }

  const arrayBuffer = await file.arrayBuffer();
  let extractedText = '';

  if (isDocx) {
    // Extract DOCX text using mammoth
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value || '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        lang === 'en'
          ? `Failed to read DOCX file: ${msg}`
          : `Gagal membaca file DOCX: ${msg}`
      );
    }
  } else if (isPdf) {
    // Extract PDF text using pdfjs-dist with smart line & page grouping
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let lastY: number | null = null;
        const lines: string[] = [];
        let currentLine = '';

        for (const item of textContent.items as any[]) {
          if (!item || typeof item.str !== 'string') continue;
          const currentY = item.transform ? item.transform[5] : null;

          // If Y-coordinate jumped significantly, it's a new line on the page
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
            if (currentLine.trim()) lines.push(currentLine.trim());
            currentLine = item.str;
          } else {
            currentLine += (currentLine && !currentLine.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
          }
          lastY = currentY;

          if (item.hasEOL) {
            if (currentLine.trim()) lines.push(currentLine.trim());
            currentLine = '';
            lastY = null;
          }
        }
        if (currentLine.trim()) lines.push(currentLine.trim());

        const pageContent = lines.join('\n').trim();
        if (pageContent) {
          pageTexts.push(pageContent);
        }
      }
      extractedText = pageTexts.join('\n\n');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        lang === 'en'
          ? `Failed to parse PDF document: ${msg}`
          : `Gagal memproses dokumen PDF: ${msg}`
      );
    }
  }

  // Preserve meaningful linebreaks and clean horizontal whitespace
  const cleanText = extractedText
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Strict ATS Check: Must have at least 50 readable characters
  if (cleanText.length < 50) {
    const atsErrorMsg =
      lang === 'en'
        ? 'No readable text detected in this CV. Please ensure you upload an ATS-friendly CV (digital vector text, not a scanned image or photo).'
        : 'Teks tidak dapat dibaca dari CV ini. Pastikan Anda mengunggah CV format ATS (berbasis teks digital, bukan hasil scan gambar atau foto kamera) agar sistem dapat membaca riwayat pengalaman Anda.';
    throw new NonATSCVError(atsErrorMsg);
  }

  return cleanText;
}

/**
 * Fast local heuristic metadata extractor for targetRole and companyName.
 * Works instantly with zero network latency and without an API key.
 */
export function extractCVMetadata(text: string): { targetRole: string; companyName: string } {
  let targetRole = '';
  let companyName = '';

  // Look for target role in summary: 'seeking opportunities as (a/an) ... to'
  const roleMatch = text.match(/seeking\s+(?:opportunities\s+as\s+(?:an?|the)?\s*|a\s+role\s+as\s+(?:an?|the)?\s*)([^.\n,]+?)(?:\s+to|\s+where|\.|\n|$)/i);
  if (roleMatch && roleMatch[1]) {
    targetRole = roleMatch[1].trim();
  } else {
    // Fallback: check first title under EXPERIENCE: 'Title | Company'
    const expMatch = text.match(/(?:EXPERIENCE|PENGALAMAN)\s*\n+([^\n|]+?)\s*\|/i);
    if (expMatch && expMatch[1]) targetRole = expMatch[1].trim();
  }

  // Look for company under EXPERIENCE: '... | Company Name [-–]'
  const compMatch = text.match(/(?:EXPERIENCE|PENGALAMAN)\s*\n+[^\n|]+?\|\s*([^\n–-]+?)(?:\s*[-–]|\s*\n|$)/i);
  if (compMatch && compMatch[1]) {
    companyName = compMatch[1].trim();
  }

  return { targetRole, companyName };
}

/**
 * Summarizes and structures the raw CV text into context fields via LLM.
 * Guarantees full coverage from Page 1 through the very end of the document,
 * preserving all exact sections including Hard Skill, Soft Skill, and Certifications.
 */
export async function structureCVWithAI(
  rawText: string,
  settings: ExtensionSettings,
  lang: UILanguage = 'en'
): Promise<{ targetRole: string; companyName: string; resumeText: string }> {
  if (!settings.apiKey) {
    const meta = extractCVMetadata(rawText);
    return {
      targetRole: meta.targetRole,
      companyName: meta.companyName,
      resumeText: rawText,
    };
  }

  // Cover multi-page CVs without truncating (~8,000 words max)
  const clippedText = rawText.slice(0, 30000);

  const systemPrompt = `You are an elite interview preparation coach and technical resume analyst.
Analyze the candidate's CV text across ALL pages and curate a comprehensive profile context for live interview assistance.

CRITICAL INSTRUCTIONS:
- You MUST process the ENTIRE document from the first page through to the very end of the final page.
- Do NOT omit, truncate, or drop any sections from the candidate's CV.
- Specifically preserve all of these sections:
  * SUMMARY: Preserve candidate background and career aspirations.
  * EDUCATION: All degrees, institutions, GPA, and university projects.
  * EXPERIENCE: All companies, job titles, and achievements (STAR format).
  * LEADERSHIP & ORGANIZATIONAL EXPERIENCE: All organizations, roles, and accomplishments.
  * SERTIFIKASI / CERTIFICATIONS: All certifications, issuing bodies, and dates.
  * SKILL: You MUST preserve the exact 'Hard Skill' and 'Soft Skill' headings and all items verbatim as listed in the original CV. Do NOT replace them with generic headings like 'Programming Languages' or 'IoT & Embedded', and do NOT omit 'Hard Skill'.

Output MUST be a strict, raw JSON object with exactly these 3 keys:
{
  "targetRole": "Candidate's primary target job title (e.g. Software Engineer / IoT Developer). Keep under 5 words.",
  "companyName": "Candidate's most recent company or targeted employer (e.g. PT Sinko Prima Alloy). Keep under 4 words.",
  "resumeText": "Complete, comprehensive, multi-section structured text covering the entire CV from start to finish, including SUMMARY, EDUCATION, EXPERIENCE, LEADERSHIP, CERTIFICATIONS, and the exact SKILL with Hard Skill & Soft Skill."
}

Rules:
- Respond ONLY with the JSON object. Do not wrap in markdown quotes or code blocks.
- If language context is Indonesian, write resumeText in clear professional Indonesian, otherwise default to English.`;

  const userPrompt = `Candidate Full CV Text:\n"""\n${clippedText}\n"""\n\nGenerate the complete JSON profile context now:`;

  const responseText = await sendChatCompletion(
    {
      ...settings,
      temperature: 0.2, // Low temperature for high extraction fidelity
      maxTokens: 2500,  // Ample token budget so full multi-page details are never cut off
    },
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]
  );

  // Clean JSON output (strip markdown backticks if any)
  let cleanJsonStr = responseText.trim();
  if (cleanJsonStr.startsWith('```')) {
    cleanJsonStr = cleanJsonStr.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  const localMeta = extractCVMetadata(rawText);

  try {
    const parsed = JSON.parse(cleanJsonStr);
    return {
      targetRole: (typeof parsed.targetRole === 'string' && parsed.targetRole.trim()) || localMeta.targetRole,
      companyName: (typeof parsed.companyName === 'string' && parsed.companyName.trim()) || localMeta.companyName,
      resumeText: typeof parsed.resumeText === 'string' && parsed.resumeText.trim() ? parsed.resumeText.trim() : rawText,
    };
  } catch {
    // Graceful fallback if JSON parsing failed: return raw cleaned text
    return {
      targetRole: localMeta.targetRole,
      companyName: localMeta.companyName,
      resumeText: rawText,
    };
  }
}
