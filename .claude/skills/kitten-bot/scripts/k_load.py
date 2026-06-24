#!/usr/bin/env python3
"""
k_load.py

Fetches any file from the kitten-bot GitHub repo using the GitHub Contents API.
Reads repo, branch, and github_token from config.json (in the skill root).

If github_token is empty or missing, the API is called unauthenticated
(GitHub rate-limits to 60 requests/hour per IP).

Usage (run from skill root):
  KITTEN_PROJECT_DIR=$(pwd) && cd {skill_dir} && python -m scripts.k_load <file-path> [file-path ...] [branch]
  python -m scripts.k_load references/kitten/stack.md
  python -m scripts.k_load agents/_overview.md references/_overview.md
  python -m scripts.k_load agents/identity.md dev

Output:
  Decoded file content printed to stdout.
  Multiple files are separated by "---" dividers.
"""

import os
import sys
import json
import base64
import ssl
import urllib.request
from pathlib import Path


def _d(s: str) -> str:
    return base64.b64decode(s).decode()


_GH_BASE   = 'aHR0cHM6Ly9naXRodWIuY29tLw=='
_API_BASE  = 'aHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8='
_SRC_REPO  = 'YWJhcHBpMTkva2l0dGVu'
_ACCEPT    = 'YXBwbGljYXRpb24vdm5kLmdpdGh1Yi52Mytqc29u'
_UA        = 'a2l0dGVuLWZldGNo'
_AUTH_K    = 'QXV0aG9yaXphdGlvbg=='
_ACCEPT_K  = 'QWNjZXB0'
_UA_K      = 'VXNlci1BZ2VudA=='
_BEARER    = 'QmVhcmVyIA=='

_ICON = (
    " █   ████ ███   █  kitten-bot\n"
    "█   █    █   █   █ by bappi\n"
    " █  █████████   █  https://abappi19.github.io/kitten-bot\n"
    "\n"
    "\n"
    "\n"
)


def _with_icon(text: str) -> str:
    return _ICON + "\n\n\n" + text


def ssl_context() -> ssl.SSLContext:
    # Try platform cert bundles in order — Python.org builds don't bundle certs
    candidates = [
        "/etc/ssl/cert.pem",
        "/etc/ssl/certs/ca-certificates.crt",
        "/etc/pki/tls/certs/ca-bundle.crt",
        "/etc/ssl/ca-bundle.pem",
    ]
    for path in candidates:
        if Path(path).exists():
            return ssl.create_default_context(cafile=path)
    return ssl.create_default_context()


# --- Paths ---

skill_dir = Path.cwd()
config_path = skill_dir / "config.json"


# --- Config ---

if not config_path.exists():
    print(f"Error: config.json not found at {config_path}", file=sys.stderr)
    sys.exit(1)

with open(config_path) as f:
    config = json.load(f)

repo = config["repo"]
default_branch = config.get("branch", "main")
token = config.get("github_token", "") or ""


# --- Args ---

if len(sys.argv) < 2:
    print("Usage: python -m scripts.k_load <file-path> [file-path ...] [branch]", file=sys.stderr)
    print("Example: python -m scripts.k_load agents/_overview.md references/_overview.md", file=sys.stderr)
    sys.exit(1)

args = sys.argv[1:]

# Last arg with no "/" is treated as a branch name
if len(args) > 1 and "/" not in args[-1]:
    branch = args[-1]
    file_paths = args[:-1]
else:
    branch = default_branch
    file_paths = args


# --- Source repo detection ---

def find_repo_root(start: Path) -> "Path | None":
    for parent in [start, *start.parents]:
        if (parent / ".git").is_dir():
            return parent
    return None


def is_source_repo(root: Path) -> bool:
    git_config = root / ".git" / "config"
    if not git_config.exists():
        return False
    return _d(_SRC_REPO) in git_config.read_text()


repo_root = find_repo_root(skill_dir)
if not repo_root:
    project_dir = os.environ.get("KITTEN_PROJECT_DIR")
    if project_dir:
        repo_root = find_repo_root(Path(project_dir))


# --- Fetch helpers ---

def fetch_remote(file_path: str) -> str:
    repo_path = repo.replace(_d(_GH_BASE), "")
    api_url = f"{_d(_API_BASE)}{repo_path}/contents/{file_path}?ref={branch}"

    headers = {
        _d(_ACCEPT_K): _d(_ACCEPT),
        _d(_UA_K):     _d(_UA),
    }
    if token:
        headers[_d(_AUTH_K)] = f"{_d(_BEARER)}{token}"

    req = urllib.request.Request(api_url, headers=headers)

    try:
        with urllib.request.urlopen(req, context=ssl_context()) as res:
            data = json.loads(res.read())
    except ssl.SSLCertVerificationError:
        print(
            "kitten-fetch error: SSL certificate verification failed.\n"
            "Fix: run the certificate installer for your Python version.\n"
            "  macOS:  open '/Applications/Python 3.x/Install Certificates.command'\n"
            "  Linux:  sudo apt install ca-certificates  (or equivalent for your distro)\n"
            "  Any:    pip install certifi",
            file=sys.stderr,
        )
        sys.exit(1)
    except urllib.error.HTTPError as e:
        print(f"kitten-fetch error: HTTP {e.code} for {file_path}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"kitten-fetch error: {e.reason}", file=sys.stderr)
        sys.exit(1)

    if data.get("encoding") != "base64" or not data.get("content"):
        print(f"kitten-fetch error: Unexpected response format for {file_path}.", file=sys.stderr)
        sys.exit(1)

    return base64.b64decode(data["content"]).decode("utf-8")


def fetch_file(file_path: str) -> str:
    if repo_root and is_source_repo(repo_root):
        local_file = repo_root / file_path
        if local_file.exists():
            return local_file.read_text()
        else:
            print(f"kitten-fetch: local file not found at {local_file}", file=sys.stderr)
            sys.exit(1)
    return fetch_remote(file_path)


# --- Output ---

sys.stdout.write(_ICON)

for i, file_path in enumerate(file_paths):
    if i > 0:
        sys.stdout.write(f"\n\n---\n\n")
    sys.stdout.write(f"### {file_path}\n\n")
    sys.stdout.write(fetch_file(file_path))
