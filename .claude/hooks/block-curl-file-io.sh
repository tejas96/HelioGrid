#!/usr/bin/env bash
# PreToolUse(Bash): curl talks only to this machine, and writes only to /dev/null or under .qa/.
# A curl that sends to another host can carry a file out; a curl that writes a file can overwrite
# the repo or the harness. Every curl run is judged — behind env, command, xargs, timeout, a path,
# inside `bash -c`, `$(…)`, a pipe or `&&`. A heredoc fed to anything but a shell is text and is
# dropped first, as block-db-write.sh does. The options that take a value come from `curl --help
# all`, so a value is never mistaken for a URL. Only curl is guarded: wget, python and node are not.
set -euo pipefail

command -v python3 >/dev/null || { echo "Blocked: this guard needs python3 on PATH and cannot run without it." >&2; exit 2; }

HOOK_INPUT="$(cat)" python3 - <<'PY'
import json, os, re, shlex, subprocess, sys
from urllib.parse import urlsplit

ALLOWED = "Allowed: curl -i http://localhost:8084/<path> …, the URL first; a file only /dev/null or under .qa/."
LOCAL_HOSTS = {"localhost", "127.0.0.1", "10.0.2.2"}
WRAPPERS = {"env", "command", "exec", "xargs", "timeout", "nice", "nohup", "sudo", "time", "stdbuf", "caffeinate"}
SHELLS = {"sh", "bash", "zsh", "eval"}
SEPARATORS = {"|", "||", "&", "&&", ";", ";;", "|&", "(", ")", "\n"}
WRITES_PATH = {"output", "output-dir", "cookie-jar", "dump-header", "trace", "trace-ascii", "stderr",
               "etag-save", "hsts", "alt-svc", "libcurl"}
REFUSED = {"config", "remote-name", "remote-name-all", "proxy", "preproxy", "socks4", "socks4a", "socks5",
           "socks5-hostname", "resolve", "connect-to", "doh-url"}
REFUSED_PREFIX = re.compile(r"^(CURL_HOME|XDG_CONFIG_HOME|[A-Za-z_]*_proxy|[A-Za-z_]*_PROXY)=")
HEREDOC = re.compile(r"<<-?\s*(['\"]?)(\w+)\1([^\n]*)\n(.*?)(?:\n[ \t]*\2[ \t]*(?=\n|$)|\Z)", re.S)
SUBSHELL = re.compile(r"[$<>]\(|`")
REDIRECT = re.compile(r"[<>&|]+")


class Refused(Exception):
    pass


def curl_options():
    """{short: long}, every long name, and the long names that take a value, from this machine's curl."""
    short, known, takes_value = {}, set(), set()
    for line in subprocess.run(["curl", "--help", "all"], capture_output=True, text=True, check=True).stdout.splitlines():
        m = re.match(r"\s*(?:-(\S), )?\s*--([a-z0-9-]+)(\s+<)?", line)
        if m:
            known.add(m.group(2))
            if m.group(1):
                short[m.group(1)] = m.group(2)
            if m.group(3):
                takes_value.add(m.group(2))
    if "output" not in takes_value:
        raise Refused("curl --help all could not be read")
    return short, known, takes_value


def inner_commands(text):
    """Every `$(…)`, `<(…)`, `>(…)` and backtick body, so a curl inside one is judged too."""
    found, i = [], 0
    while (m := SUBSHELL.search(text, i)):
        if m.group(0) == "`":
            end = text.find("`", m.end())
            end = len(text) if end < 0 else end
            found.append(text[m.end():end]); i = end + 1; continue
        depth, j = 1, m.end()
        while j < len(text) and depth:
            depth += {"(": 1, ")": -1}.get(text[j], 0); j += 1
        found.append(text[m.end():j - 1]); i = j
    return found


def simple_commands(text):
    lexer = shlex.shlex(text, posix=True, punctuation_chars=";&|()<>\n")
    lexer.whitespace = " \t\r"
    lexer.whitespace_split = True
    lexer.commenters = ""
    words = []
    for token in lexer:
        if token in SEPARATORS or set(token) <= set(";&|\n"):
            yield words; words = []
        else:
            words.append(token)
    yield words


def safe_path(path, cwd):
    if path == "/dev/null":
        return True
    if "$" in path or "~" in path or ".." in path.split("/"):
        return False
    full = os.path.normpath(os.path.join(cwd, path))
    return full.startswith(os.path.join(os.environ.get("CLAUDE_PROJECT_DIR", cwd), ".qa") + os.sep)


def judge_curl(args, cwd, options):
    short, known, takes_value = options
    i, urls = 0, []
    while i < len(args):
        arg, i = args[i], i + 1
        if arg == "--":
            urls += args[i:]; break
        if arg.startswith("--"):
            name, _, inline = arg[2:].partition("=")
            pairs = [(name, inline if "=" in arg else None)]
        elif arg.startswith("-") and len(arg) > 1:
            pairs, k = [], 1
            while k < len(arg):
                name = short.get(arg[k])
                if name is None:
                    raise Refused(f"curl option -{arg[k]} is unknown")
                if name in takes_value:
                    pairs.append((name, arg[k + 1:] or None)); break
                pairs.append((name, None)); k += 1
        else:
            urls.append(arg); continue
        for name, value in pairs:
            if name not in known:
                raise Refused(f"curl option --{name} is unknown")
            if name in REFUSED:
                raise Refused(f"curl --{name} is refused")
            if name in takes_value and value is None:
                if i >= len(args):
                    raise Refused(f"curl --{name} has no value")
                value, i = args[i], i + 1
            if name in WRITES_PATH and not safe_path(value, cwd):
                raise Refused(f"curl --{name} writes {value}")
            if name == "url":
                urls.append(value)
            if name == "write-out" and "%output{" in value:
                raise Refused("curl --write-out %output{…} writes a file")
    for url in urls:
        host = urlsplit(url if "://" in url else "http://" + url).hostname
        if host not in LOCAL_HOSTS:
            raise Refused(f"curl sends to {host or url}, not this machine")


def without_redirects(args, cwd):
    """curl's own arguments; each shell redirect that writes is judged and dropped (`2>&1` is no file)."""
    plain, k = [], 0
    while k < len(args):
        word = args[k]
        if REDIRECT.fullmatch(word):
            target = args[k + 1] if k + 1 < len(args) else ""
            if ">" in word and not (word.endswith("&") and target.isdigit()) and not safe_path(target, cwd):
                raise Refused(f"the shell writes {target or 'a file'}")
            k += 2
        elif word.isdigit() and k + 1 < len(args) and REDIRECT.fullmatch(args[k + 1]):
            k += 1
        else:
            plain.append(word); k += 1
    return plain


def judge(text, cwd, options, depth=0):
    if depth > 4:
        raise Refused("the command nests too deep to judge")
    for inner in inner_commands(text):
        judge(inner, cwd, options, depth + 1)
    commands = list(simple_commands(SUBSHELL.sub(" ", text)))
    runs_curl = False
    for words in commands:
        while words and "=" in words[0] and not words[0].startswith("="):
            if REFUSED_PREFIX.match(words[0]):
                raise Refused(f"curl may not run under {words[0].split('=')[0]}")
            words = words[1:]
        if not words:
            continue
        name = os.path.basename(words[0])
        if name in ("cd", "pushd") and len(words) > 1:
            cwd = os.path.normpath(os.path.join(cwd, words[1]))
        elif name in SHELLS:
            body = words[words.index("-c") + 1:] if "-c" in words else (words[1:] if name == "eval" else [])
            for part in body[:1] if name != "eval" else [" ".join(body)]:
                judge(part, cwd, options, depth + 1)
        position = 0 if name == "curl" else next((k for k, w in enumerate(words) if os.path.basename(w) == "curl"), -1) if name in WRAPPERS else -1
        if position < 0:
            continue
        if name == "xargs":
            raise Refused("curl under xargs takes URLs the guard cannot see")
        runs_curl = True
        judge_curl(without_redirects(words[position + 1:], cwd), cwd, options)
    if runs_curl:
        for words in commands:
            if words and os.path.basename(words[0]) == "tee":
                for path in (w for w in words[1:] if not w.startswith("-")):
                    if not safe_path(path, cwd):
                        raise Refused(f"tee writes {path}")


def drop_text_heredocs(cmd):
    def keep_or_drop(m):
        line = cmd[cmd.rfind("\n", 0, m.start()) + 1:m.start()] + " " + m.group(3)
        feeds_shell = re.search(r"(?:^|[|;&(]\s*)(?:\S*/)?(?:ba|z)?sh\b(?!\s+-c)", line)
        return m.group(0) if feeds_shell else "<<" + m.group(2) + m.group(3) + "\n"
    return HEREDOC.sub(keep_or_drop, cmd.replace("\\\n", " "))


try:
    hook = json.loads(os.environ["HOOK_INPUT"])
    command = hook.get("tool_input", {}).get("command", "")
    if re.search(r"\bcurl\b", command):
        if os.path.exists(os.path.expanduser("~/.curlrc")):
            raise Refused("~/.curlrc exists and curl would read it")
        judge(drop_text_heredocs(command), hook.get("cwd") or os.getcwd(), curl_options())
except Refused as refusal:
    print(f"Blocked: {refusal}. {ALLOWED}", file=sys.stderr)
    sys.exit(2)
except Exception as error:  # a guard that crashes fails closed
    print(f"Blocked: the curl guard could not read this command ({error}). {ALLOWED}", file=sys.stderr)
    sys.exit(2)
PY
