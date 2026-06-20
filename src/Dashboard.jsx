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

  // Load from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('tf_email')
    const hist = sessionStorage.getItem('tf_history')
    if (saved) { setEmail(saved); setSignedIn(true) }
    if (hist) setHistory(JSON.parse(hist))
  }, [])

  // Detect platform from URL
  useEffect(() => {
    if (!url) { setDetectedPlatform(''); return }
    if (/x\.com|twitter\.com/i.test(url)) setDetectedPlatform('🐦 Twitter / X')
    else if (/linkedin\.com/i.test(url)) setDetectedPlatform('💼 LinkedIn')
    else if (/reddit\.com/i.test(url)) setDetectedPlatform('🤖 Reddit')
    else if (/medium\.com|substack\.com/i.test(url)) setDetectedPlatform('📝 Blog')
    else if (/bsky\.app|bluesky\.social/i.test(url)) setDetectedPlatform('🦋 Bluesky')
    else if (/threads\.net/i.test(url)) setDetectedPlatform('👁️ Threads')
    else if (/mastodon\.social|mastodon\./i.test(url)) setDetectedPlatform('🔵 Mastodon')
    else if (/instagram\.com/i.test(url)) setDetectedPlatform('📸 Instagram')
    else if (/tiktok\.com/i.test(url)) setDetectedPlatform('🎵 TikTok')
    else setDetectedPlatform('🔗 Unknown')
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
      if (data.creditsRemaining !== null) setUsage(FREE_LIMIT - data.creditsRemaining)
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

  const FREE_LIMIT = 5

  // ── Auth screen ──
  if (!signedIn) {
    return (
      <div className="dashboard">
        <main className="dashboard-main" style={{ maxWidth: 400, margin: '0 auto', paddingTop: 80 }}>
          <Link to="/" className="logo" style={{ fontSize: 24, display: 'block', textAlign: 'center', marginBottom: 32 }}>ThreadFlip</Link>
          <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Sign in to continue</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Enter your email to get started. No password needed — we'll send you a magic link (coming soon).</p>
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
          {error && <p style={{ color: 'var(--alert, #ef4444)', fontSize: 14, marginBottom: 16 }}>{error}</p>}
          <button className="btn btn-primary btn-lg convert-btn" onClick={handleSignIn}>Continue</button>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            Free plan: {FREE_LIMIT} conversions/month. No credit card needed.
          </p>
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
          <a href="#" className="sidebar-link active">Convert</a>
          <a href="#" className="sidebar-link">History</a>
        </nav>
        <div className="sidebar-usage">
          <div className="usage-label">{email}</div>
          <div className="usage-bar">
            <div className="usage-fill" style={{ width: `${Math.min(usage / FREE_LIMIT * 100, 100)}%` }} />
          </div>
          <div className="usage-text">{usage} / {FREE_LIMIT} conversions used</div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dash-header">
          <h1>Convert</h1>
          <Link to="/" className="dash-back">← Back to site</Link>
        </header>

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
            Supports: X/Twitter, LinkedIn, Bluesky, Threads, Mastodon, Instagram, TikTok, Reddit, Medium, Substack
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
        {error && <p style={{ color: 'var(--alert, #ef4444)', fontSize: 14, marginBottom: 16 }}>{error}</p>}
        <button
          className="btn btn-primary btn-lg convert-btn"
          onClick={handleConvert}
          disabled={loading || !url.trim()}
        >
          {loading ? 'Converting...' : 'Convert →'}
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
      </main>
    </div>
  )
}
