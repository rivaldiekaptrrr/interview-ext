# Rules: Interview Assistant Behavioral Guidelines

## 1. UI Simplicity & Cleanliness
- NEVER render internal technical badges, engine indicators, or developer jargon (e.g., `⚡ RTC Live`, `DOM CC`, `Protobuf`, `DataChannel Switcher`) on any user-facing surfaces (Floating HUD, Popup, Simulator).
- Stealth mode is paramount: the floating widget must be discreet, modern, minimal, and never distract the user during live interviews.
- WebRTC DataChannel interception and DOM fallback mechanisms must always operate silently in the background.

## 2. Language Consistency & Default Language (Strict)
- The default language toggle across all interfaces (Popup, Simulator, Floating HUD) is EN (English), never ID.
- Default context preference is 'en'.
- If the interviewer asks in English or the target language is set to English, the AI response MUST strictly be in English.
- Never output Indonesian when an English question is asked. Automatically translate candidate resume details into fluent English.

## 3. Build & Testing Quality
- Always run `npm run build` to verify type safety and bundle output before finalizing changes.
- Ensure simulator updates reflect realistic Google Meet behavior without requiring developer toggles.
