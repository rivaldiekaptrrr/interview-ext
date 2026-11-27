import type { LandingCopy } from './types';

export const enCopy: LandingCopy = {
  nav: {
    features: 'Features',
    howItWorks: 'How it works',
    scenarios: 'Scenarios',
    faq: 'FAQ',
    cta: 'Add to Chrome',
    langToggleAria: 'Switch page language between English and Indonesian',
    skipToContent: 'Skip to main content',
  },
  hero: {
    headline: 'Answer Google Meet interview questions clearly using your own resume.',
    subheadline:
      'EasyInterview listens quietly during your call, separates the interviewer voice from yours, and drafts structured STAR answers from your CV. Install from Chrome, upload your resume once, and stay focused on the conversation.',
    primaryCta: 'Add to Chrome',
    secondaryCta: 'See how it works',
    postClickNote:
      'Free to install on Chrome. Optional paid plans sit inside the extension when you are ready for live calls. Supports English and Indonesian.',
    placeholderBanner:
      'Chrome Web Store listing URL can be configured in src/config/links.ts once published.',
    placeholderClose: 'Dismiss notice',
  },
  simulator: {
    callTitle: 'Google Meet live call preview',
    photoAlt: 'Google Meet panel interview call showing multiple interviewers in a Chrome window',
    promptInstruction: 'Pick a sample interview question to preview the assistant',
    hudTitle: 'EasyInterview',
    statusListening: 'Listening',
    statusDrafting: 'Drafting',
    statusHidden: 'Panel hidden with Alt+H',
    showHudButton: 'Show assistant (Alt+H)',
    hideButtonTitle: 'Hide panel (Alt+H)',
    answerNowButton: 'Answer Now',
    tabBullets: 'Key Bullet Points',
    tabScript: 'Full Script',
    questionHeading: 'Interviewer question',
    candidateProfileHint: 'Tailored to sample CV (Senior Product Engineer, PDF)',
    shortcutHintHide: 'Hide anytime',
    shortcutHintAnswer: 'Draft manually',
    questions: [
      {
        id: 'deadline',
        label: 'Tight deadline problem',
        interviewerName: 'Sarah Jenkins',
        interviewerRole: 'Engineering Lead',
        question:
          'Tell me about a time you solved a critical production issue under a tight deadline.',
        bullets: [
          'Situation: Checkout latency spiked 3x two days before a major campaign launch.',
          'Task: Find the bottleneck and stabilize p95 latency below 250ms without rolling back the release.',
          'Action: Profiled database queries, isolated an unindexed lookup, and shipped a targeted index with cache fallback.',
          'Result: Dropped p95 latency from 920ms to 180ms in four hours and kept launch on schedule.',
        ],
        script: [
          'Two days before our quarterly campaign launch, checkout response times jumped to nearly a second under load testing.',
          'My goal was to trace the slowdown and bring p95 latency back under 250 milliseconds without delaying the release.',
          'I profiled the checkout endpoint, spotted an unindexed customer lookup running inside a loop, and added a composite index paired with a short-lived cache fallback.',
          'Within four hours, latency settled at 180 milliseconds, and the campaign handled peak traffic with zero timeouts.',
        ],
      },
      {
        id: 'scaling',
        label: 'Project prioritization',
        interviewerName: 'Sarah Jenkins',
        interviewerRole: 'Engineering Lead',
        question:
          'How did you decide what to prioritize when scaling your previous platform?',
        bullets: [
          'Evaluated reliability risks against delivery effort using error logs and user drop-off metrics.',
          'Paused low-impact UI tweaks to fix queue retries and rate limiting first.',
          'Documented trade-offs in a one-page brief so product and engineering agreed before sprint start.',
          'Reduced failed background jobs by 68% while cutting infrastructure spend by 19%.',
        ],
        script: [
          'When traffic grew rapidly on our previous platform, every team had urgent requests competing for the same engineering week.',
          'I pulled failure rates alongside customer drop-off data so we ranked work by revenue impact and operational risk rather than opinions.',
          'We paused cosmetic dashboard updates for two sprints and focused on retry queues and rate limits, aligning the trade-offs with product leads in a short brief.',
          'That sequence cut failed background jobs by 68% and kept our cloud costs 19% lower during peak months.',
        ],
      },
      {
        id: 'conflict',
        label: 'Team disagreement',
        interviewerName: 'David Pratama',
        interviewerRole: 'Product Manager',
        question:
          'Tell me about a disagreement with a teammate and how you reached a solution.',
        bullets: [
          'Situation: Design wanted real-time inline validation on every keystroke; backend worried about API load.',
          'Task: Protect server stability without slowing down the sign-up flow for new users.',
          'Action: Built a 30-minute prototype comparing debounced checks against local validation rules.',
          'Result: Shipped hybrid validation in one sprint, keeping instant feedback while cutting redundant requests by 80%.',
        ],
        script: [
          'During a sign-up redesign, our designer wanted instant field validation on every keystroke while backend engineers feared excess API traffic.',
          'Rather than debating preferences in Slack, I proposed testing both needs with a quick prototype using real typing speed benchmarks.',
          'We paired immediate client-side format rules with a 350ms debounced availability check for usernames.',
          'Both sides signed off on the hybrid design, and it cut unnecessary server calls by 80% after launch.',
        ],
      },
    ],
  },
  problemSolution: {
    heading: 'Stay composed when an unexpected question catches you off guard',
    lead: 'Most candidates know their work well, yet struggle to organize examples quickly while watching cameras and speaking live.',
    beforeTitle: 'Without a clear structure beside you',
    beforePoints: [
      'Your mind goes blank right after a behavioral question starts.',
      'Stories run long without highlighting the action you took or the measurable outcome.',
      'Strong projects from your CV slip your memory until the call has ended.',
    ],
    afterTitle: 'With EasyInterview during Google Meet',
    afterPoints: [
      'Questions turn into clear Situation, Task, Action, and Result talking points in seconds.',
      'Examples pull directly from your uploaded PDF or DOCX resume and target job role.',
      'Short bullet points keep your answers natural while your eyes stay near the camera.',
    ],
  },
  capabilities: {
    heading: 'Built to stay out of your way during Google Meet calls',
    lead: 'Every detail inside the extension focuses on quiet reliability so your attention remains on the interviewer.',
    screenshotAlt: 'EasyInterview floating assistant panel running cleanly inside a Google Meet window',
    screenshotCaption: 'Floating Light Mode assistant overlay inside a Google Meet session.',
    items: [
      {
        id: 'speaker',
        title: 'Automatic speaker separation',
        description:
          'Distinguishes your voice from one interviewer or an entire panel, ignoring when you speak so drafts only trigger on incoming questions.',
      },
      {
        id: 'resume',
        title: 'Tailored to your CV and target role',
        description:
          'Upload a PDF or DOCX resume once, add the position and company name, and let every suggested answer draw from your actual projects.',
      },
      {
        id: 'modes',
        title: 'Bullet points or full scripts on demand',
        description:
          'Scan quick STAR bullet points to sound conversational, or expand the full script and switch between STAR, concise, or deep technical tones.',
      },
      {
        id: 'bilingual',
        title: 'Matches English and Indonesian calls',
        description:
          'Even if your resume is written in Indonesian, EasyInterview adapts your work history into natural English whenever the interviewer speaks English.',
      },
      {
        id: 'shortcuts',
        title: 'Discreet HUD with instant shortcuts',
        description:
          'Drag and resize the panel anywhere on Google Meet, hide or restore it immediately with Alt+H, or request an answer manually with Alt+J.',
        shortcutKeys: ['Alt+H', 'Alt+J'],
      },
    ],
  },
  howItWorks: {
    heading: 'Ready in three simple steps',
    lead: 'Go from installation to your first live interview rehearsal in minutes.',
    steps: [
      {
        stepNumber: 1,
        title: 'Add EasyInterview to Chrome',
        description:
          'Install the extension directly from the Chrome Web Store into your Google Chrome browser.',
      },
      {
        stepNumber: 2,
        title: 'Upload your CV and role context',
        description:
          'Drop your PDF or DOCX resume inside the extension popup, enter your target role, and pick your preferred answer tone and language.',
      },
      {
        stepNumber: 3,
        title: 'Join your Google Meet call',
        description:
          'Open Google Meet as usual. The compact assistant panel appears neatly on screen and drafts answers quietly as questions come in.',
      },
    ],
  },
  scenarios: {
    heading: 'How candidates prepare across different interview rounds',
    lead: 'Different interview stages ask for different clarity. EasyInterview adapts its framing to match the conversation.',
    items: [
      {
        id: 'engineering',
        audience: 'Software & Engineering',
        title: 'Technical architecture and incident walkthroughs',
        description:
          'Keep debugging steps, system trade-offs, and latency or uptime results sharp when explaining past engineering work.',
      },
      {
        id: 'business',
        audience: 'Product, Operations & Business',
        title: 'Structured STAR stories backed by metrics',
        description:
          'Turn cross-team collaboration, stakeholder alignment, and delivery milestones into concise answers with clear outcomes.',
      },
      {
        id: 'graduate',
        audience: 'Fresh Graduates & Global Roles',
        title: 'Confident English answers from local experience',
        description:
          'Shape internship projects, capstone work, and campus leadership into natural English or Indonesian responses without hesitating.',
      },
    ],
    trustHeading: 'Built around practical candidate privacy',
    trustPillars: [
      {
        title: 'Google Meet ready',
        description: 'Works quietly in the background without requiring screen captions turned on.',
      },
      {
        title: 'Local-first storage',
        description: 'Your CV text, job context, and transcripts remain in your browser local storage.',
      },
      {
        title: 'Zero ad trackers',
        description: 'No third-party ad tracking scripts and no selling of candidate profiles.',
      },
      {
        title: 'Bilingual EN and ID',
        description: 'Defaults to English and switches cleanly to Indonesian whenever you need.',
      },
    ],
  },
  faq: {
    heading: 'Frequently asked questions',
    lead: 'Clear answers on Chrome installation, in-extension plans, privacy, and interview etiquette.',
    items: [
      {
        id: 'pricing',
        question: 'Is EasyInterview free to install, and how does payment work?',
        answer:
          'Yes, installing EasyInterview from the Chrome Web Store is free. Once installed, you can open the extension to set up your resume and select a paid plan directly inside the extension when you are ready for live interviews.',
      },
      {
        id: 'captions',
        question: 'Does it work without turning on Google Meet captions on screen?',
        answer:
          'Yes. EasyInterview captures call speech quietly in the background during Google Meet sessions, so you never have to keep on-screen captions enabled or clutter your meeting view.',
      },
      {
        id: 'screen-share',
        question: 'What happens if I share my screen or need to hide the panel fast?',
        answer:
          'Press Alt+H at any time to hide or restore the floating panel immediately. When presenting work or live coding during an interview, share a specific browser tab or application window rather than your entire monitor.',
      },
      {
        id: 'privacy',
        question: 'How does EasyInterview handle my CV and interview transcripts?',
        answer:
          'Your resume text, target job details, and meeting transcripts stay stored locally inside your browser. EasyInterview does not run third-party ad trackers or sell your personal data. Full details are published in our Privacy Policy.',
      },
      {
        id: 'language',
        question: 'Can it help if my CV is in Indonesian while the interview is in English?',
        answer:
          'Yes. When the interviewer asks a question in English, EasyInterview automatically drafts your answer in natural English while adapting projects and achievements from your Indonesian CV.',
      },
      {
        id: 'panel',
        question: 'Does it work for panel interviews with multiple interviewers?',
        answer:
          'Yes. It monitors incoming interviewer voices automatically, ignores when you are speaking, and waits for the full question before drafting your suggested answer.',
      },
      {
        id: 'refunds',
        question: 'How do billing support and refund requests work for in-extension plans?',
        answer:
          'All billing inquiries, subscription support, and refund requests are handled directly by email at rivaldiekaputr@gmail.com. Include the email associated with your plan and a short summary of your request so we can assist promptly.',
      },
    ],
  },
  finalCta: {
    heading: 'Walk into your next Google Meet interview prepared',
    description:
      'Add EasyInterview to Chrome, upload your resume once, and keep structured talking points right where you need them.',
    button: 'Add to Chrome',
    note: 'Free Chrome Web Store install. Upgrade plans managed inside the extension.',
  },
  footer: {
    tagline: 'Quiet, resume-aware interview assistance for Google Meet.',
    navHeading: 'Product',
    legalHeading: 'Legal and support',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    supportLabel: 'Support',
    copyright: '© 2026 EasyInterview. All rights reserved.',
  },
  termsModal: {
    title: 'Terms of Service (Draft Template)',
    updated: 'Last updated November 2026',
    intro:
      'These Terms of Service govern your installation and use of the EasyInterview Chrome extension and related services. Review carefully before purchasing an in-extension plan.',
    sections: [
      {
        heading: '1. Extension License and Intended Use',
        body: 'EasyInterview provides real-time speech transcription assistance and resume-based answer suggestions to help candidates prepare and communicate clearly during online interviews. You are responsible for reviewing suggested talking points and representing your own experience truthfully.',
      },
      {
        heading: '2. In-Extension Subscriptions and Billing',
        body: 'Installing the extension from the Chrome Web Store is free. Paid subscription plans or usage credits are offered inside the extension after installation. Pricing, renewal intervals, and included allowances are displayed clearly prior to checkout.',
      },
      {
        heading: '3. Cancellations and Refunds',
        body: 'For billing questions, subscription changes, or refund requests, contact rivaldiekaputr@gmail.com with your account email and transaction reference.',
      },
      {
        heading: '4. Local Data and Privacy',
        body: 'EasyInterview stores resume context and settings locally in your browser. Please refer to our published Privacy Policy for complete data handling disclosures.',
      },
      {
        heading: '5. Disclaimer',
        body: 'EasyInterview is an interview preparation and communication aid and does not guarantee job offers or interview outcomes. Service availability depends on browser compatibility and third-party meeting platform stability.',
      },
    ],
    closeButton: 'Close terms',
  },
};
