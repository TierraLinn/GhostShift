FROM node:22-alpine

WORKDIR /app
COPY . /app/GhostShift

ENV PORT=8787
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "/app/GhostShift/backend/server.mjs"]
