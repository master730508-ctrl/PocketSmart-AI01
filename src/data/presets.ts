import {
  DomainMode,
  ExpenseEntry,
  RevisionNote,
  TaskItem,
} from '../types';

export interface PromptStarter {
  id: string;
  title: string;
  categoryLabel: string;
  domain: DomainMode;
  promptEn: string;
  promptTa: string;
}

export const PROMPT_STARTERS: PromptStarter[] = [
  {
    id: 'learn-concept',
    title: 'Explain a Complex Concept Simply',
    categoryLabel: 'Learning & Education · Step-by-Step',
    domain: 'learning',
    promptEn:
      'Explain how Recursion and Dynamic Programming work in computer science. Start with a real-world analogy, then show a simple step-by-step Python example.',
    promptTa:
      'கணினி அறிவியலில் Recursion மற்றும் Dynamic Programming எவ்வாறு செயல்படுகிறது என்பதை எளிய தமிழில் (Tamil + English terms) உதாரணத்துடன் விளக்கவும்.',
  },
  {
    id: 'tech-debug',
    title: 'Debug Code & Check Performance',
    categoryLabel: 'Technology & Programming · Code Review',
    domain: 'technology',
    promptEn:
      'Why does fetching data inside a React useEffect without a cleanup or dependency array cause infinite loops or race conditions? Show the bug and the clean fix.',
    promptTa:
      'React useEffect-ல் dependency array இல்லாமல் API அழைக்கும்போது ஏன் infinite loop ஏற்படுகிறது? அதை சரிசெய்யும் சரியான குறியீட்டை (Code) விளக்கவும்.',
  },
  {
    id: 'prod-plan',
    title: 'Turn an Idea into a 7-Day Action Plan',
    categoryLabel: 'Productivity · Structured Planning',
    domain: 'productivity',
    promptEn:
      'I have 90 minutes each evening after work and want to build and launch a personal portfolio site in 7 days. Create a realistic day-by-day schedule and prioritized checklist.',
    promptTa:
      'தினமும் மாலை 90 நிமிடங்கள் மட்டுமே நேரம் உள்ளது. 7 நாட்களில் எனது சொந்த Portfolio இணையதளத்தை உருவாக்க ஒரு நடைமுறை கால அட்டவணை மற்றும் திட்டத்தை உருவாக்கவும்.',
  },
  {
    id: 'fin-scenario',
    title: 'Compare Emergency Fund vs. Debt Payoff',
    categoryLabel: 'Personal Finance · Scenario Analysis',
    domain: 'finance',
    promptEn:
      'I have ₹15,000 surplus each month. Should I build a 3-month emergency fund first or pay off a personal loan at 13.5% interest? Compare the math and trade-offs objectively.',
    promptTa:
      'மாதம் ₹15,000 சேமிக்க முடிகிறது. முதலில் அவசரகால நிதியை (Emergency Fund) உருவாக்குவதா அல்லது 13.5% வட்டி கொண்ட கடனை அடைப்பதா? இரண்டின் கணக்கீடு மற்றும் சாதக பாதகங்களை ஒப்பிடவும்.',
  },
  {
    id: 'decision-tradeoff',
    title: 'Objective Decision Matrix: Laptop Upgrade',
    categoryLabel: 'Everyday Assistance · Decision Support',
    domain: 'decision',
    promptEn:
      'Help me decide between buying a refurbished ThinkPad with 32GB RAM for Linux development vs. a MacBook Air M3 with 16GB RAM. Compare criteria, pros, cons, and trade-offs.',
    promptTa:
      'மென்பொருள் உருவாக்கத்திற்கு (Software Development) 32GB RAM கொண்ட ThinkPad வாங்குவதா அல்லது 16GB RAM கொண்ட MacBook Air வாங்குவதா? நடுநிலையான ஒப்பீட்டு அட்டவணை தருக.',
  },
  {
    id: 'everyday-email',
    title: 'Draft a Clear Professional Email',
    categoryLabel: 'Productivity · Communication',
    domain: 'productivity',
    promptEn:
      'Draft a polite, concise email to a project stakeholder explaining that a feature release needs 3 extra days for security testing, while proposing two mitigation options.',
    promptTa:
      'பாதுகாப்பு சோதனைக்காக (Security Testing) ப்ராஜெக்ட் வெளியீட்டிற்கு கூடுதலாக 3 நாட்கள் தேவை என்பதை வாடிக்கையாளருக்குத் தெரிவிக்க தெளிவான, தொழில்முறை மின்னஞ்சல் (Email) எழுதித் தரவும்.',
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't-1',
    title: 'Audit monthly subscription renewals and cancel unused tools',
    category: 'Finance',
    priority: 'High',
    estimatedMinutes: 25,
    completed: false,
    actionableTip: 'Check bank statements from the 1st and 15th of the month.',
  },
  {
    id: 't-2',
    title: 'Complete SQL indexing & query optimization revision notes',
    category: 'Learning',
    priority: 'High',
    estimatedMinutes: 45,
    completed: false,
    actionableTip: 'Focus on B-Tree vs. Composite index selectivity.',
  },
  {
    id: 't-3',
    title: 'Draft Q4 sprint roadmap summary for engineering sync',
    category: 'Productivity',
    priority: 'Medium',
    estimatedMinutes: 30,
    completed: true,
    actionableTip: 'Lead with 3 measurable deliverables and known risks.',
  },
];

export const INITIAL_EXPENSES: ExpenseEntry[] = [
  { id: 'e-1', name: 'Rent & Utilities', category: 'Essentials', amount: 24000 },
  { id: 'e-2', name: 'Groceries & Household', category: 'Essentials', amount: 11500 },
  { id: 'e-3', name: 'Transit & Fuel', category: 'Essentials', amount: 4200 },
  { id: 'e-4', name: 'Dining, Coffee & Outings', category: 'Lifestyle', amount: 6800 },
  { id: 'e-5', name: 'Cloud Servers, Books & Courses', category: 'Learning & Tech', amount: 3500 },
  { id: 'e-6', name: 'Emergency Fund & Index SIP', category: 'Savings & Debt', amount: 18000 },
];

export const INITIAL_REVISION_NOTES: RevisionNote[] = [
  {
    id: 'rn-1',
    topic: 'HTTP Status Codes & REST Idempotency',
    level: 'intermediate',
    createdAt: 'Saved Note',
    summaryMarkdown: `### Core Concept
**Idempotency** means making the same API request multiple times produces the exact same server state as making it once.

| HTTP Method | Idempotent? | Typical Use Case |
| :--- | :--- | :--- |
| \`GET\` | Yes | Safely fetch a resource without side effects |
| \`PUT\` | Yes | Replace a resource completely at a known URI |
| \`DELETE\` | Yes | Remove a resource (repeating still leaves it deleted) |
| \`POST\` | **No** | Create a new record or trigger a payment transaction |

* **Practical Rule**: Always use an \`Idempotency-Key\` header on \`POST /payments\` endpoints to prevent duplicate charges during network retries.`,
  },
];
