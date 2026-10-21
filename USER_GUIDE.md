<h1 align="center">AI Interview Copilot — Complete User Guide</h1>

<p align="center">
  <strong>The definitive manual for setting up, personalizing, and mastering live interview assistance on Google Meet</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Google_Meet-4285F4?logo=googlemeet&logoColor=white" alt="Google Meet" />
  <img src="https://img.shields.io/badge/Extension-Manifest_V3-0F9D58?logo=googlechrome&logoColor=white" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Documentation-User_Guide-blue" alt="User Guide" />
</p>

---

## 📑 Table of Contents
1. [Introduction & Core Philosophy](#1-introduction--core-philosophy)
2. [Installation Options](#2-installation-options)
   - [Option A: Install via Pre-built ZIP (Fastest)](#option-a-install-via-pre-built-zip-fastest)
   - [Option B: Build from Source Code (Developers)](#option-b-build-from-source-code-developers)
3. [Initial Setup: AI Model Configuration](#3-initial-setup-ai-model-configuration)
   - [Supported AI Providers & Recommended Models](#supported-ai-providers--recommended-models)
   - [Testing Your API Connectivity](#testing-your-api-connectivity)
4. [Interview Personalization: Resume & Context Grounding](#4-interview-personalization-resume--context-grounding)
   - [Writing an Effective Resume Summary](#writing-an-effective-resume-summary)
   - [Selecting Response Language & Style Tones](#selecting-response-language--style-tones)
5. [Pre-Interview Rehearsal: Google Meet Simulator](#5-pre-interview-rehearsal-google-meet-simulator)
6. [Live Call Execution: Real Google Meet Procedure](#6-live-call-execution-real-google-meet-procedure)
   - [Activating Closed Captions (Mandatory)](#activating-closed-captions-mandatory)
   - [How the Smart Debouncer Works](#how-the-smart-debouncer-works)
7. [Mastering the Floating HUD](#7-mastering-the-floating-hud)
   - [STAR Key Points vs. Full Speaking Script](#star-key-points-vs-full-speaking-script)
   - [Adjusting Widget Opacity & Position](#adjusting-widget-opacity--position)
8. [Keyboard Shortcuts & The Boss Key](#8-keyboard-shortcuts--the-boss-key)
9. [Keeping the Extension Updated (In-App Checker)](#9-keeping-the-extension-updated-in-app-checker)
10. [Privacy, Security & Interview Discretion](#10-privacy-security--interview-discretion)
11. [Troubleshooting & FAQ](#11-troubleshooting--faq)

---

## 1. Introduction & Core Philosophy

**AI Interview Copilot** is designed to be your discreet pair-programming partner during technical and behavioral online interviews. 

### Why It Excels:
- **Stealth WebRTC Capture**: Intercepts Google Meet's internal WebRTC data channels (`captions`, `captions_v2`, `media-session`) and parses raw Protobuf frames client-side. Transcribes incoming speech silently in the background **without needing closed captions enabled or visible on your screen**.
- **Automatic Fallback Engine**: Seamlessly activates a high-speed `MutationObserver` on Google Meet's closed caption elements if WebRTC data channels are restricted or blocked by enterprise proxies.
- **Accurate Speaker Isolation**: Distinguishes between your microphone and the interviewer's speech using Google Meet's participant collections roster, preventing the AI from answering your own sentences.
- **Authentic Grounding**: Weaves verified facts from your actual resume and past projects into every response. You never sound like a generic textbook.
- **Translucent HUD**: Runs inside an isolated **Shadow DOM** with 85% opacity frosted glass, so you can read prompt suggestions while keeping natural eye contact with your interviewer.

---

## 2. Installation Options

### Option A: Install via Pre-built ZIP (Fastest)
*Recommended for most users — no programming tools or Node.js required.*

#### 1. On Chromium Browsers (Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi, Arc)
1. Download the latest release `.zip` directly via the secure proxy link:
   👉 **[Download Latest AI Interview Copilot ZIP](https://interview-ext-update-proxy.pbagong75.workers.dev/download)**
2. Extract (unzip) the file into a permanent folder on your computer (e.g. `Documents/ai-interview-copilot`).
3. Open your browser extension management page:
   - Chrome / Brave / Arc: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Opera: `opera://extensions/`
4. Turn **ON** the **Developer mode** toggle in the top-right corner.
5. Drag and drop the extracted folder directly into the Extensions window (or click **Load unpacked** and select the folder).
6. Click the **Puzzle icon** on your toolbar and **Pin 📌** the extension for easy access.

#### 2. On Mozilla Firefox & Zen Browser (Gecko Engine)
1. Download and extract the latest release `.zip`.
2. In Firefox or Zen Browser, navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
3. Click the **"Load Temporary Add-on..."** button.
4. Select the `manifest.json` file inside the extracted folder.
5. **AI Interview Copilot** is now instantly active! Pin the icon to your toolbar and proceed with setup.

### Option B: Build from Source Code (Developers)
*For contributors who want to compile directly from source code.*

```bash
# 1. Clone the repository
git clone https://github.com/rivaldiekaptrrr/interview-ext.git
cd interview-ext

# 2. Install dependencies
npm install

# 3. Build the production package
npm run build
```

Then load the generated `dist/` folder via `chrome://extensions/` (Chromium) or `about:debugging` (Firefox/Zen Browser).

---

## 3. Initial Setup: AI Model Configuration

Click the extension icon in your Chrome toolbar to open the **Popup Settings** window.

### Supported AI Providers & Recommended Models

| Provider | Recommended Model | Why Choose This |
| :--- | :--- | :--- |
| **Google Gemini** | `gemini-2.5-flash` or `gemini-2.0-flash` | **Fastest response latency**, generous free tier, outstanding reasoning. |
| **OpenAI** | `gpt-4o` or `gpt-4o-mini` | Benchmark coding abilities, extremely reliable structured answers. |
| **Anthropic Claude** | `claude-3-5-sonnet` | Natural human conversational cadence and nuanced architectural depth. |
| **Custom / Local AI** | Ollama (`llama3.2`, `deepseek-r1`), Groq, OpenRouter | 100% offline local privacy or ultra-fast hosted open-weights inference. |

### Testing Your API Connectivity
1. Paste your API Key in the **API Key** input box.
2. Click **Test Connection**.
3. A latency indicator will display in green (e.g., `✓ Connected (230ms)`).
4. Click **Save Settings**.

> [!TIP]
> Your API key is stored strictly on your local machine via Chrome's encrypted `chrome.storage.local`. It is never transmitted to any server other than your selected AI provider.

---

## 4. Interview Personalization: Resume & Context Grounding

Under the **Resume & Context** tab, provide the AI with your personal background so it can customize every answer.

### Auto-fill via CV Upload (PDF / DOCX ATS Vector)
You can directly drag & drop your CV file into the dropzone:
1. **Supported Formats**: `.pdf` and `.docx`.
2. **ATS Requirement**: Must be an **ATS-friendly CV** (digital text layer). Scanned documents or camera photos will be automatically detected and prompted with a friendly fallback notification.
3. **AI Structuring**: Once uploaded, your configured AI model automatically extracts your Target Role, Company, and formats your achievements into dense, high-impact STAR bullet points.
4. **Review & Save**: You can inspect or tweak any of the auto-filled fields before clicking **Save Context**.

### Manual Resume Summary
Alternatively, you can manually type or adjust your bullet points:
```text
- Senior Fullstack Engineer with 5 years experience in React, TypeScript, Go, and PostgreSQL.
- Architected a distributed messaging pipeline handling 40,000 requests/sec with Redis & Kafka.
- Led migration of a monolith into microservices, decreasing release cycle times by 60%.
- Core strengths: Distributed systems, web performance optimization, and engineering leadership.
```

### Selecting Response Language & Style Tones
- **AI Response Language**:
  - `Auto`: Detects and matches the interviewer's language.
  - `English`: Always answers in English.
  - `Bahasa Indonesia`: Always answers in Bahasa Indonesia.
- **Answer Tone & Style**:
  - **STAR Method**: Best for behavioral questions (*Situation, Task, Action, Result*).
  - **Concise & Direct**: Best for rapid-fire technical questions (*Key facts first, zero fluff*).
  - **Deep Technical**: Best for senior/lead system design questions (*Trade-offs, bottlenecks, architecture*).

---

## 5. Pre-Interview Rehearsal: Google Meet Simulator

Never test an extension for the first time during an actual interview. Use the built-in **End-to-End Google Meet Simulator**:

1. Open the extension popup and click **"Open Meet Simulator"** in the top banner.
2. A replica Google Meet conference room will launch.
3. Click **"Scenarios & Context"** on the top pill bar to open the testing drawer.
4. Click **"Play Question 1"** (Behavioral) or **"Play Question 2"** (Deep Technical).
5. Watch the interviewer speak with synthetic voice audio while live closed captions stream at the bottom of the screen.
6. The **Floating HUD Widget** will automatically detect silence and stream structured answers in real time!

---

## 6. Live Call Execution: Real Google Meet Procedure
 
When your real interview begins, follow this streamlined workflow:
 
```mermaid
graph TD
    A[Join Google Meet Call] --> B[Extension Automatically Injects]
    B --> C{WebRTC DataChannel Connected?}
    C -->|Connected| D[Stealth WebRTC Capture Active - Zero UI needed]
    C -->|Fallback| E[Fallback to DOM CC - Press 'c' to turn on CC]
    D --> F[Interviewer speaks question]
    E --> F
    F --> G[HUD previews speech live with Speaker Identification]
    G --> H[Speech stops -> 1.8s silence detected]
    H --> I[Structured STAR Answer streams in real time!]
```

### Zero-Click WebRTC Stealth Interception (Default)
In standard Google Meet calls, **AI Interview Copilot** connects to the meeting's internal peer connection and subscribes to raw caption data channels directly.
- **No need to turn on captions** on your screen.
- Works 100% silently in the background with zero visible screen clutter.
- Incoming questions are transcribed and speaker-isolated completely in stealth mode.

### Closed Captions Fallback
If an enterprise firewall, custom VPN, or unusual network configuration blocks Google Meet's internal data channels, the extension gracefully falls back to DOM monitoring:
- Press **`c`** or click the **[CC]** button in the Google Meet bottom toolbar to enable subtitles.
 
### How the Smart Debouncer Works
When an interviewer speaks, they might pause briefly to take a breath. The **Smart Debouncer** waits for **1.8 seconds of complete silence** before concluding that the question is finished. Once detected, it automatically triggers the AI response stream.
 
> [!NOTE]
> If you don't want to wait 1.8 seconds, press **`Alt + J`** to immediately force the AI to answer.

---

## 7. Mastering the Floating HUD

The HUD is designed to blend seamlessly into your screen:

```text
┌────────────────────────────────────────────────────────┐
│  [● Live]  "Can you describe your experience with..."   │
├────────────────────────────────────────────────────────┤
│  🎯 Key STAR Bullets                                   │
│  • Situation: Scaling a legacy payment service.        │
│  • Action: Implemented circuit breakers with Redis.   │
│  • Result: 99.99% uptime during Black Friday rush.     │
├────────────────────────────────────────────────────────┤
│  ▸ Expand Full Speaking Script (Natural Voice)         │
└────────────────────────────────────────────────────────┘
```

- **Dual-Layer Card**:
  - **Bullet Points**: Glanced in 3 seconds to guide your natural speech.
  - **Full Script**: Click to expand for a complete sentence-by-sentence narrative.
- **Draggable**: Click and hold the header bar to drag the HUD anywhere on your monitor.
- **Resizable**: Drag the bottom-right corner to make the HUD wider or taller.
- **85% Translucency**: Ensures text behind the HUD remains subtly visible.

---

## 8. Keyboard Shortcuts & The Boss Key

| Shortcut | Function | Practical Use Case |
| :--- | :--- | :--- |
| **`Alt + H`** | **Boss Key (Toggle HUD)** | **Critical**: Instantly hides/reveals the widget when you are asked to share your screen. |
| **`Alt + J`** | **Answer Now** | Manually triggers the AI answer without waiting for the silence pause. |
| **`c`** | **Toggle Google Meet CC** | Native Google Meet shortcut to turn captions on/off. |

---

## 9. Keeping the Extension Updated (In-App Checker)

The extension includes a built-in update detector:
- **Automatic & Private Check**: When opening the popup, it queries your private Cloudflare Worker proxy (`interview-ext-update-proxy.pbagong75.workers.dev`) to check for newer releases. Your private GitHub repository remains 100% confidential.
- **Minimalist Update Banner**: If a newer version is released, a subtle card appears:
  ```text
  [NEW UPDATE] v1.0.4 is available
  [Download ZIP]  [×]
  ```
- **Manual Check**: You can click the version pill (e.g. `v1.0.3`) in the popup header anytime to verify your installation status.

### Updating Your Unpacked Extension:
1. Click **Download ZIP** on the update banner (the latest `.zip` downloads immediately without visiting GitHub).
2. Extract the downloaded zip file.
3. Replace the contents of your existing extension folder.
4. Open `chrome://extensions/` and click the **Reload 🔄** icon on AI Interview Copilot.

---

## 10. Privacy, Security & Interview Discretion

- **No Remote Proxies**: All LLM requests are sent directly from your browser to your configured AI provider endpoint.
- **No Background Telemetry**: Zero analytics, zero logging, and zero tracking cookies.
- **Screen Share Safety**: Before sharing your screen, always press **`Alt + H`** to hide the floating widget. When screen sharing, select **"A Window"** or **"A Tab"** instead of "Entire Screen" to keep the HUD invisible.

---

## 11. Troubleshooting & FAQ

#### Q: The floating widget does not appear in Google Meet.
1. Ensure Closed Captions are turned **ON** in Google Meet (press `c`).
2. Refresh the Google Meet tab.
3. Ensure the extension is enabled in `chrome://extensions/`.

#### Q: The AI answers with generic responses instead of my resume facts.
Open the extension popup ➔ **Resume & Context** tab ➔ ensure you clicked **"Save Context"** after pasting your resume.

#### Q: I get a connection error when testing API Key.
1. Verify you have active API credits with your provider (OpenAI, Gemini, Anthropic).
2. Check that your network or VPN does not block the provider's API endpoint.

---

<p align="center">
  <em>Good luck with your interviews! You've got this. 🚀</em>
</p>
