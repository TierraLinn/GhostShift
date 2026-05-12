# 🎯 GhostShift Live Showcase - TODAY (May 12, 2026)

## ⏱️ Timeline: 30-45 minutes to LIVE

### Phase 1: Prepare Code (5 min)
- [ ] Commit extension fixes:
  ```bash
  git add -A
  git commit -m "Production deployment: updated extension manifest and demo detection"
  git push
  ```

### Phase 2: Deploy Backend (10-15 min)

**OPTION A: Railway.app (EASIEST)**
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign in with GitHub
- [ ] Click "New Project" → "Deploy from GitHub"
- [ ] Select `TierraLinn/GhostShift`
- [ ] Click Deploy
- [ ] **Copy your live URL** (will be like `https://ghostshift-xxx.railway.app`)
- [ ] Wait 2-3 minutes for deployment
- [ ] Test: Open `https://ghostshift-xxx.railway.app/dashboard.html`

**OPTION B: Render.com**
- [ ] Go to [render.com](https://render.com)
- [ ] Sign in with GitHub
- [ ] New → Web Service
- [ ] Select GhostShift repo
- [ ] Build: `npm run build`
- [ ] Start: `npm start`
- [ ] Deploy
- [ ] **Copy your live URL** (will be like `https://ghostshift-xxx.onrender.com`)
- [ ] Wait 3-5 minutes for deployment
- [ ] Test: Open `https://ghostshift-xxx.onrender.com/dashboard.html`

### Phase 3: Test Live Pages (5 min)
Test these URLs with your production domain:
- [ ] Dashboard: `https://your-url/dashboard.html`
- [ ] Signup: `https://your-url/signup.html`
- [ ] Demo player: `https://your-url/demo-player.html`
- [ ] Health check: `https://your-url/api/health`

### Phase 4: Update & Reload Extension (5 min)
1. [ ] Open `chrome://extensions`
2. [ ] Find "GhostShift" 
3. [ ] Click the ⟳ **Reload** button
4. [ ] Test at: `https://your-url/demo-player.html`
5. [ ] Click extension popup
6. [ ] Should show "GhostShift demo" ✅
7. [ ] Click demo player "Skip Ad" button
8. [ ] Verify extension auto-skips ✅

### Phase 5: Showcase to Advisors (5-10 min)

**Live Demo Points:**
1. **Show Dashboard**: `https://your-url/dashboard.html`
   - Real-time user stats
   - Freemium model explanation
   - Trial days remaining counter

2. **Walk Through Signup**: `https://your-url/signup.html`
   - New account creation
   - Shows 14-day trial start
   - Explains Plus/Family plans

3. **Demo Auto-Skip**: `https://your-url/demo-player.html`
   - Shows simulated ad break
   - Extension auto-skips the ad
   - Live data tracking in stats

4. **Explain Tech Stack**:
   - ✅ Free deployment (Railway/Render)
   - ✅ Node.js backend
   - ✅ Chrome/Edge extension
   - ✅ Freemium model (14-day trial)
   - ✅ Stripe ready for payments
   - ✅ Public, shareable URLs

---

## 🔗 Shareable Links for Advisors
Once live, share these:
```
📱 Full App:  https://your-url/
📊 Dashboard: https://your-url/dashboard.html
🎬 Demo:      https://your-url/demo-player.html
📝 Signup:    https://your-url/signup.html
```

---

## ✅ What Advisors Will See
✅ **Fully operational web app** (no localhost)
✅ **Working browser extension** (auto-skips ads)
✅ **Real freemium model** (14-day trial + plans)
✅ **Professional infrastructure** (public, always-on)
✅ **Scalable foundation** (paid features ready)
✅ **Clean signup flow** (captures leads)

---

## 📋 Post-Showcase (Day 1)
- [ ] Ask advisors for feedback
- [ ] Note any feature requests
- [ ] Keep deployment running (don't delete!)
- [ ] Monitor `/api/health` for uptime

---

## 🚀 Next Steps (This Week)
1. **Real database** (PostgreSQL via Railway/Render)
2. **Real auth** (Passwordless login)
3. **Stripe webhooks** (Payment handling)
4. **Customer Portal** (Subscription management)
5. **Publish extension** (Chrome Web Store, Microsoft Edge)
6. **Custom domain** (`ghostshift.app` - $12/year)

---

## ❓ Emergency Help
- **Deployment failed?** Check Railway/Render logs
- **Extension not working?** Verify manifest is in Git
- **404 on pages?** Ensure backend is running (check `/api/health`)
- **Need HTTPS?** Both Railway and Render provide it automatically

