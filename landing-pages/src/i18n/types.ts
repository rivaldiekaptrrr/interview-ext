export type Locale = 'en' | 'id';

export interface SimulatorQuestion {
  id: string;
  label: string;
  interviewerName: string;
  interviewerRole: string;
  question: string;
  bullets: string[];
  script: string[];
}

export interface CapabilityItem {
  id: 'speaker' | 'resume' | 'modes' | 'bilingual' | 'shortcuts';
  title: string;
  description: string;
  shortcutKeys?: string[];
}

export interface StepItem {
  stepNumber: number;
  title: string;
  description: string;
}

export interface ScenarioItem {
  id: string;
  audience: string;
  title: string;
  description: string;
}

export interface TrustPillar {
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LandingCopy {
  nav: {
    features: string;
    howItWorks: string;
    scenarios: string;
    faq: string;
    cta: string;
    langToggleAria: string;
    skipToContent: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    postClickNote: string;
    placeholderBanner: string;
    placeholderClose: string;
  };
  simulator: {
    callTitle: string;
    photoAlt: string;
    promptInstruction: string;
    hudTitle: string;
    statusListening: string;
    statusDrafting: string;
    statusHidden: string;
    showHudButton: string;
    hideButtonTitle: string;
    answerNowButton: string;
    tabBullets: string;
    tabScript: string;
    questionHeading: string;
    candidateProfileHint: string;
    shortcutHintHide: string;
    shortcutHintAnswer: string;
    questions: SimulatorQuestion[];
  };
  problemSolution: {
    heading: string;
    lead: string;
    beforeTitle: string;
    beforePoints: string[];
    afterTitle: string;
    afterPoints: string[];
  };
  capabilities: {
    heading: string;
    lead: string;
    screenshotAlt: string;
    screenshotCaption: string;
    items: CapabilityItem[];
  };
  howItWorks: {
    heading: string;
    lead: string;
    steps: StepItem[];
  };
  scenarios: {
    heading: string;
    lead: string;
    items: ScenarioItem[];
    trustHeading: string;
    trustPillars: TrustPillar[];
  };
  faq: {
    heading: string;
    lead: string;
    items: FaqItem[];
  };
  finalCta: {
    heading: string;
    description: string;
    button: string;
    note: string;
  };
  footer: {
    tagline: string;
    navHeading: string;
    legalHeading: string;
    privacyPolicy: string;
    termsOfService: string;
    supportLabel: string;
    copyright: string;
  };
  termsModal: {
    title: string;
    updated: string;
    intro: string;
    sections: { heading: string; body: string }[];
    closeButton: string;
  };
}
