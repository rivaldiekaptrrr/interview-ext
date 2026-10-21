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
    // Extract PDF text using pdfjs-dist
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
        const pageText = textContent.items
          .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
          .filter(Boolean)
          .join(' ');
        if (pageText.trim()) {
          pageTexts.push(pageText.trim());
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

  const cleanText = extractedText.replace(/\s+/g, ' ').trim();

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
 * Summarizes and structures the raw CV text into context fields via LLM.
 */
export async function structureCVWithAI(
  rawText: string,
  settings: ExtensionSettings,
  lang: UILanguage = 'en'
): Promise<{ targetRole: string; companyName: string; resumeText: string }> {
  if (!settings.apiKey) {
    const errorMsg =
      lang === 'en'
        ? 'API Key is missing. Please enter and save your AI Provider API key in Settings first.'
        : 'API Key belum diatur. Masukkan dan simpan API Key Anda di tab Pengaturan terlebih dahulu.';
    throw new Error(errorMsg);
  }

  // Clip raw text to prevent token explosion (~3,000 words max)
  const clippedText = rawText.slice(0, 10000);

  const systemPrompt = `You are an elite interview preparation coach and technical resume analyst.
Analyze the candidate's CV text and curate a high-impact profile context for live interview assistance.

Output MUST be a strict, raw JSON object with exactly these 3 keys:
{
  "targetRole": "Candidate's primary target job title or most senior role (e.g. Senior Frontend Engineer, Full Stack Developer, DevOps Lead). Keep under 5 words.",
  "companyName": "Candidate's most recent company or targeted company. Keep under 4 words.",
  "resumeText": "A dense, structured summary of technical capabilities, core stack, and 3-5 high-impact STAR achievements (Situation, Task, Action, Result) with metrics (e.g., 'improved latency by 35%', 'managed team of 5'). Write in concise bullet points. Max 250 words."
}

Rules:
- Respond ONLY with the JSON object. Do not wrap in markdown quotes or code blocks.
- If language context is Indonesian, write resumeText in clear professional Indonesian, otherwise default to English.`;

  const userPrompt = `Candidate CV Text:\n"""\n${clippedText}\n"""\n\nGenerate the JSON profile context now:`;

  const responseText = await sendChatCompletion(
    {
      ...settings,
      temperature: 0.2, // Low temperature for high extraction fidelity
      maxTokens: 700,
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

  try {
    const parsed = JSON.parse(cleanJsonStr);
    return {
      targetRole: typeof parsed.targetRole === 'string' ? parsed.targetRole.trim() : '',
      companyName: typeof parsed.companyName === 'string' ? parsed.companyName.trim() : '',
      resumeText: typeof parsed.resumeText === 'string' ? parsed.resumeText.trim() : cleanTextSummary(rawText),
    };
  } catch {
    // Graceful fallback if JSON parsing failed: return raw trimmed text
    return {
      targetRole: '',
      companyName: '',
      resumeText: cleanTextSummary(rawText),
    };
  }
}

/** Fallback helper if LLM parsing fails */
function cleanTextSummary(raw: string): string {
  return raw.slice(0, 1200).trim();
}
