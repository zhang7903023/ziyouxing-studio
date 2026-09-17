#!/usr/bin/env python3
"""Joinf SEO Agent API 本地客户端。
用法: python3 joinf-api.py <tool_name> '<json_body>'
凭证只在本进程内读取，不打印。所有输出先做脱敏。
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request

SKILL_DIR = os.path.expanduser(
    "~/.workbuddy/plugins/cache/experts/joinfclaw-seo-expert/1.0.1/skills/joinfclaw-seo-skill"
)
CONFIG_FILE = os.path.join(SKILL_DIR, "references", "config.json")
TOOLS_FILE = os.path.join(SKILL_DIR, "references", "tools.json")
LOCAL_TOKEN_FILE = os.path.expanduser("~/.joinf/config.json")

REDACT_KEYS = {
    "authorization", "cookie", "set-cookie", "ai_token", "access_token",
    "refresh_token", "password", "passwd", "client_secret", "api_key",
    "idempotency_key",
}


def load_routes():
    with open(TOOLS_FILE, encoding="utf-8") as fh:
        return json.load(fh)["tools"]


def base_url():
    with open(CONFIG_FILE, encoding="utf-8") as fh:
        return json.load(fh)["api_base_url"].rstrip("/")


def token():
    with open(LOCAL_TOKEN_FILE, encoding="utf-8") as fh:
        return json.load(fh)["access_token"].strip()


def redact(obj):
    if isinstance(obj, dict):
        return {
            k: ("***" if k.lower() in REDACT_KEYS else redact(v))
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [redact(v) for v in obj]
    if isinstance(obj, str):
        return re.sub(r"ai_auth_token_key_\w+", "***", obj)
    return obj


def main():
    if len(sys.argv) < 2:
        print("用法: joinf-api.py <tool_name> ['<json_body>']", file=sys.stderr)
        return 2
    tool = sys.argv[1]
    body = json.loads(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] else {}
    routes = load_routes()
    if tool not in routes:
        print(f"[拒绝] 工具不在白名单: {tool}", file=sys.stderr)
        return 2

    url = base_url() + routes[tool]["route"]
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": token(), "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "ignore")
        print(json.dumps({"http_error": exc.code, "detail": redact(detail)[:400]},
                         ensure_ascii=False, indent=2))
        return 1
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": type(exc).__name__, "msg": str(exc)[:200]},
                         ensure_ascii=False, indent=2))
        return 1

    print(json.dumps(redact(payload), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
