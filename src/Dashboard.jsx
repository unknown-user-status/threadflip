import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const FORMATS = [
  { id: 'linkedin', label: 'LinkedIn Post', icon: '💼' },
  { id: 'blog', label: 'Blog Draft', icon: '📝' },
  { id: 'newsletter', label: 'Newsletter', icon: '📧' },
  { id: 'summary', label: 'Thread Summary', icon: '🧵' },
]

export default function Dashboard() {
  const [url, setUrl] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('linkedin')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState(0)
  const [email, setEmail] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [error, setError] = useState('')
  const [detectedPlatform, setDetectedPlatform] = useState('')

  // ── Provider state ──
  const [providers, setProviders] = useState([])
  const [activeProvider, setActiveProvider] = useState('openai')
  const [activeModel, setActiveModel] = useState('gpt-4o-mini')
  const [showProviderPanel, setShowProviderPanel] = useState(false)
  const [providerKey, setProviderKey] = useState('')
  const [providerBaseUrl, setProviderBaseUrl] = useState('')
  const [providerStatus, setProviderStatus] = useState('')

  const FREE_LIMIT = 5

  // Load from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('tf_email')
    const hist = sessionStorage.getItem('tf_history')
    if (saved) { setEmail(saved); setSignedIn(true) }
    if (hist) setHistory(JSON.parse(hist))
  }, [])

  // Fetch available providers on mount
  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(data => {
        if (data.providers) {
          setProviders(data.providers)
          const active = data.providers.find(p => p.active)
          if (active) {
            setActiveProvider(active.id)
            setActiveModel(active.currentModel || active.defaultModel)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Detect platform from URL
  useEffect(() => {
    if (!url) { setDetectedPlatform(''); return }
    if (/x\.com|twitter\.com/i.test(url)) setDetectedPlatform('\u{1F426} Twitter / X')
    else if (/linkedin\.com/i.test(url)) setDetectedPlatform('\u{1F4BC} LinkedIn')
    else if (/reddit\.com/i.test(url)) setDetectedPlatform('\u{1F916} Reddit')
    else if (/medium\.com|substack\.com/i.test(url)) setDetectedPlatform('\u{1F4DD} Blog')
    else if (/bsky\.app|bluesky\.social/i.test(url)) setDetectedPlatform('\u{1F98B} Bluesky')
    else if (/threads\.net/i.test(url)) setDetectedPlatform('\u{1F441}\uFE0F Threads')
    else if (/mastodon\.social|mastodon\./i.test(url)) setDetectedPlatform('\u{1F535} Mastodon')
    else if (/instagram\.com/i.test(url)) setDetectedPlatform('\u{1F4F8} Instagram')
    else if (/tiktok\.com/i.test(url)) setDetectedPlatform('\u{1F3B5} TikTok')
    else if (/facebook\.com|fb\.com/i.test(url)) setDetectedPlatform('\u{1F44D} Facebook')
    else setDetectedPlatform('\u{1F517} Unknown')
  }, [url])

  // Sign in
  const handleSignIn = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setSignedIn(true)
      setUsage(data.conversions)
      sessionStorage.setItem('tf_email', email)
      setError('')
    } catch {
      setError('Failed to sign in. Server may be offline.')
    }
  }

  // Convert
  const handleConvert = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), format: selectedFormat, email: signedIn ? email : undefined }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setResult(data.output)
      const newEntry = {
        url: url.trim(),
        format: selectedFormat,
        platform: data.platform,
        date: new Date().toLocaleDateString(),
      }
      const updated = [newEntry, ...history].slice(0, 20)
      setHistory(updated)
      sessionStorage.setItem('tf_history', JSON.stringify(updated))
    } catch {
      setError('Conversion failed. Make sure the server is running.')
    }
    setLoading(false)
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Switch provider
  const handleSwitchProvider = async (providerId) => {
    const p = providers.find(x => x.id === providerId)
    if (!p) return

    const key = providerKey || undefined
    const baseUrl = (providerId === 'custom' && providerBaseUrl) ? providerBaseUrl : undefined

    setProviderStatus('Switching...')
    try {
      const res = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, model: p.defaultModel, apiKey: key, baseUrl }),
      })
      const data = await res.json()
      if (data.ok) {
        setActiveProvider(providerId)
        setActiveModel(data.model)
        setProviderStatus('Active: ' + data.model)
        // Refresh model list
        const r2 = await fetch('/api/models')
        const d2 = await r2.json()
        if (d2.providers) setProviders(d2.providers)
      } else {
        setProviderStatus('Error: ' + (data.error || 'unknown'))
      }
    } catch (e) {
      setProviderStatus('Failed: ' + e.message)
    }
  }

  // ── Auth screen ──
  if (!signedIn) {
    return (
      <div className="dashboard">
        <main className="dashboard-main" style={{ maxWidth: 400, margin: '0 auto', paddingTop: 80 }}>
          <Link to="/" className="logo" style={{ fontSize: 24, display: 'block', textAlign: 'center', marginBottom: 32 }}>ThreadFlip</Link>
          <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Sign in to continue</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Enter your email to get started. No password needed.</p>
          <div className="convert-card">
            <label className="convert-label">Email address</label>
            <input
              className="convert-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
            />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>{error}</p>}
          <button className="btn btn-primary btn-lg convert-btn" onClick={handleSignIn}>Continue</button>
        </main>
      </div>
    )
  }

  // ── Main dashboard ──
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Link to="/" className="logo" style={{ padding: '20px 24px', display: 'block' }}>ThreadFlip</Link>
        <nav className="sidebar-nav">
          <a href="#" className="sidebar-link active" onClick={e => { e.preventDefault(); setShowProviderPanel(false) }}>Convert</a>
          <a href="#" className="sidebar-link" onClick={e => { e.preventDefault(); setShowProviderPanel(!showProviderPanel) }}>
            {showProviderPanel ? 'AI Settings' : 'AI Settings'}
          </a>
        </nav>
        <div className="sidebar-usage">
          <div className="usage-label">{email}</div>
          <div className="usage-bar">
            <div className="usage-fill" style={{ width: `${Math.min(usage / FREE_LIMIT * 100, 100)}%` }} />
          </div>
          <div className="usage-text">{usage} / {FREE_LIMIT} conversions used</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Model: {activeModel}
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dash-header">
          <h1>{showProviderPanel ? 'AI Provider Settings' : 'Convert'}</h1>
          <Link to="/" className="dash-back">&larr; Back to site</Link>
        </header>

        {showProviderPanel ? (
          /* ── Provider Settings Panel ── */
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
              Switch between AI providers at runtime. Changes take effect immediately for the next conversion.
              For permanent config, set env vars in Vercel dashboard.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {providers.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '16px 20px',
                    border: `1px solid ${activeProvider === p.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: activeProvider === p.id ? 'var(--accent-light)' : 'var(--surface)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSwitchProvider(p.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{p.label}</strong>
                    {activeProvider === p.id && <span style={{ color: 'var(--accent)', fontSize: 12 }}>ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Model: {activeProvider === p.id ? activeModel : p.defaultModel}
                  </div>
                  {p.models.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {p.models.length} model{p.models.length !== 1 ? 's' : ''} available
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom provider fields */}
            <div className="convert-card">
              <label className="convert-label">API Key (override, optional)</label>
              <input
                className="convert-input"
                type="password"
                placeholder="Leave empty to use server env var"
                value={providerKey}
                onChange={e => setProviderKey(e.target.value)}
              />
            </div>
            <div className="convert-card">
              <label className="convert-label">Custom Base URL (for Custom provider)</label>
              <input
                className="convert-input"
                type="text"
                placeholder="https://your-api.com/v1"
                value={providerBaseUrl}
                onChange={e => setProviderBaseUrl(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={() => handleSwitchProvider(activeProvider)}>
                Apply Settings
              </button>
              {providerStatus && (
                <span style={{ fontSize: 13, color: providerStatus.startsWith('Active') ? 'var(--success, #22c55e)' : '#ef4444' }}>
                  {providerStatus}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* ── Convert Panel ── */
          <>
            {/* URL input */}
            <div className="convert-card">
              <label className="convert-label">
                Paste URL
                {detectedPlatform && <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--text-muted)' }}>{detectedPlatform}</span>}
              </label>
              <input
                className="convert-input"
                placeholder="https://x.com/username/status/123456789"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Supports: X/Twitter, LinkedIn, Facebook, Bluesky, Threads, Mastodon, Instagram, TikTok, Reddit, Medium, Substack
              </p>
            </div>

            {/* Format picker */}
            <div className="format-picker">
              <label className="convert-label">Convert to</label>
              <div className="format-grid">
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    className={`format-btn ${selectedFormat === f.id ? 'format-btn-active' : ''}`}
                    onClick={() => setSelectedFormat(f.id)}
                  >
                    <span>{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Convert button */}
            {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>{error}</p>}
            <button
              className="btn btn-primary btn-lg convert-btn"
              onClick={handleConvert}
              disabled={loading || !url.trim()}
            >
              {loading ? 'Converting...' : 'Convert \u2192'}
            </button>

            {/* Result */}
            {result && (
              <div className="result-card">
                <div className="result-header">
                  <h3>Result ({FORMATS.find(f => f.id === selectedFormat)?.label})</h3>
                  <button className="btn btn-sm" onClick={copyResult}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="result-text">{result}</pre>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="history-section">
                <h3>Recent conversions</h3>
                {history.map((h, i) => (
                  <div key={i} className="history-item">
                    <div className="history-meta">
                      <span className="history-format">{FORMATS.find(f => f.id === h.format)?.icon} {FORMATS.find(f => f.id === h.format)?.label}</span>
                      <span className="history-date">{h.date}</span>
                    </div>
                    <p className="history-url">{h.url}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
