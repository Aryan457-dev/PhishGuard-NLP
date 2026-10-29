
import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  ScanSearch,
  Mail,
  Link2,
  Activity,
  Clock3,
  LayoutDashboard,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  LockKeyhole,
  FileText,
  ArrowUpRight,
  LoaderCircle,
} from 'lucide-react'

const API_URL = 'http://127.0.0.1:5000/api/analyze'
const METRICS_URL = 'http://127.0.0.1:5000/api/metrics'
const DATASET_METRICS_URL =
  'http://127.0.0.1:5000/api/metrics/datasets'

function App() {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('phishguard_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [activePage, setActivePage] = useState('Dashboard')

  useEffect(() => {
    try {
      localStorage.setItem(
        'phishguard_history',
        JSON.stringify(history)
      )
    } catch (error) {
      console.error('Could not save analysis history:', error)
    }
  }, [history])

  const analyzeMessage = async () => {
    if (!message.trim() || loading) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to analyze the message.'
        )
      }

      const analysis = {
        prediction: data.prediction,
        label: data.label,
        spamProbability: data.spam_probability,
        modelType: data.model_type,
        scope: data.scope,
        message: message.trim(),
        analyzedAt: new Date().toLocaleString(),
      }

      setResult(analysis)
      setHistory(previous => [analysis, ...previous])
    } catch (error) {
      setResult({
        error:
          error.message || 'Could not connect to the Flask API.',
      })
    } finally {
      setLoading(false)
    }
  }

  const clearAnalysis = () => {
    setMessage('')
    setResult(null)
  }

  const openPage = page => {
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const spamCount = history.filter(
    item => item.prediction === 'spam'
  ).length

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-200 md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0b1120] p-6 md:flex md:flex-col">
        <div className="mb-12 flex items-center gap-3">
          <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300">
            <ShieldCheck size={27} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              PhishGuard
            </h1>
            <p className="text-xs text-slate-500">
              THREAT INTELLIGENCE
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>

        <nav className="space-y-2">
          <NavItem
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
            active={activePage === 'Dashboard'}
            onClick={() => openPage('Dashboard')}
          />

          <NavItem
            icon={<ScanSearch size={19} />}
            label="Message scanner"
            active={activePage === 'Message scanner'}
            onClick={() => {
              setActivePage('Message scanner')
              document.getElementById('scanner')?.scrollIntoView({
                behavior: 'smooth',
              })
            }}
          />

          <NavItem
            icon={<Clock3 size={19} />}
            label="Analysis history"
            active={activePage === 'Analysis history'}
            onClick={() => openPage('Analysis history')}
          />

          <NavItem
            icon={<Activity size={19} />}
            label="Model performance"
            active={activePage === 'Model performance'}
            onClick={() => openPage('Model performance')}
          />
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <LockKeyhole className="mb-3 text-cyan-300" size={22} />
          <p className="font-semibold text-white">Security first</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Inspect suspicious messages before responding to them.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300 md:hidden">
              <ShieldCheck size={23} />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Workspace / {activePage}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
                Security Dashboard
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            NLP API integration
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-5 md:p-10">
          {activePage === 'Model performance' ? (
            <ModelPerformance />
          ) : activePage === 'Analysis history' ? (
            <HistoryPage history={history} />
          ) : (
            <>
              <section>
                <p className="text-sm font-medium text-cyan-300">
                  AI-POWERED MESSAGE ANALYSIS
                </p>

                <h3 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Stay one step ahead of scams.
                </h3>

                <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                  Analyze emails and text messages using a trained NLP
                  and machine-learning classifier.
                </p>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  icon={<ScanSearch />}
                  title="Messages analyzed"
                  value={history.length}
                  note="Saved analyses"
                />

                <StatCard
                  icon={<ShieldAlert />}
                  title="Spam detected"
                  value={spamCount}
                  note="Predicted as suspicious"
                />

                <StatCard
                  icon={<Activity />}
                  title="Model type"
                  value="TF-IDF"
                  note="Logistic Regression classifier"
                />
              </section>

              <section
                id="scanner"
                className="grid scroll-mt-6 items-start gap-6 xl:grid-cols-[1.5fr_1fr]"
              >
                <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-5 md:p-7">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                      <Mail size={22} />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Message scanner
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Paste a message to classify it with the trained model.
                      </p>
                    </div>
                  </div>

                  <label
                    htmlFor="message"
                    className="mb-2 mt-7 block text-sm font-medium text-slate-300"
                  >
                    Email or message content
                  </label>

                  <textarea
                    id="message"
                    value={message}
                    maxLength={10000}
                    onChange={event => {
                      setMessage(event.target.value)
                      setResult(null)
                    }}
                    placeholder="Paste a suspicious email, SMS, or message here..."
                    className="min-h-52 w-full resize-y rounded-xl border border-white/10 bg-[#080d18] p-4 text-sm leading-7 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
                  />

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{message.length}/10000 characters</span>
                    <span>Do not enter passwords or OTPs.</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={analyzeMessage}
                      disabled={!message.trim() || loading}
                      className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search size={18} />
                          Analyze message
                          <ChevronRight size={17} />
                        </>
                      )}
                    </button>

                    <button
                      onClick={clearAnalysis}
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/5"
                    >
                      Clear
                    </button>
                  </div>

                  {result && (
                    <div
                      aria-live="polite"
                      className={`mt-6 rounded-xl border p-5 ${
                        result.error
                          ? 'border-red-400/20 bg-red-400/5'
                          : result.prediction === 'spam'
                            ? 'border-amber-400/20 bg-amber-400/5'
                            : 'border-emerald-400/20 bg-emerald-400/5'
                      }`}
                    >
                      {result.error ? (
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 shrink-0 text-red-300" />

                          <div>
                            <p className="font-semibold text-white">
                              Analysis failed
                            </p>
                            <p className="mt-1 text-sm leading-6 text-red-200">
                              {result.error}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            {result.prediction === 'spam' ? (
                              <AlertTriangle className="shrink-0 text-amber-300" />
                            ) : (
                              <CheckCircle2 className="shrink-0 text-emerald-300" />
                            )}

                            <div>
                              <p className="font-semibold text-white">
                                {result.label}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                Model prediction: {result.prediction}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5">
                            <div className="flex justify-between gap-3 text-sm">
                              <span className="text-slate-400">
                                Estimated suspicious probability
                              </span>
                              <span className="font-semibold text-white">
                                {(
                                  Number(result.spamProbability) * 100
                                ).toFixed(1)}%
                              </span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  result.prediction === 'spam'
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-400'
                                }`}
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      Number(result.spamProbability) * 100
                                    )
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-4 rounded-lg bg-black/10 p-3">
                            <p className="text-xs leading-5 text-slate-400">
                              Model: {result.modelType}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-400">
                              Dataset scope: phishing email and SMS spam
                              datasets. Predictions are not a guarantee of
                              malicious intent.
                            </p>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              The probability is a model estimate, not proof
                              that a message is malicious.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">
                        Analysis workflow
                      </h3>
                      <FileText size={19} className="text-cyan-300" />
                    </div>

                    <div className="mt-6 space-y-5">
                      <WorkflowStep
                        number="01"
                        title="Input message"
                        description="Paste email or SMS content."
                      />

                      <WorkflowStep
                        number="02"
                        title="NLP processing"
                        description="TF-IDF transforms text into numerical features."
                      />

                      <WorkflowStep
                        number="03"
                        title="ML classification"
                        description="Logistic Regression predicts legitimate or suspicious."
                      />

                      <WorkflowStep
                        number="04"
                        title="View results"
                        description="Review the prediction and estimated probability."
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] to-transparent p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                        <Link2 size={21} />
                      </div>

                      <h3 className="font-semibold text-white">
                        Safety reminder
                      </h3>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      Never share OTPs or passwords, and verify unexpected
                      requests independently before opening links.
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm text-cyan-300">
                      Safe habits matter <ArrowUpRight size={16} />
                    </div>
                  </div>
                </div>
              </section>

              <HistoryPage history={history} compact />
            </>
          )}

          <footer className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
            PhishGuard · NLP & Machine Learning Project · TF-IDF + Logistic Regression
          </footer>
        </div>
      </main>
    </div>
  )
}

function ModelPerformance() {
  const [metrics, setMetrics] = useState(null)
  const [datasetMetrics, setDatasetMetrics] = useState(null)
  const [error, setError] = useState('')
  const [datasetError, setDatasetError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchJson(url, fallbackMessage) {
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || fallbackMessage)
      }

      return data
    }

    async function loadMetrics() {
      const [combinedResult, datasetResult] = await Promise.allSettled([
        fetchJson(METRICS_URL, 'Could not load combined metrics.'),
        fetchJson(
          DATASET_METRICS_URL,
          'Could not load separate email and SMS metrics.'
        ),
      ])

      if (cancelled) return

      if (combinedResult.status === 'fulfilled') {
        setMetrics(combinedResult.value)
      } else {
        setError(
          combinedResult.reason?.message ||
            'Could not connect to the combined metrics endpoint.'
        )
      }

      if (datasetResult.status === 'fulfilled') {
        setDatasetMetrics(datasetResult.value)
      } else {
        setDatasetError(
          datasetResult.reason?.message ||
            'Could not connect to the dataset metrics endpoint.'
        )
      }

      setLoading(false)
    }

    loadMetrics()

    return () => {
      cancelled = true
    }
  }, [])

  const formatPercent = value => {
    const number = Number(value)
    return Number.isFinite(number)
      ? `${(number * 100).toFixed(2)}%`
      : '—'
  }

  const combinedCards = metrics
    ? [
        { label: 'Accuracy', value: metrics.accuracy },
        { label: 'Precision', value: metrics.precision_suspicious },
        { label: 'Recall', value: metrics.recall_suspicious },
        { label: 'F1-score', value: metrics.f1_suspicious },
      ]
    : []

  return (
    <section className="space-y-7">
      <div>
        <p className="text-sm font-medium text-cyan-300">
          MODEL EVALUATION
        </p>

        <h3 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Model performance
        </h3>

        <p className="mt-3 max-w-3xl leading-7 text-slate-400">
          Review the performance of the combined live classifier and the
          independent email and SMS dataset evaluations.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6 text-slate-400">
          <LoaderCircle className="mr-2 inline animate-spin" size={18} />
          Loading evaluation metrics...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm leading-6 text-red-200">
          <p className="font-semibold text-white">
            Could not load combined model metrics
          </p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-slate-400">
            Check that Flask is running and /api/metrics is available.
          </p>
        </div>
      )}

      {metrics && (
        <>
          <div>
            <h4 className="text-xl font-semibold text-white">
              Combined live model
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              These metrics come from the combined email and SMS model used
              by the message scanner.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {combinedCards.map(item => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-[#0d1525] p-5"
              >
                <p className="text-sm text-slate-400">{item.label}</p>

                <p className="mt-3 text-3xl font-bold text-white">
                  {formatPercent(item.value)}
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, Number(item.value) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6">
              <h4 className="text-lg font-semibold text-white">
                Combined confusion matrix
              </h4>
              <p className="mt-1 text-sm text-slate-400">
                Rows are actual classes; columns are predicted classes.
              </p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full border-separate border-spacing-2 text-center text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-slate-500">
                        Actual / Predicted
                      </th>
                      <th className="p-2 text-slate-400">Legitimate</th>
                      <th className="p-2 text-slate-400">Suspicious</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      {
                        label: 'Legitimate',
                        values: metrics.confusion_matrix?.[0] || [],
                      },
                      {
                        label: 'Suspicious',
                        values: metrics.confusion_matrix?.[1] || [],
                      },
                    ].map(row => (
                      <tr key={row.label}>
                        <th className="rounded-lg bg-white/5 p-3 text-left text-slate-300">
                          {row.label}
                        </th>
                        {row.values.map((value, index) => (
                          <td
                            key={index}
                            className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.07] p-4 text-lg font-semibold text-white"
                          >
                            {Number(value).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6">
              <h4 className="text-lg font-semibold text-white">
                Combined evaluation summary
              </h4>

              <div className="mt-5 space-y-4 text-sm">
                <SummaryRow
                  label="Total messages"
                  value={Number(metrics.total_messages).toLocaleString()}
                />
                <SummaryRow
                  label="Email messages"
                  value={Number(metrics.email_messages).toLocaleString()}
                />
                <SummaryRow
                  label="SMS messages"
                  value={Number(metrics.sms_messages).toLocaleString()}
                />
                <SummaryRow
                  label="Training samples"
                  value={Number(metrics.training_messages).toLocaleString()}
                />
                <SummaryRow
                  label="Test samples"
                  value={Number(metrics.test_messages).toLocaleString()}
                />
                <SummaryRow
                  label="Algorithm"
                  value={metrics.model || 'TF-IDF + Logistic Regression'}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {datasetError && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5 text-sm leading-6 text-amber-100">
          <p className="font-semibold text-white">
            Separate dataset metrics unavailable
          </p>
          <p className="mt-1">{datasetError}</p>
          <p className="mt-2 text-slate-400">
            Check that /api/metrics/datasets returns both email and SMS
            evaluation results.
          </p>
        </div>
      )}

      {datasetMetrics && (
        <>
          <div>
            <h4 className="text-xl font-semibold text-white">
              Independent dataset evaluations
            </h4>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
              The email and SMS datasets were evaluated separately using
              TF-IDF and Logistic Regression. These are independent evaluation
              models, not the combined model used by the live scanner.
            </p>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <DatasetPanel
              title="Phishing email dataset"
              data={datasetMetrics.email}
              classLabels={['Legitimate', 'Phishing']}
              description="Classification of legitimate emails and phishing emails."
            />

            <DatasetPanel
              title="SMS spam dataset"
              data={datasetMetrics.sms}
              classLabels={['Ham (legitimate)', 'Spam']}
              description="Classification of legitimate SMS messages and spam."
            />
          </div>
        </>
      )}

      {!loading && !metrics && !datasetMetrics && (
        <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6 text-slate-400">
          No evaluation results could be loaded. Check the Flask API and
          refresh this page.
        </div>
      )}

      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 shrink-0 text-amber-300"
            size={20}
          />

          <div>
            <h4 className="font-semibold text-white">
              How to interpret these results
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Accuracy measures the proportion of correctly classified test
              messages. Precision measures how often a positive prediction
              was correct. Recall measures how many actual positive messages
              were detected. F1-score balances precision and recall. In the
              SMS evaluation, spam precision is 100%, but spam recall is
              76.51%, meaning some spam messages were missed. Model predictions
              are estimates and cannot guarantee detection of every scam.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function DatasetPanel({ title, data, classLabels, description }) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6 text-sm text-slate-400">
        Evaluation data for {title} is unavailable.
      </div>
    )
  }

  const rows = [
    { label: 'Accuracy', value: data.accuracy },
    { label: 'Precision', value: data.precision },
    { label: 'Recall', value: data.recall },
    { label: 'F1-score', value: data.f1_score },
  ]

  const matrix = data.confusion_matrix || []

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-white">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>

        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs text-cyan-300">
          Separate evaluation
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {rows.map(item => (
          <div
            key={item.label}
            className="rounded-xl border border-white/5 bg-black/10 p-4"
          >
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {formatPercent(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h5 className="font-medium text-white">Confusion matrix</h5>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Rows are actual classes; columns are predicted classes.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-separate border-spacing-2 text-center text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="p-2 text-slate-500">
                  Actual / Predicted
                </th>
                {classLabels.map(label => (
                  <th key={label} className="p-2 text-slate-400">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {classLabels.map((label, rowIndex) => (
                <tr key={label}>
                  <th className="rounded-lg bg-white/5 p-3 text-left text-slate-300">
                    {label}
                  </th>

                  {(matrix[rowIndex] || []).map((value, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.07] p-3 text-base font-semibold text-white sm:p-4 sm:text-lg"
                    >
                      {Number(value).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-white/5 pt-4 text-sm">
        <SummaryRow
          label="Total dataset messages"
          value={Number(data.total_messages).toLocaleString()}
        />
        <SummaryRow
          label="Training samples"
          value={Number(data.training_messages).toLocaleString()}
        />
        <SummaryRow
          label="Test samples"
          value={Number(data.test_messages).toLocaleString()}
        />
        <SummaryRow
          label="Algorithm"
          value={data.model || 'TF-IDF + Logistic Regression'}
        />
      </div>
    </div>
  )
}

function formatPercent(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? `${(number * 100).toFixed(2)}%`
    : '—'
}

function HistoryPage({ history, compact = false }) {
  const items = compact ? history.slice(0, 5) : history

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1525] p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {compact ? 'Recent analyses' : 'Analysis history'}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Saved results from this browser.
          </p>
        </div>

        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">
          {history.length} total
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
          Your analysis results will appear here after your first scan.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.analyzedAt}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm text-slate-200">
                  {item.message}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {item.analyzedAt}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  item.error
                    ? 'bg-red-400/10 text-red-300'
                    : item.prediction === 'spam'
                      ? 'bg-amber-400/10 text-amber-300'
                      : 'bg-emerald-400/10 text-emerald-300'
                }`}
              >
                {item.error ? 'error' : item.prediction}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
        active
          ? 'bg-cyan-400/10 font-medium text-cyan-300'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function StatCard({ icon, title, value, note }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>
        <span className="text-cyan-300">{icon}</span>
      </div>

      <p className="mt-4 break-words text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  )
}

function WorkflowStep({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-xs font-bold text-cyan-300">
        {number}
      </span>

      <div>
        <p className="font-medium text-slate-200">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  )
}

export default App
