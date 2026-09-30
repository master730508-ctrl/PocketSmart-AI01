import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Plus,
  Globe,
  Paperclip,
  X,
  Volume2,
  Loader2,
  Copy,
  Check,
  BookmarkPlus,
  ListPlus,
  ExternalLink,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ActiveWorkspaceTab,
  ChatMessage,
  ChatSession,
  DomainMode,
  ExpenseEntry,
  KnowledgeLevel,
  LanguageMode,
  ResponseStyle,
  RevisionNote,
  TaskItem,
} from './types';
import {
  INITIAL_EXPENSES,
  INITIAL_REVISION_NOTES,
  INITIAL_TASKS,
  PROMPT_STARTERS,
} from './data/presets';
import { ProductivityWorkspace } from './components/ProductivityWorkspace';
import { FinanceWorkspace } from './components/FinanceWorkspace';
import { DecisionWorkspace } from './components/DecisionWorkspace';
import { LearningWorkspace } from './components/LearningWorkspace';

export default function App() {
  // Navigation & Personalization State
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('assistant');
  const [knowledgeLevel, setKnowledgeLevel] =
    useState<KnowledgeLevel>('intermediate');
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('auto');
  const [language, setLanguage] = useState<LanguageMode>('en');
  const [domain, setDomain] = useState<DomainMode>('general');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState<boolean>(false);

  // Persistent Workspace State across tabs
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(INITIAL_EXPENSES);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(85000);
  const [revisionNotes, setRevisionNotes] = useState<RevisionNote[]>(
    INITIAL_REVISION_NOTES
  );

  // Multi-session Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-initial',
      title: 'Welcome & Daily Planning',
      updatedAt: 'Just now',
      domain: 'general',
      messages: [],
    },
  ]);
  const [activeSessionId, setActiveSessionId] =
    useState<string>('session-initial');

  // Composer State
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{
    name: string;
    mimeType: string;
    data: string;
    previewUrl: string;
  } | null>(null);

  // Audio TTS & Action Feedback State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [savedActionFeedback, setSavedActionFeedback] = useState<string | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (activeTab === 'assistant') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages.length, isSending, activeTab]);

  const showTransientToast = (msg: string) => {
    setSavedActionFeedback(msg);
    setTimeout(() => {
      setSavedActionFeedback(null);
    }, 2600);
  };

  const handleCreateNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: language === 'ta' ? 'புதிய உரையாடல் (New Session)' : 'New Session',
      updatedAt: 'Just now',
      domain,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setActiveTab('assistant');
    setErrorBanner(null);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      setSessions([
        {
          id: `session-${Date.now()}`,
          title: 'New Session',
          updatedAt: 'Just now',
          domain: 'general',
          messages: [],
        },
      ]);
      return;
    }
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorBanner('Please attach an image file (PNG, JPEG, WEBP) for visual analysis.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.split(',')[1];
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: base64Data,
        previewUrl: resultStr,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendPromptToAssistant = async (
    promptText: string,
    overrideDomain?: DomainMode
  ) => {
    const trimmed = promptText.trim();
    if (!trimmed || isSending) return;

    const effectiveDomain = overrideDomain || domain;
    if (overrideDomain) {
      setDomain(overrideDomain);
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      domain: effectiveDomain,
      knowledgeLevel,
      language,
      attachmentName: attachment?.name,
      attachmentPreview: attachment?.previewUrl,
    };

    const currentAttachment = attachment;
    setInputPrompt('');
    setAttachment(null);
    setErrorBanner(null);
    setIsSending(true);

    const updatedMessages = [...activeSession.messages, userMessage];

    // Update session with user message & automatic title on first turn
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title:
                s.messages.length === 0
                  ? trimmed.slice(0, 42) + (trimmed.length > 42 ? '...' : '')
                  : s.title,
              updatedAt: 'Just now',
              domain: effectiveDomain,
              messages: updatedMessages,
            }
          : s
      )
    );

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          knowledgeLevel,
          responseStyle,
          language,
          domain: effectiveDomain,
          useSearchGrounding,
          attachment: currentAttachment
            ? {
                data: currentAttachment.data,
                mimeType: currentAttachment.mimeType,
              }
            : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to reach PocketSmart AI right now.'
        );
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        domain: effectiveDomain,
        knowledgeLevel,
        language,
        sources: data.sources || [],
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                updatedAt: 'Just now',
                messages: [...updatedMessages, assistantMessage],
              }
            : s
        )
      );
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while generating the response.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPromptToAssistant(inputPrompt);
  };

  const handleJumpToAssistantWithPrompt = (promptText: string) => {
    setActiveTab('assistant');
    sendPromptToAssistant(promptText);
  };

  const handleReadAloud = async (msg: ChatMessage) => {
    if (playingMessageId === msg.id) {
      audioRef.current?.pause();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(msg.id);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.content }),
      });
      const data = await response.json();
      if (!response.ok || !data.audioDataUrl) {
        throw new Error(data.error || 'TTS failed');
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(data.audioDataUrl);
      audioRef.current = audio;
      audio.onended = () => setPlayingMessageId(null);
      audio.onerror = () => setPlayingMessageId(null);
      await audio.play();
    } catch {
      setPlayingMessageId(null);
      showTransientToast('Audio read-aloud unavailable for this passage.');
    }
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 1800);
  };

  const handleSaveMessageToRevisionNotes = (msg: ChatMessage) => {
    const firstHeadingMatch = msg.content.match(/^#+\s+(.+)$/m);
    const topicTitle = firstHeadingMatch
      ? firstHeadingMatch[1].slice(0, 60)
      : activeSession.title;

    setRevisionNotes((prev) => [
      {
        id: `rn-${Date.now()}`,
        topic: topicTitle,
        level: msg.knowledgeLevel,
        summaryMarkdown: msg.content,
        createdAt: msg.timestamp,
      },
      ...prev,
    ]);
    showTransientToast('Saved response to Learning Revision Notes');
  };

  const handleExtractMessageToTask = (msg: ChatMessage) => {
    const cleanFirstLine = msg.content
      .replace(/[#*`>-]/g, '')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 8);

    const taskTitle = cleanFirstLine
      ? cleanFirstLine.slice(0, 85)
      : `Follow up on: ${activeSession.title}`;

    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        title: taskTitle,
        category: msg.domain.charAt(0).toUpperCase() + msg.domain.slice(1),
        priority: 'Medium',
        estimatedMinutes: 30,
        completed: false,
      },
      ...prev,
    ]);
    showTransientToast('Added action item to Productivity Planner');
  };

  const pendingTaskCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#assistant"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('assistant');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
        >
          PocketSmart AI
        </a>

        {/* Zone 2: 5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'assistant'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Assistant
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'learning'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Learning
          </button>
          <button
            onClick={() => setActiveTab('productivity')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'productivity'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Productivity
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'finance'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Finance
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'decision'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Decision Lab
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Switch between English and Tamil + English bilingual response mode"
          >
            {language === 'en' ? 'English · தமிழ்' : 'தமிழ் · English'}
          </button>
          <button
            onClick={handleCreateNewSession}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            + New Session
          </button>
        </div>
      </header>

      {/* Mobile Workspace Navigation Strip */}
      <div className="md:hidden flex items-center justify-between gap-1 px-3 py-2 bg-white border-b border-slate-200 overflow-x-auto">
        {(
          [
            { id: 'assistant', label: 'Assistant' },
            { id: 'learning', label: 'Learning' },
            { id: 'productivity', label: 'Productivity' },
            { id: 'finance', label: 'Finance' },
            { id: 'decision', label: 'Decision Lab' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setMobileSettingsOpen((prev) => !prev)}
          className="p-1.5 text-slate-600 hover:text-slate-900 shrink-0"
          aria-label="Toggle personalization settings"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Transient Feedback Toast */}
      {savedActionFeedback && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-md">
          {savedActionFeedback}
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar (Desktop & Mobile Drawer): Personalization & Session History */}
        <aside
          className={`${
            mobileSettingsOpen ? 'block' : 'hidden'
          } lg:flex lg:flex-col w-full lg:w-72 bg-white border-r border-slate-200 shrink-0 justify-between p-4 space-y-6`}
        >
          <div className="space-y-6">
            {/* Personalization Controls (Section 6 of Master Prompt) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  Personalization & Depth
                </span>
                <span className="text-xs text-slate-400">Adaptive AI</span>
              </div>

              {/* Knowledge Level */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Knowledge Level
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(
                    (lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setKnowledgeLevel(lvl)}
                        className={`py-1.5 px-2 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap cursor-pointer ${
                          knowledgeLevel === lvl
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lvl === 'intermediate' ? 'Interm.' : lvl}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Response Style */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Response Formatting Style
                </label>
                <select
                  value={responseStyle}
                  onChange={(e) =>
                    setResponseStyle(e.target.value as ResponseStyle)
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="auto">Auto (Match Complexity)</option>
                  <option value="simple">Simple & Easy (Zero Jargon)</option>
                  <option value="concise">Short & Direct Answer</option>
                  <option value="step-by-step">
                    Step-by-Step Detailed Guide
                  </option>
                </select>
              </div>

              {/* Domain Focus */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Active Assistant Mode
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as DomainMode)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="general">Everyday Personal Assistant</option>
                  <option value="learning">Learning & Education Tutor</option>
                  <option value="technology">
                    Programming & Tech Specialist
                  </option>
                  <option value="productivity">
                    Productivity & Task Coach
                  </option>
                  <option value="finance">
                    Personal Finance & Budget Analyst
                  </option>
                  <option value="decision">
                    Objective Decision Support
                  </option>
                </select>
              </div>

              {/* Live Web Verification (Section 5: Accuracy Rules) */}
              <div className="pt-1">
                <label className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg cursor-pointer">
                  <div className="min-w-0">
                    <span className="block text-xs font-medium text-slate-900">
                      Verify with Google Search
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Cite live sources for changing facts
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={useSearchGrounding}
                    onChange={(e) => setUseSearchGrounding(e.target.checked)}
                    className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Recent Sessions List */}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  Sessions
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {sessions.length}
                </span>
              </div>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setActiveTab('assistant');
                      setMobileSettingsOpen(false);
                    }}
                    className={`group px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      s.id === activeSession.id && activeTab === 'assistant'
                        ? 'bg-blue-50/90 text-blue-900 font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="truncate">
                      <span className="block truncate">{s.title}</span>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {s.domain} · {s.messages.length} msgs
                      </span>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 transition-opacity"
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workspace Quick Overview Footer */}
          <div className="border-t border-slate-200 pt-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Pending Tasks</span>
              <button
                onClick={() => setActiveTab('productivity')}
                className="font-mono tabular-nums font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
              >
                {pendingTaskCount} active
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Saved Revision Notes</span>
              <button
                onClick={() => setActiveTab('learning')}
                className="font-mono tabular-nums font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
              >
                {revisionNotes.length} notes
              </button>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 leading-normal">
              Private session workspace. Information is used strictly for your requested task.
            </p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col min-w-0">
          {activeTab === 'learning' && (
            <div className="flex-1 overflow-y-auto">
              <LearningWorkspace
                notes={revisionNotes}
                setNotes={setRevisionNotes}
                language={language}
                knowledgeLevel={knowledgeLevel}
                setKnowledgeLevel={setKnowledgeLevel}
                onAskAssistant={handleJumpToAssistantWithPrompt}
              />
            </div>
          )}

          {activeTab === 'productivity' && (
            <div className="flex-1 overflow-y-auto">
              <ProductivityWorkspace
                tasks={tasks}
                setTasks={setTasks}
                language={language}
                knowledgeLevel={knowledgeLevel}
                onAskAssistant={handleJumpToAssistantWithPrompt}
              />
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="flex-1 overflow-y-auto">
              <FinanceWorkspace
                expenses={expenses}
                setExpenses={setExpenses}
                monthlyIncome={monthlyIncome}
                setMonthlyIncome={setMonthlyIncome}
                language={language}
                onAskAssistant={handleJumpToAssistantWithPrompt}
              />
            </div>
          )}

          {activeTab === 'decision' && (
            <div className="flex-1 overflow-y-auto">
              <DecisionWorkspace
                language={language}
                knowledgeLevel={knowledgeLevel}
                onAskAssistant={handleJumpToAssistantWithPrompt}
              />
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6">
              {/* Conversation Stream or Empty Welcome State */}
              <div className="flex-1 py-6 space-y-6">
                {activeSession.messages.length === 0 ? (
                  <div className="space-y-8 py-4">
                    {/* Focal Hero Introduction */}
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Personal AI Assistant</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">
                          {knowledgeLevel} Depth
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {language === 'ta'
                            ? 'தமிழ் + English Mode'
                            : 'English Mode'}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 text-balance">
                        {language === 'ta'
                          ? 'வணக்கம்! இன்று உங்களுக்கு என்ன கற்க, திட்டமிட அல்லது தீர்க்க உதவி தேவை?'
                          : 'What problem can we solve, plan, or clarify today?'}
                      </h1>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {language === 'ta'
                          ? 'PocketSmart AI உங்களின் அறிவு நிலைக்கு ஏற்ப எளிய விளக்கங்கள், படிப்படியான கணக்கீடுகள், நிரலாக்க உதவி மற்றும் நடுநிலையான முடிவுகளை வழங்குகிறது.'
                          : 'PocketSmart AI adapts to your knowledge level to deliver step-by-step explanations, structured productivity plans, budget scenario math, working code, and objective trade-off comparisons.'}
                      </p>
                    </div>

                    {/* Curated Starter Grid across Core Capabilities */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-slate-900">
                          {language === 'ta'
                            ? 'முக்கிய திறன்கள் மற்றும் உடனடித் தொடக்கங்கள்'
                            : 'Core Capabilities & Starter Workflows'}
                        </h2>
                        <span className="text-xs text-slate-500">
                          Click any prompt to begin
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {PROMPT_STARTERS.map((starter) => (
                          <button
                            key={starter.id}
                            onClick={() =>
                              sendPromptToAssistant(
                                language === 'ta'
                                  ? starter.promptTa
                                  : starter.promptEn,
                                starter.domain
                              )
                            }
                            className="text-left p-4 bg-white border border-slate-200 hover:border-blue-600 rounded-xl transition-colors space-y-1.5 cursor-pointer group"
                          >
                            {/* Zero-pill metadata discipline: unboxed text kicker */}
                            <div className="text-xs text-slate-500">
                              {starter.categoryLabel}
                            </div>
                            <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {starter.title}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {language === 'ta'
                                ? starter.promptTa
                                : starter.promptEn}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeSession.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        {/* Message Header Metadata (Unboxed inline text) */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 px-1">
                          <span className="font-medium text-slate-700">
                            {msg.role === 'user' ? 'You' : 'PocketSmart AI'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {msg.timestamp}
                          </span>
                          {msg.role === 'assistant' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="capitalize">
                                {msg.knowledgeLevel} level
                              </span>
                            </>
                          )}
                        </div>

                        {/* Message Surface */}
                        <div
                          className={`max-w-3xl w-full rounded-xl p-4 sm:p-5 ${
                            msg.role === 'user'
                              ? 'bg-slate-900 text-white sm:w-auto sm:max-w-2xl'
                              : 'bg-white border border-slate-200 text-slate-900'
                          }`}
                        >
                          {msg.attachmentPreview && (
                            <div className="mb-3">
                              <img
                                src={msg.attachmentPreview}
                                alt={msg.attachmentName || 'Uploaded attachment'}
                                referrerPolicy="no-referrer"
                                className="max-h-48 rounded-lg border border-slate-700 object-contain"
                              />
                              {msg.attachmentName && (
                                <span className="block text-[11px] text-slate-300 mt-1 font-mono">
                                  Attached: {msg.attachmentName}
                                </span>
                              )}
                            </div>
                          )}

                          {msg.role === 'user' ? (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                          ) : (
                            <div className="space-y-4">
                              <div className="pocketsmart-prose text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>

                              {/* Grounding Sources (Section 5: Verified Current Information) */}
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                                  <div className="text-xs font-semibold text-slate-700">
                                    Verified Web Sources (Google Search)
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    {msg.sources.map((src, idx) => (
                                      <a
                                        key={idx}
                                        href={src.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                                      >
                                        <span className="truncate max-w-xs">
                                          {src.title}
                                        </span>
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Assistant Action Bar */}
                              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleCopyMessage(msg)}
                                    className="hover:text-slate-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    {copiedMessageId === msg.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700">
                                          Copied
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleReadAloud(msg)}
                                    className="hover:text-slate-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    {playingMessageId === msg.id ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                        <span className="text-blue-600">
                                          Stop Audio
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Volume2 className="w-3.5 h-3.5" />
                                        <span>Listen</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() =>
                                      handleSaveMessageToRevisionNotes(msg)
                                    }
                                    className="hover:text-blue-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <BookmarkPlus className="w-3.5 h-3.5" />
                                    <span>Save as Revision Note</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleExtractMessageToTask(msg)
                                    }
                                    className="hover:text-blue-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <ListPlus className="w-3.5 h-3.5" />
                                    <span>Add to To-Do List</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isSending && (
                      <div className="flex flex-col items-start">
                        <div className="text-xs text-slate-500 mb-1.5 px-1">
                          PocketSmart AI · Thinking & structuring response...
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-2.5 text-xs text-slate-600">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>
                            Analyzing intent, checking calculations, and formatting clearly...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {errorBanner && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-700">
                  <span>{errorBanner}</span>
                  <button
                    onClick={() => setErrorBanner(null)}
                    className="text-red-500 hover:text-red-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bottom Sticky Prompt Composer */}
              <div className="sticky bottom-0 pb-4 pt-2 bg-[#F8FAFC]">
                <form
                  onSubmit={handleFormSubmit}
                  className="bg-white border border-slate-300 focus-within:border-blue-600 rounded-xl p-3 shadow-2xs transition-colors space-y-2.5"
                >
                  {/* Attachment Preview */}
                  {attachment && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={attachment.previewUrl}
                          alt={attachment.name}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded object-cover"
                        />
                        <span className="font-mono text-slate-700 truncate">
                          {attachment.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendPromptToAssistant(inputPrompt);
                      }
                    }}
                    placeholder={
                      language === 'ta'
                        ? 'உங்கள் கேள்வி, கணக்கு, குறியீடு (Code) அல்லது திட்டத்தை இங்கே உள்ளிடவும்... (Shift+Enter புதிய வரிக்கு)'
                        : 'Ask a question, paste code to debug, request a step-by-step plan, or compare options... (Enter to send)'
                    }
                    className="w-full resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none leading-relaxed"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    {/* Quick Composer Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Attach an image, diagram, or screenshot of a problem"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Attach Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setUseSearchGrounding((prev) => !prev)
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          useSearchGrounding
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="Verify current or changing facts with Google Search"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>
                          {useSearchGrounding
                            ? 'Web Search: On'
                            : 'Web Search: Off'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setResponseStyle((prev) =>
                            prev === 'simple' ? 'auto' : 'simple'
                          )
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          responseStyle === 'simple'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Simple & Easy Mode
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSending || !inputPrompt.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <span>{language === 'ta' ? 'அனுப்பு' : 'Send'}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
