# Privacy Policy — EasyInterview : AI Interview Assistant

**Last Updated:** November 25, 2026  
**Effective Date:** November 25, 2026  

---

## 1. Overview & Single Purpose

**EasyInterview : AI Interview Assistant** ("we", "our", or "the Extension") is a privacy-first browser extension designed to assist job candidates during live technical and behavioral interviews on Google Meet. The single purpose of the Extension is to transcribe spoken interview questions in real time and generate structured speaking scripts based on the candidate's background and resume.

We believe your career information, voice, and interview discussions are strictly confidential. EasyInterview operates under a **100% Client-Side / Local-First** privacy model. We do not operate proprietary tracking servers, we do not store your data on external databases, and we never sell your data to third parties.

---

## 2. What Data Is Processed & How It Is Handled

### A. Google Meet Closed Captions & Live Transcripts
- **Data Collected**: Temporary text utterances from the interviewer and candidate during a Google Meet session.
- **How It Is Processed**: Transcripts are captured in real-time via Google Meet's native WebRTC DataChannels or DOM captions.
- **Retention**: **Transient (In-Memory Only)**. Caption texts exist only in the browser's temporary volatile memory (capped at the last 50 utterances) during the active call. Once you close or reload the Google Meet tab, all captured transcript buffers are permanently erased from memory.
- **Audio Recording**: The Extension does **NOT** record, save, or upload raw audio files or video streams.

### B. Candidate Profile & Resume (CV) Data
- **Data Collected**: Target job role, target company name, and parsed resume text.
- **How It Is Processed**: When you upload a `.pdf` or `.docx` file, text extraction is performed **100% locally in your browser** using bundled offline WebAssembly/JavaScript libraries (`pdfjs-dist` and `mammoth`).
- **Retention**: Saved locally on your device in your browser's private local storage (`chrome.storage.local`). It is never transmitted to any third-party file storage or remote server.

### C. AI Provider Credentials & API Keys
- **Data Collected**: Personal API keys for third-party AI providers (e.g., OpenAI, Google Gemini, Anthropic Claude, Groq, DeepSeek, OpenRouter, or local Ollama).
- **Retention**: Stored strictly on your local machine using `chrome.storage.local`. API keys are never synchronized across Google cloud accounts and are never transmitted to us or any analytics service.

---

## 3. Data Transmission to Third Parties

The Extension connects to external network endpoints solely to fulfill its core functionality upon your explicit request:

1. **Third-Party AI Language Models**:
   - When an interview question is detected or when you click **"Answer Now"**, the Extension sends a secure HTTPS request containing the interview question, previous conversation context, and your resume facts directly to your chosen AI model provider (e.g., `api.openai.com`, `generativelanguage.googleapis.com`, `api.anthropic.com`, or your custom configured endpoint).
   - The API key is sent only in the HTTP authorization headers directly to that provider.
   - Please review the privacy policies of your selected AI provider for information on how they handle API requests.
2. **Version Update Checks**:
   - The Extension queries GitHub Releases or our Cloudflare Worker update proxy (`https://interview-ext-update-proxy.pbagong75.workers.dev`) solely to check if a newer version of the extension is available. No user data, transcripts, or personal credentials are sent in these checks.

We do **NOT** partner with advertising networks, telemetry trackers, or data brokers.

---

## 4. Permissions Disclosure & Least Privilege

The Extension requests only the minimum permissions necessary:

| Permission | Purpose & Justification |
| :--- | :--- |
| `storage` | To store your settings, resume context, UI language, and widget position locally on your computer via `chrome.storage.local`. |
| `activeTab` | To interact with Google Meet tabs when you click the extension popup or invoke actions. |
| `tabs` | Used by the background service worker to check if the currently active tab is `meet.google.com` to dispatch keyboard shortcuts (`Alt+H` for HUD toggle, `Alt+J` for Answer Now). |
| `host_permissions` (`https://meet.google.com/*`) | Required to capture closed captions and display the floating assistant HUD on Google Meet. |
| `host_permissions` (AI Endpoints) | Required to transmit prompt completion requests directly to your selected AI provider or custom self-hosted endpoint. |

---

## 5. User Control & Data Deletion

You maintain complete ownership and control over your data:
- **Instant Deletion**: You can delete all stored context, resume texts, and API keys at any time by clicking **"Reset Defaults"** in the Extension Popup settings.
- **Extension Removal**: Uninstalling the Extension instantly and permanently removes all stored data from your device's `chrome.storage.local`.

---

## 6. Children's Privacy

The Extension is intended for working professionals and job applicants. We do not knowingly collect or solicit information from anyone under the age of 13.

---

## 7. Compliance Certifications

- **Google Chrome Web Store Developer Program Policies**: Compliant with Single Purpose, User Data, and Limited Use requirements.
- **GDPR / Indonesian PDP Law (UU PDP)**: Data minimization, purpose limitation, and storage limitation principles are fully respected through our local-first, zero-cloud-storage architecture.

---

## 8. Changes to This Policy

We may update this Privacy Policy from time to time to reflect improvements or regulatory changes. The latest version will always be maintained in our public repository at:  
`https://github.com/rivaldiekaptrrr/interview-ext/blob/main/PRIVACY_POLICY.md`

---

## 9. Contact Us

If you have any questions or feedback regarding this Privacy Policy or your data privacy while using EasyInterview, please contact:

- **Developer**: Rivaldi Ekaputra
- **GitHub Repository**: [https://github.com/rivaldiekaptrrr/interview-ext](https://github.com/rivaldiekaptrrr/interview-ext)
- **Email**: `rivaldiekaputra75@gmail.com`
