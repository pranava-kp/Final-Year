#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script to install Python, create a virtual environment, and install deps from pyproject.toml
# Usage:
#   bash scripts/bootstrap.sh            # install runtime deps
#   bash scripts/bootstrap.sh --dev      # include dev deps

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

INCLUDE_DEV=false
if [[ "${1-}" == "--dev" ]]; then
  INCLUDE_DEV=true
fi

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Ensure Homebrew on macOS if needed
if [[ "$(uname -s)" == "Darwin" ]]; then
  if ! command_exists brew; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(${SHELL} -lc 'brew shellenv')"
  fi
fi

# Choose a Python 3 interpreter (prefer 3.11+)
PY="python3"
if command_exists "$PY"; then
  if ! "$PY" -c 'import sys; import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)'; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      echo "Installing python@3.11 via Homebrew..."
      brew update
      brew install python@3.11
      if brew --prefix python@3.11 >/dev/null 2>&1; then
        PY_BIN_DIR="$(brew --prefix python@3.11)/bin"
        export PATH="$PY_BIN_DIR:$PATH"
        PY="$PY_BIN_DIR/python3.11"
      fi
    else
      echo "Python >=3.11 is recommended. Please install Python 3.11+ and re-run."
      exit 1
    fi
  fi
else
  if [[ "$(uname -s)" == "Darwin" ]]; then
    echo "Installing python@3.11 via Homebrew..."
    brew update
    brew install python@3.11
    if brew --prefix python@3.11 >/dev/null 2>&1; then
      PY_BIN_DIR="$(brew --prefix python@3.11)/bin"
      export PATH="$PY_BIN_DIR:$PATH"
      PY="$PY_BIN_DIR/python3.11"
    fi
  else
    echo "python3 not found. Please install Python 3.11+ and re-run."
    exit 1
  fi
fi

# Recreate venv if it exists but is using Python < 3.11
if [[ -d .venv ]]; then
  if ! .venv/bin/python -c 'import sys; import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)'; then
    echo "Existing .venv uses Python < 3.11. Recreating..."
    rm -rf .venv
  fi
fi

# Create venv with the chosen Python
if [[ ! -d .venv ]]; then
  echo "Creating virtual environment in .venv using $PY..."
  "$PY" -m venv .venv
fi

# Activate venv
# shellcheck disable=SC1091
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel

# Try to generate requirements from pyproject; fallback to hardcoded list if tomllib/tomli missing
REQ_FILE="/tmp/requirements.$$"
python - <<'PY' > "$REQ_FILE" || true
import sys
try:
    import tomllib  # Python 3.11+
except ModuleNotFoundError:
    try:
        import tomli as tomllib  # type: ignore
    except ModuleNotFoundError:
        raise SystemExit(1)
with open('pyproject.toml', 'rb') as f:
    data = tomllib.load(f)
for d in data.get('project', {}).get('dependencies', []):
    print(d)
PY

# If generation failed, write dependencies from pyproject directly
if [[ ! -s "$REQ_FILE" ]]; then
  cat > "$REQ_FILE" <<'REQS'
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
langchain-anthropic>=0.3.10
langchain-community>=0.3.20
langchain-experimental>=0.3.4
langchain-openai>=0.3.9
langgraph>=0.3.18
langgraph-checkpoint-sqlite>=2.0.6
langsmith>=0.3.18
langchain-google-genai>=1.0.0
sqlalchemy[asyncio]>=2.0.30
alembic>=1.13.1
asyncpg>=0.29.0
chromadb>=0.5.0
redis>=5.0.4
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
pydantic-settings>=2.2.1
python-dotenv>=1.0.1
jinja2>=3.1.4
REQS
fi

pip install -r "$REQ_FILE"

if $INCLUDE_DEV; then
  DEV_REQ_FILE="/tmp/requirements.dev.$$"
  python - <<'PY' > "$DEV_REQ_FILE" || true
import sys
try:
    import tomllib
except ModuleNotFoundError:
    try:
        import tomli as tomllib  # type: ignore
    except ModuleNotFoundError:
        raise SystemExit(1)
with open('pyproject.toml', 'rb') as f:
    data = tomllib.load(f)
for group_name, pkgs in data.get('project', {}).get('optional-dependencies', {}).items():
    for p in pkgs:
        print(p)
PY
  if [[ ! -s "$DEV_REQ_FILE" ]]; then
    cat > "$DEV_REQ_FILE" <<'DEVREQS'
pytest>=8.2.0
pytest-cov>=5.0.0
pytest-asyncio>=0.23.6
httpx>=0.27.0
mypy>=1.10.0
pre-commit>=3.7.1
ruff>=0.12.8
DEVREQS
  fi
  pip install -r "$DEV_REQ_FILE"
fi

# Helpful message
echo "\nAll set. Activate the environment with:"
echo "  source .venv/bin/activate"

echo "Then run:"
echo "  PYTHONPATH=src python scripts/test_question_retrieval.py"
