#!/bin/sh
set -eu
cd "$(dirname "$0")"
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/collect_dora.py
.venv/bin/python scripts/verify.py
exec .venv/bin/streamlit run dashboard/app.py --server.headless true
