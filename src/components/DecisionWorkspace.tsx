import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
  MinusCircle,
} from 'lucide-react';
import {
  DecisionAnalysisResult,
  KnowledgeLevel,
  LanguageMode,
} from '../types';

interface DecisionWorkspaceProps {
  language: LanguageMode;
  knowledgeLevel: KnowledgeLevel;
  onAskAssistant: (prompt: string) => void;
}

export const DecisionWorkspace: React.FC<DecisionWorkspaceProps> = ({
  language,
  knowledgeLevel,
  onAskAssistant,
}) => {
  const [dilemma, setDilemma] = useState(
    'Choosing a backend database for a multi-tenant web application with both relational billing records and flexible user activity logs'
  );
  const [options, setOptions] = useState<string[]>([
    'PostgreSQL (with JSONB columns)',
    'MongoDB Atlas',
    'SQLite / LibSQL Edge',
  ]);
  const [priorities, setPriorities] = useState(
    'Strong data integrity for financial transactions, low operational overhead for a 2-person team, predictable monthly cost.'
  );
  const [newOptionInput, setNewOptionInput] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<DecisionAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddOption = () => {
    if (!newOptionInput.trim() || options.length >= 4) return;
    setOptions((prev) => [...prev, newOptionInput.trim()]);
    setNewOptionInput('');
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx: number, val: string) => {
    setOptions((prev) => prev.map((item, i) => (i === idx ? val : item)));
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!dilemma.trim() || validOptions.length < 2 || isComparing) return;

    setIsComparing(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma: dilemma.trim(),
          options: validOptions,
          priorities: priorities.trim(),
          language,
          knowledgeLevel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate decision comparison');
      }
      setResult(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error evaluating options.'
      );
    } finally {
      setIsComparing(false);
    }
  };

  const loadPresetDecision = (
    presetDilemma: string,
    presetOptions: string[],
    presetPriorities: string
  ) => {
    setDilemma(presetDilemma);
    setOptions(presetOptions);
    setPriorities(presetPriorities);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs text-slate-500 mb-1">
            Decision Support · Objective Trade-off Matrix
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {language === 'ta'
              ? 'நடுநிலை முடிவெடுக்கும் ஆய்வுக்கூடம் (Decision Support Lab)'
              : 'Objective Decision & Trade-off Comparator'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              loadPresetDecision(
                'Should I rent an apartment close to work or buy a home in the suburbs with a 20-year mortgage?',
                ['Rent near city center', 'Buy suburban apartment with EMI'],
                'Commute time under 30 mins, career mobility over the next 4 years, long-term wealth building.'
              )
            }
            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Preset: Rent vs. Buy
          </button>
          <button
            type="button"
            onClick={() =>
              loadPresetDecision(
                'Selecting a frontend architecture for a content-heavy e-commerce and documentation platform',
                ['Next.js SSR / App Router', 'Vite React SPA + Express API'],
                'Fast initial page load, simple deployment, developer velocity.'
              )
            }
            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Preset: Tech Stack Choice
          </button>
        </div>
      </div>

      {/* Decision Input Form */}
      <form
        onSubmit={handleCompare}
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-5"
      >
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            1. What decision are you trying to make?
          </label>
          <input
            type="text"
            value={dilemma}
            onChange={(e) => setDilemma(e.target.value)}
            placeholder="Describe the choice or problem clearly..."
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-700">
              2. Options to Compare (2 to 4 options)
            </label>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {options.length} / 4 options
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 w-5 shrink-0">
                  0{idx + 1}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  placeholder={`Option ${idx + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                    aria-label="Remove option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 4 && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                placeholder="Add another option to compare..."
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 w-64"
              />
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-9">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              3. Your Personal Priorities, Constraints & Context
            </label>
            <input
              type="text"
              value={priorities}
              onChange={(e) => setPriorities(e.target.value)}
              placeholder="e.g., Budget cap, time constraint, risk tolerance, long-term maintainability..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isComparing || !dilemma.trim()}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare Objectively</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Structured Decision Report */}
      {result && (
        <div className="space-y-6">
          {/* Framing & Criteria */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <span className="text-xs font-mono text-blue-700">
                01. Framing & Assumptions
              </span>
              <p className="text-sm text-slate-800 mt-1 leading-relaxed">
                {result.framingAssumption}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-mono text-blue-700">
                02. Relevant Evaluation Criteria
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2.5">
                {result.criteria.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg"
                  >
                    <div className="text-xs font-semibold text-slate-900">
                      {c.name}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{c.whyItMatters}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Objective Side-by-Side Comparison Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                03. Objective Option-by-Option Breakdown
              </h2>
              <button
                onClick={() =>
                  onAskAssistant(
                    `Help me stress-test the decision between ${options.join(
                      ' vs. '
                    )} for "${dilemma}". What edge cases or hidden costs should I check before making my final choice?`
                  )
                }
                className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Explore Edge Cases in Chat</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.optionsAnalysis.map((opt, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="border-b border-slate-100 pb-3">
                      <div className="text-xs font-mono text-slate-400">
                        Option 0{idx + 1}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                        {opt.optionName}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {opt.summaryVerdict}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-emerald-800">
                        Advantages
                      </div>
                      <ul className="space-y-1.5">
                        {opt.advantages.map((adv, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 flex items-start gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-amber-800">
                        Disadvantages & Risks
                      </div>
                      <ul className="space-y-1.5">
                        {opt.disadvantages.map((dis, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 flex items-start gap-2"
                          >
                            <MinusCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{dis}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">
                      Best suited if:{' '}
                    </span>
                    {opt.bestSuitedIf}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade-offs & Final User Autonomy Framework */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <span className="text-xs font-mono text-blue-700">
                04. Critical Trade-offs to Weigh
              </span>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                {result.keyTradeoffs.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-mono text-blue-700">
                05. Your Final Decision Guide
              </span>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {result.finalDecisionPrompt}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
