import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ArrowUpRight,
  Clock,
  Loader2,
  ListChecks,
} from 'lucide-react';
import { KnowledgeLevel, LanguageMode, TaskItem } from '../types';

interface ProductivityWorkspaceProps {
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  language: LanguageMode;
  knowledgeLevel: KnowledgeLevel;
  onAskAssistant: (prompt: string) => void;
}

interface MilestoneItem {
  phase: string;
  outcome: string;
}

export const ProductivityWorkspace: React.FC<ProductivityWorkspaceProps> = ({
  tasks,
  setTasks,
  language,
  knowledgeLevel,
  onAskAssistant,
}) => {
  const [goalInput, setGoalInput] = useState('');
  const [timeframeInput, setTimeframeInput] = useState('5 days · 2 hours/day');
  const [isGenerating, setIsGenerating] = useState(false);
  const [planSummary, setPlanSummary] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Productivity');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskMinutes, setNewTaskMinutes] = useState(30);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/plan-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goalInput.trim(),
          timeframe: timeframeInput.trim(),
          language,
          knowledgeLevel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not generate plan');
      }

      setPlanSummary(data.strategySummary || null);
      setMilestones(Array.isArray(data.milestones) ? data.milestones : []);

      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        const generatedTasks: TaskItem[] = data.tasks.map(
          (
            t: {
              title: string;
              category: string;
              priority: string;
              estimatedMinutes: number;
              actionableTip?: string;
            },
            idx: number
          ) => ({
            id: `gen-${Date.now()}-${idx}`,
            title: t.title,
            category: t.category || 'Planned',
            priority:
              t.priority === 'High' || t.priority === 'Low' ? t.priority : 'Medium',
            estimatedMinutes: Number(t.estimatedMinutes) || 30,
            completed: false,
            actionableTip: t.actionableTip,
          })
        );
        setTasks((prev) => [...generatedTasks, ...prev]);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to convert goal into plan.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item: TaskItem = {
      id: `manual-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: newTaskPriority,
      estimatedMinutes: Number(newTaskMinutes) || 25,
      completed: false,
    };
    setTasks((prev) => [item, ...prev]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'pending') return !t.completed;
    if (filterStatus === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalMinutesPending = tasks
    .filter((t) => !t.completed)
    .reduce((acc, item) => acc + item.estimatedMinutes, 0);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs text-slate-500 mb-1">
            Productivity & Execution · Idea-to-Plan Converter
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {language === 'ta'
              ? 'செயல்திறன் மற்றும் பணித் திட்டமிடல் (Productivity Planner)'
              : 'Structured Task & Schedule Planner'}
          </h1>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-600 font-mono tabular-nums">
          <div>
            <span className="text-slate-400 block">Completed</span>
            <span className="text-sm font-semibold text-slate-900">
              {completedCount} / {tasks.length} tasks
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block">Remaining Focus</span>
            <span className="text-sm font-semibold text-slate-900">
              {totalMinutesPending} mins ({(totalMinutesPending / 60).toFixed(1)} hrs)
            </span>
          </div>
        </div>
      </div>

      {/* Idea to Plan AI Converter */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Convert Any Goal or Idea into an Actionable Plan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Describe what you want to accomplish; PocketSmart AI breaks it down into prioritized steps and time estimates.
            </p>
          </div>
        </div>

        <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Goal, Project, or Routine Idea
            </label>
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'எ.கா: 7 நாட்களில் React நேர்காணலுக்குத் தயாராவது எப்படி?'
                  : 'e.g., Prepare for a full-stack system design interview in 1 week'
              }
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Timeframe / Daily Capacity
            </label>
            <input
              type="text"
              value={timeframeInput}
              onChange={(e) => setTimeframeInput(e.target.value)}
              placeholder="e.g., 5 days · 90 mins/day"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isGenerating || !goalInput.trim()}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Build Plan</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            Error: {errorMsg}
          </div>
        )}

        {planSummary && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">Execution Strategy: </span>
              {planSummary}
            </p>
            {milestones.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {milestones.map((m, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg"
                  >
                    <div className="text-xs font-mono font-semibold text-blue-700">
                      0{i + 1}. {m.phase}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{m.outcome}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Task Board & Manual Entry */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
            {(['all', 'pending', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap cursor-pointer ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status} (
                {status === 'all'
                  ? tasks.length
                  : status === 'pending'
                  ? tasks.length - completedCount
                  : completedCount}
                )
              </button>
            ))}
          </div>

          {/* Quick Add Task Form */}
          <form onSubmit={handleAddManualTask} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a quick task..."
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 w-52 sm:w-64"
            />
            <select
              value={newTaskPriority}
              onChange={(e) =>
                setNewTaskPriority(e.target.value as 'High' | 'Medium' | 'Low')
              }
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={newTaskMinutes}
              onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
              className="w-20 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              title="Estimated minutes"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </form>
        </div>

        {/* High-Density Data List */}
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700">
                No tasks in this view
              </p>
              <p className="text-xs text-slate-500">
                Add a task manually above or use the Goal-to-Plan builder to generate a structured checklist.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                    aria-label={
                      task.completed ? 'Mark as incomplete' : 'Mark as complete'
                    }
                  >
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="min-w-0 space-y-1">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        task.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.actionableTip && (
                      <p className="text-xs text-slate-500">
                        Tip: {task.actionableTip}
                      </p>
                    )}
                    {/* Zero-pill metadata discipline: unboxed inline text with · separators */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                      <span>{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          task.priority === 'High'
                            ? 'text-amber-700 font-medium'
                            : task.priority === 'Low'
                            ? 'text-slate-500'
                            : 'text-blue-700'
                        }
                      >
                        {task.priority} Priority
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimatedMinutes}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      onAskAssistant(
                        `Help me complete this task step-by-step: "${task.title}". Give me a clear, practical template or checklist to finish it in ${task.estimatedMinutes} minutes.`
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    title="Open in Assistant for step-by-step help"
                  >
                    <span>Draft / Solve</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
