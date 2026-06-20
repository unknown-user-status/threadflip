import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Dashboard from './Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="logo">ThreadFlip</Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <Link to="/pricing">Pricing</Link>
            <Link to="/dashboard" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge">Turn tweets into content ✦</div>
        <h1 className="hero-title">Your Twitter threads,<br />repurposed in seconds.</h1>
        <p className="hero-desc">
          Paste a tweet URL. Get a LinkedIn post, blog draft, newsletter, or short-form content.
          No more staring at a blank page.
        </p>
        <div className="hero-cta">
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            Try it free →
          </Link>
        </div>
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-label">Original tweet</div>
            <p className="preview-text">"Just shipped a new feature that reduces API latency by 40%. Thread below on how we did it..."</p>
          </div>
          <div className="preview-arrow">→</div>
          <div className="preview-card preview-card-out">
            <div className="preview-label">LinkedIn</div>
            <p className="preview-text">Excited to share a deep dive on how we cut API latency by 40% at Acme Corp. A few key lessons: 1) Measure first, optimize second...</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="features">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h3>Paste a tweet URL</h3>
            <p>Any public tweet or thread — just copy the link and paste it in.</p>
          </div>
          <div className="step-connector" />
          <div className="step">
            <span className="step-num">2</span>
            <h3>Choose your format</h3>
            <p>LinkedIn post, blog draft, newsletter, or Twitter thread summary.</p>
          </div>
          <div className="step-connector" />
          <div className="step">
            <span className="step-num">3</span>
            <h3>Copy & publish</h3>
            <p>Get clean, ready-to-publish content in seconds. No editing needed.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section section-features">
        <h2 className="section-title">Why ThreadFlip?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>10x faster</h3>
            <p>Turn hours of rewriting into seconds. One click, multiple formats.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Platform-optimized</h3>
            <p>Each format is tuned for its platform — LinkedIn tone, blog structure, newsletter style.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track everything</h3>
            <p>Dashboard shows your conversion history. See what works best.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Your content stays yours</h3>
            <p>We never train on your data. Conversions are private to your account.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section section-pricing" id="pricing">
        <h2 className="section-title">Simple pricing</h2>
        <p className="section-desc">Start free. Upgrade when you need more.</p>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Free</h3>
            <p className="price">$0</p>
            <p className="price-desc">Try it out</p>
            <ul>
              <li>5 conversions / month</li>
              <li>3 formats</li>
              <li>Basic support</li>
            </ul>
            <Link to="/dashboard" className="btn btn-outline">Get Started</Link>
          </div>
          <div className="pricing-card pricing-card-featured">
            <div className="pricing-badge">Popular</div>
            <h3>Pro</h3>
            <p className="price">$12</p>
            <p className="price-desc">per month</p>
            <ul>
              <li>Unlimited conversions</li>
              <li>All formats</li>
              <li>Priority support</li>
              <li>Export history</li>
            </ul>
            <button className="btn btn-primary" disabled>Coming soon</button>
          </div>
          <div className="pricing-card">
            <h3>Business</h3>
            <p className="price">$29</p>
            <p className="price-desc">per month</p>
            <ul>
              <li>Everything in Pro</li>
              <li>Team seats (up to 5)</li>
              <li>API access</li>
              <li>Custom branding</li>
            </ul>
            <button className="btn btn-outline" disabled>Coming soon</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <h2>Start repurposing your content.</h2>
        <p>Paste your first tweet. See what you get back.</p>
        <Link to="/dashboard" className="btn btn-primary btn-lg">
          Try it free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 ThreadFlip. Built with React + Stripe.</p>
      </footer>
    </div>
  )
}

function PricingPage() {
  return (
    <div className="landing">
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="logo">ThreadFlip</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/dashboard" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>
      <section className="section section-pricing" style={{ paddingTop: 80 }}>
        <h2 className="section-title">Simple pricing</h2>
        <p className="section-desc">Start free. Upgrade when you need more.</p>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Free</h3>
            <p className="price">$0</p>
            <p className="price-desc">Try it out</p>
            <ul>
              <li>5 conversions / month</li>
              <li>3 formats</li>
              <li>Basic support</li>
            </ul>
            <Link to="/dashboard" className="btn btn-outline">Get Started</Link>
          </div>
          <div className="pricing-card pricing-card-featured">
            <div className="pricing-badge">Popular</div>
            <h3>Pro</h3>
            <p className="price">$12</p>
            <p className="price-desc">per month</p>
            <ul>
              <li>Unlimited conversions</li>
              <li>All formats</li>
              <li>Priority support</li>
              <li>Export history</li>
            </ul>
            <button className="btn btn-primary" disabled>Coming soon</button>
          </div>
          <div className="pricing-card">
            <h3>Business</h3>
            <p className="price">$29</p>
            <p className="price-desc">per month</p>
            <ul>
              <li>Everything in Pro</li>
              <li>Team seats (up to 5)</li>
              <li>API access</li>
              <li>Custom branding</li>
            </ul>
            <button className="btn btn-outline" disabled>Coming soon</button>
          </div>
        </div>
      </section>
      <footer className="footer">
        <p>© 2026 ThreadFlip.</p>
      </footer>
    </div>
  )
}

export default App
