# GhostShift Release Notes

## v0.1.0 — Launch Release

- Release tag: `v0.1.0`
- Date: 2026-05-13
- Branch: `main`
- Status: Launch-ready production deployment prepared
- Production URL: `https://ghostshift.onrender.com`

### Summary
GhostShift is now tagged for launch as a public release candidate. The repository is clean and synced with `origin/main`, and a release tag has been pushed.

### Deployment details
- Production deployment documentation is in `DEPLOYMENT_TODAY.md`
- Deployment scripts are `deploy.sh` and `deploy.ps1`
- Backend environment config is created in `GhostShift/backend/.env` during deployment setup
- The browser extension requires updating `GhostShift/GhostShift/extension-chrome-edge/manifest.json` with the deployed production host

### Next steps
1. Deploy to Railway or Render using the documented steps
2. Update extension host permissions for the live domain
3. Reload the extension in Chrome/Edge and verify the live demo pages
4. Share the deployed URL so it can be validated

### Notes
- Frontend API calls are relative to the server, so the app works automatically when served from the deployed backend host
- Stripe variables are configured through Railway/Render environment variables
