# 🚀 GhostShift Production Deployment - TODAY (FREE)

## Option 1: Railway.app (RECOMMENDED - Easiest)

### Step 1: Sign up & Connect Repository
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize GhostShift repository

### Step 2: Create a New Project
1. Click "New Project" → "Deploy from GitHub"
2. Select `TierraLinn/GhostShift`
3. Railway auto-detects Node.js backend

### Step 3: Add Stripe Environment Variables
1. In Railway dashboard, go to **Variables**
2. Add these (leave empty for test mode/demo):
   ```
   STRIPE_SECRET_KEY = sk_test_your_key (or leave empty for demo)
   STRIPE_PRICE_PLUS = price_xxx (or leave empty for demo)
   STRIPE_PRICE_FAMILY = price_xxx (or leave empty for demo)
   PORT = 8787
   ```

### Step 4: Deploy
1. Click "Deploy"
2. Wait ~2-3 minutes
3. Get your live URL: `https://xxx.railway.app`

### Step 5: Test Live
- Dashboard: `https://xxx.railway.app/dashboard.html`
- Signup: `https://xxx.railway.app/signup.html`
- Demo Player: `https://xxx.railway.app/demo-player.html`

---

## Option 2: Render.com (FREE - Similar to Railway)

### Step 1: Sign up & Connect
1. Go to [render.com](https://render.com)
2. Connect GitHub
3. Click "New +" → "Web Service"
4. Select GhostShift repo

### Step 2: Configure
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `8787`
- **Environment**: Add Stripe variables (same as above)

### Step 3: Deploy
- Click "Deploy"
- Live in ~3-5 minutes
- URL: `https://xxx.onrender.com`

---

## Step 6: Update Extension for Live URL

Edit [extension-chrome-edge/popup.js](../GhostShift/extension-chrome-edge/popup.js):

Change:
```javascript
const API_URL = "http://localhost:8787";
```

To:
```javascript
const API_URL = "https://your-railway-url.railway.app";
// OR for Render:
// const API_URL = "https://your-render-url.onrender.com";
```

### Reload Extension in Chrome
1. Go to `chrome://extensions`
2. Find GhostShift
3. Click the ⟳ refresh icon
4. Test at: `https://your-railway-url.railway.app/demo-player.html`

---

## Step 7: Stripe Webhook for Real Subscriptions

In Stripe Workbench, create an HTTPS webhook endpoint:

```text
https://your-live-url/api/stripe/webhook
```

Add these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Copy the webhook signing secret into your host variables:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Confirm production health:

```text
https://your-live-url/api/health
```

The response should show:

```json
{
  "stripeConfigured": true,
  "stripeWebhookConfigured": true
}
```

---

## What Advisors Will See TODAY

✅ **Full signup flow** → Email/password → Dashboard
✅ **14-day free trial** → Tracking in real-time
✅ **Demo payment button** → Stripe checkout fallback (or real Stripe test)
✅ **Browser extension** → Auto-skips ads on demo player
✅ **Live publicly** → Shareable URL, no localhost

---

## Cost Breakdown (ALL FREE)
| Service | Free Tier | Your Cost |
|---------|-----------|-----------|
| Railway | $5/month credit | $0 (first month+) |
| Render | 1 web service free tier | $0 |
| GitHub | Public repo | $0 |
| Stripe Test | Unlimited test payments | $0 |
| Domain | optional (use xxx.railway.app) | $0 |
| **TOTAL** | | **$0** |

---

## Next Steps (After Showcase)
- [ ] Custom domain (optional: $12/year)
- [ ] Real Stripe live keys (when ready for payments)
- [ ] Replace JSON store with PostgreSQL (Supabase free)
- [ ] Add real Firebase Auth (free)
- [ ] Publish extension to Chrome Web Store
