#!/usr/bin/env bash
# PCS.army is the shared codebase. After any change here, run this to mirror the tree into the
# sibling checkouts (../pcs-navy, ../pcs-airforce), swap the three brand-specific files, commit and push.
#   scripts/sync-brands.sh "commit message"
set -e
MSG="${1:?commit message required}"
ARMY="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ARMY"
git add -A && (git commit -q -m "$MSG" || true)
git push -q origin main
for b in navy airforce; do
  D="$ARMY/../pcs-$b"
  [ -d "$D/.git" ] || { echo "missing checkout: $D"; exit 1; }
  (cd "$D" && git checkout -q main && find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +)
  git archive HEAD | tar -x -C "$D"
  python -I - "$b" "$D" <<'EOF'
import sys, pathlib
b, D = sys.argv[1], pathlib.Path(sys.argv[2])
dom = {"navy": "pcs.navy", "airforce": "pcs.airforce"}[b]; name = {"navy": "PCS.navy", "airforce": "PCS.airforce"}[b]
for f, reps in {
  "render.yaml": [("name: pcs-army", f"name: pcs-{b}"), ("value: army", f"value: {b}"), ("value: pcs_army", f"value: pcs_{b}"), ("https://pcs.army,https://www.pcs.army", f"https://{dom},https://www.{dom}"), ("value: https://pcs.army", f"value: https://{dom}"), ("value: pcs.army,www.pcs.army", f"value: {dom},www.{dom}"), ("no-reply@pcs.army", f"no-reply@{dom}"), ("value: PCS.army", f"value: {name}")],
  "backend/.env.example": [("BRAND=army", f"BRAND={b}"), ('DB_NAME="pcs_army"', f'DB_NAME="pcs_{b}"'), ("APP_URL=https://pcs.army", f"APP_URL=https://{dom}"), ('SITE_HOSTS="pcs.army,www.pcs.army"', f'SITE_HOSTS="{dom},www.{dom}"'), ("no-reply@pcs.army", f"no-reply@{dom}"), ('EMAIL_FROM_NAME="PCS.army"', f'EMAIL_FROM_NAME="{name}"')],
  "README.md": [("pcs.army` and `www.pcs.army`", f"{dom}` and `www.{dom}`")],
}.items():
    p = D / f; s = p.read_text(encoding="utf-8")
    for a, c in reps:
        assert a in s, (f, a); s = s.replace(a, c)
    p.write_text(s, encoding="utf-8")
EOF
  (cd "$D" && git add -A && (git commit -q -m "$MSG" || true) && git push -q origin main)
done
for d in pcs-army pcs-navy pcs-airforce; do
  (cd "$ARMY/../$d" && git fetch -q origin && echo "$d: local $(git rev-parse --short HEAD) github $(git rev-parse --short origin/main) uncommitted $(git status --porcelain | wc -l)")
done
