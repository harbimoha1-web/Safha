# Supabase Edge Function Secrets Configuration

## Required Secrets

Run these commands to set your production secrets:

```bash
# AI Summaries (Claude API)
npx supabase secrets set CLAUDE_API_KEY=sk-ant-your-key-here

# Payments (Moyasar)
npx supabase secrets set MOYASAR_API_KEY=sk_live_your-key-here
npx supabase secrets set MOYASAR_WEBHOOK_SECRET=your-webhook-secret

# Email Notifications (Resend) - Optional
npx supabase secrets set RESEND_API_KEY=re_your-key-here

# WhatsApp Notifications (Taqnyat) - Optional
npx supabase secrets set TAQNYAT_API_KEY=your-key-here
```

## Where to get API Keys

1. **Claude API Key**: https://console.anthropic.com/
2. **Moyasar API Key**: https://dashboard.moyasar.com/ (Settings > API Keys)
3. **Moyasar Webhook Secret**: Generate in Moyasar Dashboard > Webhooks
4. **Resend API Key**: https://resend.com/api-keys
5. **Taqnyat API Key**: https://taqnyat.sa/

## Verify Secrets

```bash
npx supabase secrets list
```

## Important Security Notes

- NEVER commit API keys to git
- Use environment-specific keys (test vs live)
- Moyasar webhook secret MUST match what's configured in Moyasar Dashboard
