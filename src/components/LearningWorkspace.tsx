import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Code2,
  BookmarkPlus,
  Trash2,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import {
  KnowledgeLevel,
  LanguageMode,
  RevisionNote,
} from '../types';

interface LearningWorkspaceProps {
  notes: RevisionNote[];
  setNotes: React.Dispatch<React.SetStateAction<RevisionNote[]>>;
  language: LanguageMode;
  knowledgeLevel: KnowledgeLevel;
  setKnowledgeLevel: (level: KnowledgeLevel) => void;
  onAskAssistant: (prompt: string) => void;
}

export const LearningWorkspace: React.FC<LearningWorkspaceProps> = ({
  notes,
  setNotes,
  language,
  knowledgeLevel,
  setKnowledgeLevel,
  onAskAssistant,
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [mode, setMode] = useState<
    'concept' | 'step-by-step' | 'revision-notes' | 'code-clinic'
  >('concept');
  const [codeOrProblem, setCodeOrProblem] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<string | null>(null);
  const [currentTopicTitle, setCurrentTopicTitle] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateStudyMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);

    const modePrompts: Record<typeof mode, string> = {
      concept: `Explain "${topicInput.trim()}" clearly for a ${knowledgeLevel} learner. Include: 1) Core Intuition / Simple Summary, 2) How It Works Step-by-Step, 3) Practical Real-World or Code Example, and 4) Common Pitfalls to Avoid.`,
      'step-by-step': `Solve or walk through "${topicInput.trim()}" step-by-step. ${
        codeOrProblem.trim() ? `Problem details:\n${codeOrProblem.trim()}` : ''
      }\nShow every intermediate step clearly, explain the reasoning behind each step, and verify the final answer.`,
      'revision-notes': `Create structured, high-retention Revision Notes for "${topicInput.trim()}". Use clear headings, bulleted key definitions, a comparison table if relevant, and 3 quick self-check questions with answers at the end.`,
      'code-clinic': `Act as PocketSmart AI Programming Mode for "${topicInput.trim()}". ${
        codeOrProblem.trim()
          ? `Here is the existing code or error:\n\`\`\`\n${codeOrProblem.trim()}\n\`\`\``
          : ''
      }\n1) Identify any bugs or bottlenecks clearly, 2) Provide clean, working, readable code (preserving the existing approach where sensible), 3) Explain important sections, and 4) Highlight security or performance considerations.`,
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: modePrompts[mode] }],
          knowledgeLevel,
          responseStyle: mode === 'step-by-step' ? 'step-by-step' : 'auto',
          language,
          domain: mode === 'code-clinic' ? 'technology' : 'learning',
          useSearchGrounding: false,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate learning guide');
      }
      setCurrentTopicTitle(topicInput.trim());
      setCurrentOutput(data.text);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error generating study guide.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToRevisionDeck = () => {
    if (!currentOutput || !currentTopicTitle) return;
    const newNote: RevisionNote = {
      id: `rn-${Date.now()}`,
      topic: currentTopicTitle,
      level: knowledgeLevel,
      summaryMarkdown: currentOutput,
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const removeNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs text-slate-500 mb-1">
            Learning, Education & Programming · Adaptive Depth
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {language === 'ta'
              ? 'கற்றல் மற்றும் நிரலாக்கப் பட்டறை (Learning & Code Studio)'
              : 'Concept Explainer, Problem Solver & Code Clinic'}
          </h1>
        </div>

        {/* Adaptive Knowledge Depth Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setKnowledgeLevel(lvl)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap cursor-pointer ${
                knowledgeLevel === lvl
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selector & Input Box */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {(
            [
              { id: 'concept', label: 'Explain Concept Simply' },
              { id: 'step-by-step', label: 'Step-by-Step Math / Academic Solver' },
              { id: 'revision-notes', label: 'Create Revision Notes' },
              { id: 'code-clinic', label: 'Write / Debug Code' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                mode === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleGenerateStudyMaterial} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {mode === 'code-clinic'
                ? 'Programming Task, Error Message, or Language Topic'
                : 'Topic, Concept, or Academic Question'}
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder={
                mode === 'code-clinic'
                  ? 'e.g., Prevent SQL injection & optimize pagination in Node.js + PostgreSQL'
                  : language === 'ta'
                  ? 'எ.கா: பைத்தானில் Binary Search எவ்வாறு செயல்படுகிறது?'
                  : 'e.g., How Bayes Theorem works with a medical testing example'
              }
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {(mode === 'code-clinic' || mode === 'step-by-step') && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {mode === 'code-clinic'
                  ? 'Paste Existing Code or Stack Trace (Optional — PocketSmart AI preserves your structure)'
                  : 'Additional Problem Values / Equations (Optional)'}
              </label>
              <textarea
                rows={4}
                value={codeOrProblem}
                onChange={(e) => setCodeOrProblem(e.target.value)}
                placeholder={
                  mode === 'code-clinic'
                    ? 'Paste your code snippet or error message here...'
                    : 'Paste equations, parameters, or lesson excerpt...'
                }
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              Adapted for <strong className="text-slate-700 capitalize">{knowledgeLevel}</strong> level ·{' '}
              {language === 'ta' ? 'Tamil + English Terminology' : 'English'}
            </span>
            <button
              type="submit"
              disabled={isGenerating || !topicInput.trim()}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Guide...</span>
                </>
              ) : (
                <>
                  {mode === 'code-clinic' ? (
                    <Code2 className="w-3.5 h-3.5" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Explanation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Generated Study / Code Output */}
      {currentOutput && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs text-slate-500 capitalize">
                {mode.replace('-', ' ')} · {knowledgeLevel} level
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                {currentTopicTitle}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToRevisionDeck}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save to Revision Notes</span>
              </button>
              <button
                onClick={() =>
                  onAskAssistant(
                    `Quiz me with 3 practice questions on "${currentTopicTitle}" at an ${knowledgeLevel} level and check my understanding.`
                  )
                }
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span>Practice Quiz in Chat</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="pocketsmart-prose text-sm text-slate-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentOutput}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* Saved Revision Notes Deck */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Saved Revision Notes ({notes.length})
          </h2>
          <span className="text-xs text-slate-500">
            Structured summaries & code reference sheets
          </span>
        </div>

        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {note.topic}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="capitalize">{note.level} level</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.createdAt}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeNote(note.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  aria-label="Delete revision note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="pocketsmart-prose text-sm text-slate-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note.summaryMarkdown}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
