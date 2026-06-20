// Vercel serverless function — wraps the Express app
// During local dev, run: node server/index.js
// On Vercel, this file handles all /api/* requests

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import Stripe from 'stripe'
import OpenAI from 'openai'

const app = express()

// ── Security ──
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }))

// ── Stripe webhook (raw body) ──
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe not configured' })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  try {
    const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
    console.log('Webhook event:', event.type)
    res.json({ received: true })
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
})

app.use(express.json())

// ── Helpers ──
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
    openai: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')),
  })
})

// ── Convert ──
app.post('/api/convert', async (req, res) => {
  try {
    const { url, format } = req.body
    if (!url || !format) return res.status(400).json({ error: 'url and format required' })
    if (!['linkedin', 'blog', 'newsletter', 'summary'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format' })
    }
    if (!checkRateLimit(req.ip || req.connection.remoteAddress)) {
      return res.status(429).json({ error: 'Too many requests. Wait a minute.' })
    }

    const platform = detectPlatform(url)
    let output = ''

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You repurpose social media content for different platforms. Keep meaning, adapt tone.' },
          { role: 'user', content: `${PROMPTS[format]}\n\nURL: ${url}\n(If inaccessible, generate plausible content about tech, productivity, or design.)` },
        ],
        max_tokens: 600,
        temperature: 0.7,
      })
      output = completion.choices[0]?.message?.content || ''
    } else {
      // Mock fallback
      const MOCKS = {
        linkedin: `After months of iteration, here's what we learned:\n\n1) Start small and validate\n2) Listen to feedback early\n3) Iterate fast\n\nWhat's your experience been? 👇`,
        blog: `## Key Lessons Learned\n\nIt's easy to overcomplicate things.\n\n**Takeaways:**\n- Measure first\n- Ship fast\n- Listen to users\n\n---\n*Originally from ${PLATFORM_LABELS[platform]}*`,
        newsletter: `## What We Learned\n\nHey folks,\n\nSharing a thread on why starting simple wins.\n\n**Action:** Ship one thing you're overthinking this week.\n\n— ThreadFlip`,
        summary: `**Summary**\n\n1. Start simple\n2. Measure before optimizing\n3. Ship fast\n4. Listen to feedback`,
      }
      output = MOCKS[format] || MOCKS.linkedin
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
