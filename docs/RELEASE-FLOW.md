# SmartFinPro Release Flow (Landing Safe)

Status quo in this repository:
- `main` keeps the live landing state.
- `develop` and `feat/*` contain the Next.js app work.
- `main` and app history are not merge-compatible (`unrelated histories`).

## Branch Roles

- `main`: landing branch, keep stable and protected.
- `develop`: integration branch for the app, deploy candidate for VPS.
- `feat/*`: feature work.
- `release/*`: optional hardening branch before VPS cutover.

## Non-Negotiable Rules

- Do not merge `develop`/`feat/*` into `main`.
- Do not deploy app from `main` while landing must stay unchanged.
- Always use explicit branch deploys on VPS.

## Safe Sync (No Data Loss)

Run from your current feature branch:

```bash
git status
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
git tag "backup-$(date +%Y%m%d)-$(git rev-parse --abbrev-ref HEAD | tr '/' '-')"
git push origin --tags
git bundle create "smartfinpro-backup-$(date +%Y%m%d).bundle" --all
```

## Promotion Flow (App)

```bash
# 1) merge feature into develop
git checkout develop
git pull origin develop --ff-only
git merge --no-ff feat/<name> -m "merge: feat/<name> -> develop"
git push origin develop

# 2) optional stabilization branch
git checkout -b release/<yyyy-mm-dd>
git push -u origin release/<yyyy-mm-dd>
```

## Mandatory Checks Before VPS Deploy

```bash
npm run check:types
npm run test
npm run build
```

## VPS Deploy (Branch-Pinned)

`deploy.sh` supports `DEPLOY_BRANCH` now.

```bash
cd /home/master/applications/smartfinpro/public_html
DEPLOY_BRANCH=develop bash deploy.sh
```

For a release branch:

```bash
DEPLOY_BRANCH=release/<yyyy-mm-dd> bash deploy.sh
```

## GitHub Settings (Recommended)

- Protect `main`:
  - Require pull request.
  - Block direct pushes.
  - Require at least 1 review.
- Protect `develop`:
  - Require pull request.
  - Require status checks (`PR Checks` workflow).
  - Block direct force-push.
- Keep default branch on `develop` while app is in active development.

## Cutover to Full VPS Production (Later)

When app is ready and landing should move:
- Keep rollback path via DNS (Cloudflare) and previous origin.
- Switch traffic with low TTL (300s).
- Monitor 404/500, response latency, and conversion tracking first 24h.
