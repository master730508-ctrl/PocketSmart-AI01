export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export type ResponseStyle = 'auto' | 'simple' | 'concise' | 'step-by-step';

export type LanguageMode = 'en' | 'ta';

export type DomainMode =
  | 'general'
  | 'learning'
  | 'productivity'
  | 'finance'
  | 'technology'
  | 'decision';

export type ActiveWorkspaceTab =
  | 'assistant'
  | 'learning'
  | 'productivity'
  | 'finance'
  | 'decision';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  domain: DomainMode;
  knowledgeLevel: KnowledgeLevel;
  language: LanguageMode;
  sources?: GroundingSource[];
  attachmentName?: string;
  attachmentPreview?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  domain: DomainMode;
  messages: ChatMessage[];
}

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedMinutes: number;
  completed: boolean;
  actionableTip?: string;
}

export interface ExpenseEntry {
  id: string;
  name: string;
  category: 'Essentials' | 'Lifestyle' | 'Savings & Debt' | 'Learning & Tech';
  amount: number;
}

export interface FinanceAnalysisResult {
  healthSummary: string;
  keyObservations: string[];
  scenarioComparison: {
    scenarioName: string;
    monthlySavings: string;
    annualProjection: string;
    tradeoffNote: string;
  }[];
  practicalSteps: string[];
  disclaimer: string;
}

export interface DecisionAnalysisResult {
  framingAssumption: string;
  criteria: {
    name: string;
    whyItMatters: string;
  }[];
  optionsAnalysis: {
    optionName: string;
    summaryVerdict: string;
    bestSuitedIf: string;
    advantages: string[];
    disadvantages: string[];
    criteriaRatings: {
      criterionName: string;
      assessment: string;
    }[];
  }[];
  keyTradeoffs: string[];
  finalDecisionPrompt: string;
}

export interface RevisionNote {
  id: string;
  topic: string;
  level: KnowledgeLevel;
  summaryMarkdown: string;
  createdAt: string;
}
