import { useState, useEffect } from 'react'
import './App.css'
import SkillRadar from './components/SkillRadar'
import Timeline from './components/Timeline'
import ActivityGrid from './components/ActivityGrid'
import DashboardDemo from './components/DashboardDemo'

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme">
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-badge">Design Engineer · 2026</div>
        <h1 className="hero-title">
          Ilham
        </h1>
        <p className="hero-desc">
          Building tools, systems, and visual interfaces for the web.
          Currently focused on design infrastructure and data visualization.
        </p>
        <div className="hero-links">
          <a href="#" className="hero-link">GitHub</a>
          <a href="#" className="hero-link">Twitter</a>
          <button className="hero-link hero-email" onClick={e => { navigator.clipboard.writeText("hello@ilham.dev"); e.target.textContent = "Copied!"; setTimeout(() => e.target.textContent = "hello@ilham.dev", 1800); }}>hello@ilham.dev</button>
          <a href="https://github.com" className="hero-link hero-link-external">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Portfolio
          </a>
        </div>
      </header>

      {/* ── Work Section ── */}
      <section className="section">
        <div className="section-header">
          <h2>Work</h2>
          <span className="section-count">3 roles</span>
        </div>
        <div className="work-grid">
          <div className="work-card">
            <span className="work-year">2024 — present</span>
            <h3>Staff Engineer · Acme Corp</h3>
            <p>Building the design systems platform powering 200+ product teams.</p>
            <div className="work-tags">
              <span className="tag">Design Systems</span>
              <span className="tag">React</span>
              <span className="tag">Platform</span>
            </div>
          </div>
          <div className="work-card">
            <span className="work-year">2021 — 2024</span>
            <h3>Senior Frontend · Linear</h3>
            <p>Led the rewrite of the issue tracking surface and real-time collaboration layer.</p>
            <div className="work-tags">
              <span className="tag">Real-time</span>
              <span className="tag">React</span>
              <span className="tag">GraphQL</span>
            </div>
          </div>
          <div className="work-card">
            <span className="work-year">2019 — 2021</span>
            <h3>Full-Stack · Stripe</h3>
            <p>Built dashboard infrastructure for the Connect platform team.</p>
            <div className="work-tags">
              <span className="tag">Portfolios</span>
              <span className="tag">APIs</span>
              <span className="tag">Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DataViz Section ── */}
      <section className="section section-dataviz">
        <div className="section-header">
          <h2>Data Visualization</h2>
          <span className="section-count">D3 · Real-time · Interactive</span>
        </div>
        <p className="section-desc">
          Interactive data visualization components built with D3.js and React.
          Each visualization is responsive, accessible, and uses direct labels.
        </p>
        <div className="viz-grid">
          <SkillRadar />
          <Timeline />
          <ActivityGrid />
          <DashboardDemo />
        </div>
      </section>

      {/* ── Projects ── */}
      <section className="section">
        <div className="section-header">
          <h2>Projects</h2>
          <span className="section-count">Open source</span>
        </div>
        <div className="project-grid">
          <a href="#" className="project-card">
            <div className="project-icon">◆</div>
            <h3>Rivet</h3>
            <p>Open-source state machine for React. 4k+ stars on GitHub.</p>
            <span className="project-meta">React · TypeScript</span>
          </a>
          <a href="#" className="project-card">
            <div className="project-icon">▲</div>
            <h3>Pitch</h3>
            <p>Lightweight presentation tool built on Web Components.</p>
            <span className="project-meta">Web Components · Lit</span>
          </a>
          <a href="#" className="project-card">
            <div className="project-icon">●</div>
            <h3>Typo</h3>
            <p>Typography scale generator with variable font previews.</p>
            <span className="project-meta">CSS · Font Tools</span>
          </a>
        </div>
      </section>

      {/* ── Writing ── */}
      <section className="section">
        <div className="section-header">
          <h2>Writing</h2>
          <span className="section-count">Latest posts</span>
        </div>
        <div className="writing-list">
          <a href="#" className="writing-card">
            <span className="writing-date">Feb 2026</span>
            <div>
              <h3>On Design Systems at Scale</h3>
              <p>Lessons from maintaining a component library used by hundreds of engineers.</p>
            </div>
            <svg className="writing-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
          <a href="#" className="writing-card">
            <span className="writing-date">Nov 2025</span>
            <div>
              <h3>Rethinking State Machines</h3>
              <p>Why deterministic UI is the next frontier for frontend architecture.</p>
            </div>
            <svg className="writing-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>&copy; 2026 Ilham · Built with React + D3</p>
      </footer>
    </>
  )
}
