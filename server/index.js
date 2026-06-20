// Local dev server — reuses the Vercel-compatible API handler
import 'dotenv/config'
import handler from '../api/index.js'

const PORT = process.env.PORT || 3001

handler.listen(PORT, () => {
  console.log(`ThreadFlip API running on http://localhost:${PORT}`)
  console.log(`Stripe: ${process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured (set STRIPE_SECRET_KEY)'}`)
  console.log(`OpenAI: ${process.env.OPENAI_API_KEY ? 'configured' : 'not configured (set OPENAI_API_KEY)'}`)
})
