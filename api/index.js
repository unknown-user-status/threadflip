// Vercel serverless function — wraps the Express app
// During local dev, run: node server/index.js
// On Vercel, this file handles all /api/* requests

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import Stripe from 'stripe'
import OpenAI from 'openai'

// ── AI Provider config ──
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'
const AI_BASE_URL = process.env.AI_BASE_URL || ''
const AI_MODEL = process.env.AI_MODEL || ''
const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ''
const AI_FIQSTR_PACKAGE = process.env.AI_FIQSTR_PACKAGE || 'premium'

// ── Provider Registry ──
const PROVIDERS = {
  openai: {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  'fiqstr-plus': {
    label: 'Fiqstr Plus',
    baseURL: 'https://api.cybersecdev.cloud/v1',
    defaultModel: 'fiq/deepseek-v4-pro',
    models: [
      'fiq/deepseek-v4-pro', 'fiq/deepseek-v4-flash',
      'fiq/qwen3.5-plus', 'fiq/qwen3.6-plus', 'fiq/qwen3.7-max',
      'fiq/glm-5.1', 'fiq/kimi-k2.5', 'fiq/minimax-m3',
    ],
    keyPrefix: 'sk-or-v1-',
  },
  'fiqstr-premium': {
    label: 'Fiqstr Premium',
    baseURL: 'https://core.fiqstr.com/v1',
    defaultModel: 'fiq/claude-opus-4.8',
    models: [
      'fiq/claude-haiku-3', 'fiq/claude-haiku-3.5', 'fiq/claude-haiku-4.5',
      'fiq/claude-opus-4', 'fiq/claude-opus-4.1', 'fiq/claude-opus-4.5',
      'fiq/claude-opus-4.6', 'fiq/claude-opus-4.7', 'fiq/claude-opus-4.8',
      'fiq/claude-sonnet-3', 'fiq/claude-sonnet-3.5', 'fiq/claude-sonnet-3.7',
      'fiq/claude-sonnet-4', 'fiq/claude-sonnet-4.5', 'fiq/claude-sonnet-4.6',
      'fiq/gpt-5.1', 'fiq/gpt-5.2', 'fiq/gpt-5.3', 'fiq/gpt-5.4', 'fiq/gpt-5.5',
    ],
    keyPrefix: 'fiq-',
  },
  together: {
    label: 'Together AI',
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x22B-Instruct-v0.1'],
  },
  groq: {
    label: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  ollama: {
    label: 'Ollama Cloud',
    baseURL: 'https://api.ollama.ai/v1',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi4'],
  },
  openrouter: {
    label: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-2.0-flash-001'],
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    baseURL: '',
    defaultModel: 'gpt-4o-mini',
    models: [],
  },
}

// ── Init AI Client ──
let aiClient = null
let aiModel = (PROVIDERS[AI_PROVIDER] || PROVIDERS.openai).defaultModel
let activeProvider = AI_PROVIDER

function initProvider(providerId, apiKey, model, baseUrl) {
  const p = PROVIDERS[providerId]
  if (!p) return null

  const key = apiKey || AI_API_KEY
  if (!key) return null

  const config = { apiKey: key }
  config.baseURL = baseUrl || p.baseURL || 'https://api.openai.com/v1'
  activeProvider = providerId
  aiModel = model || p.defaultModel || 'gpt-4o-mini'

  return new OpenAI(config)
}

// Initialise from env vars
if (AI_API_KEY) {
  let pId = AI_PROVIDER
  if (pId === 'fiqstr' || pId === 'fiqstr-premium') {
    pId = AI_FIQSTR_PACKAGE === 'plus' ? 'fiqstr-plus' : 'fiqstr-premium'
  }
  aiClient = initProvider(pId, AI_API_KEY, AI_MODEL, AI_BASE_URL)
}

const app = express()

// ── Security ──
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }))

// ── Stripe webhook (raw body) ──
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sk = process.env.STRIPE_SECRET_KEY
  const ws = process.env.STRIPE_WEBHOOK_SECRET
  if (!sk || !ws) {
    return res.status(503).json({ error: 'Stripe not configured' })
  }
  const stripe = new Stripe(sk)
  try {
    const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], ws)
    console.log('Webhook event:', event.type)
    res.json({ received: true })
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
})

app.use(express.json())

// ── Prompt Templates ──
const PROMPTS = {
  linkedin: 'Rewrite as a professional LinkedIn post with short paragraphs and emojis. End with a question.',
  blog: 'Rewrite as a short blog post with a ## title and clear sections.',
  newsletter: 'Rewrite as a newsletter edition with a greeting, insight, and CTA.',
  summary: 'Summarize into 4-6 bullet points. Each bullet starts with a bolded takeaway.',
}

const PLATFORM_LABELS = {
  twitter: 'Twitter / X', linkedin: 'LinkedIn', reddit: 'Reddit',
  blog: 'Blog', bluesky: 'Bluesky', threads: 'Threads',
  mastodon: 'Mastodon', instagram: 'Instagram', tiktok: 'TikTok',
  facebook: 'Facebook',
  unknown: 'Unknown',
}

function detectPlatform(url) {
  if (/x\.com|twitter\.com/i.test(url)) return 'twitter'
  if (/linkedin\.com/i.test(url)) return 'linkedin'
  if (/reddit\.com/i.test(url)) return 'reddit'
  if (/medium\.com|substack\.com/i.test(url)) return 'blog'
  if (/bsky\.app|bluesky\.social/i.test(url)) return 'bluesky'
  if (/threads\.net/i.test(url)) return 'threads'
  if (/mastodon\.social|mastodon\./i.test(url)) return 'mastodon'
  if (/instagram\.com/i.test(url)) return 'instagram'
  if (/tiktok\.com/i.test(url)) return 'tiktok'
  if (/facebook\.com|fb\.com/i.test(url)) return 'facebook'
  return 'unknown'
}

const rateLimits = new Map()
function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimits.get(ip) || { count: 0, resetAt: now + 60000 }
  if (now > entry.resetAt) { entry.count = 1; entry.resetAt = now + 60000 }
  else entry.count++
  rateLimits.set(ip, entry)
  return entry.count <= 20
}

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')),
    ai: !!aiClient || !!AI_API_KEY,
    aiProvider: activeProvider,
    aiModel: aiModel,
  })
})

// ── List available providers & models ──
app.get('/api/models', (req, res) => {
  const list = Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    label: p.label,
    defaultModel: p.defaultModel,
    models: p.models,
    keyPrefix: p.keyPrefix || null,
    needsBaseUrl: id === 'custom',
    active: id === activeProvider,
    currentModel: id === activeProvider ? aiModel : null,
  }))
  res.json({ providers: list })
})

// ── Switch provider/model (stored in env-compatible headers, runtime only) ──
app.post('/api/provider', express.json(), (req, res) => {
  try {
    const { provider, model, apiKey, baseUrl } = req.body
    if (!provider || !PROVIDERS[provider]) {
      return res.status(400).json({ error: 'Invalid provider' })
    }
    const key = apiKey || AI_API_KEY
    if (!key) {
      return res.status(400).json({ error: 'API key required' })
    }
    aiClient = initProvider(provider, key, model, baseUrl)
    res.json({ provider: activeProvider, model: reqModel || aiModel, ok: !!aiClient })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Convert ──
app.post('/api/convert', async (req, res) => {
  try {
    const { url, format, model: reqModel } = req.body
    if (!url || !format) return res.status(400).json({ error: 'url and format required' })
    if (!['linkedin', 'blog', 'newsletter', 'summary'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format' })
    }
    if (!checkRateLimit(req.ip || req.connection.remoteAddress)) {
      return res.status(429).json({ error: 'Too many requests. Wait a minute.' })
    }

    const platform = detectPlatform(url)
    let output = ''

    if (aiClient) {
      try {
        const completion = await aiClient.chat.completions.create({
          model: reqModel || aiModel,
          messages: [
            { role: 'system', content: 'You repurpose social media content for different platforms. Keep meaning, adapt tone.' },
            { role: 'user', content: PROMPTS[format] + '\n\nURL: ' + url + '\n(If inaccessible, generate plausible content about tech, productivity, or design.)' },
          ],
          max_tokens: 600,
          temperature: 0.7,
        })
        output = completion.choices[0]?.message?.content || ''
      } catch (aiErr) {
        console.error('AI provider error:', aiErr.message)
        // fall through to mock
      }
    }

    if (!output) {
      const mock_outputs = {
        linkedin: 'After months of iteration, here\'s what we learned:\n\n1) Start small and validate\n2) Listen to feedback early\n3) Iterate fast\n\nWhat\'s your experience been? 👇',
        blog: '## Key Lessons Learned\n\nIt\'s easy to overcomplicate things.\n\n**Takeaways:**\n- Measure first\n- Ship fast\n- Listen to users\n\n---\n*Originally from ' + PLATFORM_LABELS[platform] + '*',
        newsletter: '## What We Learned\n\nHey folks,\n\nSharing a thread on why starting simple wins.\n\n**Action:** Ship one thing you\'re overthinking this week.\n\n— ThreadFlip',
        summary: '**Summary**\n\n1. Start simple\n2. Measure before optimizing\n3. Ship fast\n4. Listen to feedback',
      }
      output = mock_outputs[format] || mock_outputs.linkedin
    }

    res.json({ output, platform: PLATFORM_LABELS[platform], format })
  } catch (err) {
    console.error('Convert error:', err)
    res.status(500).json({ error: 'Conversion failed.' })
  }
})

// ── Stripe Checkout ──
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe not configured' })
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { priceId, email } = req.body
    if (!priceId) return res.status(400).json({ error: 'priceId required' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?success=1`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/pricing`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// ── Auth (demo) ──
app.post('/api/auth', (req, res) => {
  const { email } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' })
  }
  res.json({ email, tier: 'free', conversions: 0 })
})

export default app
