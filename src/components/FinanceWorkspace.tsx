import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Calculator,
  Loader2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  ExpenseEntry,
  FinanceAnalysisResult,
  LanguageMode,
} from '../types';

interface FinanceWorkspaceProps {
  expenses: ExpenseEntry[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseEntry[]>>;
  monthlyIncome: number;
  setMonthlyIncome: React.Dispatch<React.SetStateAction<number>>;
  language: LanguageMode;
  onAskAssistant: (prompt: string) => void;
}

export const FinanceWorkspace: React.FC<FinanceWorkspaceProps> = ({
  expenses,
  setExpenses,
  monthlyIncome,
  setMonthlyIncome,
  language,
  onAskAssistant,
}) => {
  const [savingsGoal, setSavingsGoal] = useState<number>(20000);
  const [scenarioQuestion, setScenarioQuestion] = useState(
    'Compare keeping my current spending vs. reducing Lifestyle expenses by 25% to accelerate an Emergency Fund.'
  );
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] =
    useState<ExpenseEntry['category']>('Essentials');
  const [newAmount, setNewAmount] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FinanceAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalOutflow = expenses.reduce((sum, item) => sum + item.amount, 0);
  const dedicatedSavings = expenses
    .filter((e) => e.category === 'Savings & Debt')
    .reduce((sum, item) => sum + item.amount, 0);
  const unallocatedSurplus = monthlyIncome - totalOutflow;
  const effectiveMonthlySavings = dedicatedSavings + Math.max(0, unallocatedSurplus);
  const savingsRate =
    monthlyIncome > 0
      ? ((effectiveMonthlySavings / monthlyIncome) * 100).toFixed(1)
      : '0.0';

  const categoryTotals = (
    ['Essentials', 'Lifestyle', 'Learning & Tech', 'Savings & Debt'] as const
  ).map((cat) => {
    const amount = expenses
      .filter((e) => e.category === cat)
      .reduce((sum, item) => sum + item.amount, 0);
    const pct =
      monthlyIncome > 0 ? ((amount / monthlyIncome) * 100).toFixed(1) : '0.0';
    return { category: cat, amount, pct };
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(newAmount);
    if (!newName.trim() || isNaN(numericAmount) || numericAmount <= 0) return;
    setExpenses((prev) => [
      ...prev,
      {
        id: `exp-${Date.now()}`,
        name: newName.trim(),
        category: newCategory,
        amount: numericAmount,
      },
    ]);
    setNewName('');
    setNewAmount('');
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAnalyzeBudget = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/finance-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome,
          expenses,
          savingsGoal,
          scenarioQuestion,
          language,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze budget');
      }
      setAnalysis(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error running financial scenario.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Header & Non-Investment-Advice Notice */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs text-slate-500 mb-1">
            Personal Finance · Budget & Scenario Calculator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {language === 'ta'
              ? 'வரவு செலவு மற்றும் சேமிப்பு பகுப்பாய்வு (Budget & Scenario Lab)'
              : 'Personal Budget & Scenario Analyzer'}
          </h1>
        </div>
        <p className="text-xs text-slate-500 max-w-sm">
          Educational budgeting and mathematical scenario modeling only. Not guaranteed financial or investment advice.
        </p>
      </div>

      {/* Top Summary Ledger Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <label className="block text-xs text-slate-500 mb-1">
            Monthly Net Income
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm font-mono text-slate-400">₹</span>
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
              className="w-full text-lg font-semibold font-mono tabular-nums text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="block text-xs text-slate-500 mb-1">
            Total Allocated Outflow
          </span>
          <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
            ₹{totalOutflow.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {expenses.length} line items
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="block text-xs text-slate-500 mb-1">
            Effective Monthly Savings
          </span>
          <div className="text-lg font-semibold font-mono tabular-nums text-emerald-700">
            ₹{effectiveMonthlySavings.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {savingsRate}% savings rate
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="block text-xs text-slate-500 mb-1">
            Unallocated Balance
          </span>
          <div
            className={`text-lg font-semibold font-mono tabular-nums ${
              unallocatedSurplus >= 0 ? 'text-slate-900' : 'text-red-600'
            }`}
          >
            {unallocatedSurplus >= 0 ? '+' : '-'}₹
            {Math.abs(unallocatedSurplus).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500">
            {unallocatedSurplus >= 0
              ? 'Status: Positive Surplus'
              : 'Status: Deficit Warning'}
          </span>
        </div>
      </div>

      {/* Category Breakdown & Expense Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Expense Ledger Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Monthly Expense & Allocation Ledger
              </h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                Tabular Precision
              </span>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
                  <th className="py-2.5 px-4 font-medium">Expense Item</th>
                  <th className="py-2.5 px-3 font-medium">Category</th>
                  <th className="py-2.5 px-4 font-medium text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 font-medium text-right w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {expenses.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">
                      {item.category}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                      {item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleRemoveExpense(item.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Expense Row Form */}
            <form
              onSubmit={handleAddExpense}
              className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2"
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Item name (e.g., Internet)"
                className="sm:col-span-5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as ExpenseEntry['category'])
                }
                className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
              >
                <option value="Essentials">Essentials</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Learning & Tech">Learning & Tech</option>
                <option value="Savings & Debt">Savings & Debt</option>
              </select>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Amount"
                className="sm:col-span-2 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="sm:col-span-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center justify-center cursor-pointer"
                title="Add Expense"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right 5 Cols: Category Proportions & Scenario Comparator Trigger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Allocation by Category (% of Income)
            </h3>
            <div className="space-y-2.5">
              {categoryTotals.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{c.category}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      ₹{c.amount.toLocaleString('en-IN')} · {c.pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${Math.min(100, Number(c.pct))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Compare Financial Scenarios with PocketSmart AI
            </h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Target Monthly Savings Goal (₹)
              </label>
              <input
                type="number"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Scenario Question or Trade-off to Model
              </label>
              <textarea
                rows={3}
                value={scenarioQuestion}
                onChange={(e) => setScenarioQuestion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyzeBudget}
                disabled={isAnalyzing}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating Scenarios...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Analyze & Compare Scenarios</span>
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  onAskAssistant(
                    `Based on my monthly income of ₹${monthlyIncome} and total expenses of ₹${totalOutflow}, help me evaluate: ${scenarioQuestion}`
                  )
                }
                className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                title="Discuss in Assistant Chat"
              >
                <span>Discuss</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* AI Scenario Analysis Output */}
      {analysis && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Budget Health & Scenario Comparison Report
            </h2>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">
              {analysis.healthSummary}
            </p>
          </div>

          {/* Scenario Comparison Table */}
          {analysis.scenarioComparison && analysis.scenarioComparison.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">Scenario</th>
                    <th className="py-2.5 px-3 font-semibold font-mono">
                      Monthly Savings
                    </th>
                    <th className="py-2.5 px-3 font-semibold font-mono">
                      12-Month Projection
                    </th>
                    <th className="py-2.5 px-3 font-semibold">Key Trade-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {analysis.scenarioComparison.map((sc, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {sc.scenarioName}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-emerald-700 font-medium">
                        {sc.monthlySavings}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-900">
                        {sc.annualProjection}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{sc.tradeoffNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 mb-2">
                Key Mathematical Observations
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                {analysis.keyObservations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900 mb-2">
                Practical Next Steps
              </h3>
              <ol className="space-y-1.5 text-xs text-slate-700 list-decimal pl-4">
                {analysis.practicalSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>{analysis.disclaimer}</span>
          </div>
        </section>
      )}
    </div>
  );
};
