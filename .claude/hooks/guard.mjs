import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  COMMIT,
  commitRefusals,
  FAST_CHECK,
  FULL_GATE,
  forbiddenChanges,
  GATE_RUNS_ALLOWED,
  GUARD_RECORD,
  GUARD_TAMPER,
  helperRefusal,
  INVARIANTS,
  isReadOnly,
  outputPassed,
  teardownDifferences,
  verdictOf,
} from './guard-rules.mjs';
import {
  differingPaths,
  fingerprints,
  helperSnapshot,
  isPushed,
  liveState,
  readLog,
  record,
  repoOf,
  startState,
  TASK_BRANCH,
} from './guard-state.mjs';

/**
 * The task guard (`.claude/settings.json` hooks): Claude Code runs it on every Bash, Edit and Write
 * call, when a helper stops and when Main ends a turn. On a `feat/T-…` branch it refuses what a
 * written rule alone could not hold — a helper writing the repository, a third full gate, a commit
 * before review, QA, the gate and teardown are done — and records what helpers reported. Its
 * record in `.qa/guard/` is the owner's to clear, never the agent's. When it cannot read its own
 * state it refuses a gate, a helper's write and a commit, and lets everything else run.
 */
let input = {};
const answer = (value) => process.stdout.write(JSON.stringify(value));
const deny = (reason) =>
  answer({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  });

try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  guard();
} catch (error) {
  const command = input.tool_input?.command ?? '';
  const mustHold =
    COMMIT.test(command) || FULL_GATE.test(command) || (isHelper() && !isReadOnly(command));
  if (input.hook_event_name === 'PreToolUse' && mustHold) {
    deny(
      `the task guard could not read the branch's state (${error?.message ?? error}); this waits until it can`,
    );
  }
}

function isHelper() {
  return typeof input.agent_id === 'string' && input.agent_id !== '';
}

function guard() {
  const command = input.tool_input?.command ?? '';
  const path = input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? '';
  const touchesRecord = GUARD_TAMPER.test(command) || GUARD_RECORD.test(path);
  if (input.hook_event_name === 'PreToolUse' && touchesRecord) {
    deny(
      '.qa/guard/ is the task guard’s record — only the owner clears it, from their own terminal',
    );
    return;
  }
  const repo = repoOf(input.cwd ?? process.cwd());
  if (repo === undefined || !TASK_BRANCH.test(repo.branch)) return;
  const { root, branch } = repo;
  const event = input.hook_event_name;
  if (input.tool_name === 'Bash' && event === 'PreToolUse') beforeCommand(root, branch, command);
  if (input.tool_name === 'Bash' && event === 'PostToolUse') afterCommand(root, branch, command);
  if (event === 'SubagentStop') onHelperStop(root, branch);
  if (event === 'Stop') onStop(root, branch);
}

function beforeCommand(root, branch, command) {
  if (!isHelper()) startState(root, branch);
  const refused = isHelper() ? helperRefusal(command) : undefined;
  if (refused !== undefined) {
    deny(
      `a helper never runs \`${refused}\`: it reads, measures and reports (.claude/agents/${input.agent_type}.md)`,
    );
    return;
  }
  if (FULL_GATE.test(command) && !admitGate(root, branch)) return;
  if (isHelper() && !isReadOnly(command)) {
    const before = [...helperSnapshot(root)];
    writeFileSync(pendingFile(root), JSON.stringify({ command: command.slice(0, 120), before }));
  }
  if (!isHelper() && COMMIT.test(command)) refuseCommit(root, branch);
}

/** Counts a full gate, refusing the third (`.claude/agents/evaluator.md`). */
function admitGate(root, branch) {
  const runs = readLog(root, branch).filter((e) => e.kind === 'gate-start').length;
  if (runs >= GATE_RUNS_ALLOWED) {
    deny(
      `this branch has had ${runs} full-gate runs; a third is never run — stop for the owner (.claude/agents/evaluator.md)`,
    );
    return false;
  }
  record(root, branch, { kind: 'gate-start' });
  return true;
}

function refuseCommit(root, branch) {
  const refusals = commitRefusals({
    log: readLog(root, branch),
    now: fingerprints(root),
    live: liveState(root),
    start: startState(root, branch),
    pushed: isPushed(root, branch),
  });
  if (refusals.length > 0) deny(`the task guard refuses this commit:\n- ${refusals.join('\n- ')}`);
}

function afterCommand(root, branch, command) {
  const pending = pendingFile(root);
  if (isHelper() && existsSync(pending)) compareSince(root, branch, pending);
  const check = checkRun(command);
  if (check === undefined) return;
  const response = input.tool_response;
  const output =
    typeof response === 'string'
      ? response
      : `${response?.stdout ?? ''}\n${response?.stderr ?? ''}`;
  const passed = outputPassed(
    command,
    output,
    response?.exitCode,
    input.tool_input?.run_in_background,
  );
  record(root, branch, { kind: 'ran', check, passed, ...fingerprints(root) });
}

function checkRun(command) {
  if (FULL_GATE.test(command)) return 'gate';
  if (INVARIANTS.test(command)) return 'invariants';
  if (FAST_CHECK.test(command) && !isHelper()) return 'check';
  return undefined;
}

/** A helper's command is compared when it returns, or — when it failed and no PostToolUse came — when the helper stops. */
function compareSince(root, branch, pending) {
  const { command, before } = JSON.parse(readFileSync(pending, 'utf8'));
  rmSync(pending);
  const changed = differingPaths(new Map(before), helperSnapshot(root));
  const paths = forbiddenChanges(changed, input.agent_type, command);
  if (paths.length > 0) {
    record(root, branch, { kind: 'violation', agent: input.agent_type, command, paths });
  }
}

function onHelperStop(root, branch) {
  const dir = join(root, '.qa', 'guard');
  const prefix = `pending-${input.agent_id}-`;
  const leftOver = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith(prefix)) : [];
  for (const file of leftOver) compareSince(root, branch, join(dir, file));
  const message = input.last_assistant_message ?? lastMessageIn(input.agent_transcript_path);
  record(root, branch, {
    kind: 'helper',
    agent: input.agent_type ?? 'unknown',
    verdict: verdictOf(message),
    reviewed: fingerprints(root).reviewed,
  });
}

function pendingFile(root) {
  const dir = join(root, '.qa', 'guard');
  mkdirSync(dir, { recursive: true });
  return join(dir, `pending-${input.agent_id}-${input.tool_use_id ?? 'call'}.json`);
}

/** A `Teardown:` report is blocked once while anything the task started still runs; the commit refusal is the hold. */
function onStop(root, branch) {
  if (input.stop_hook_active === true) return;
  const message = input.last_assistant_message ?? lastMessageIn(input.transcript_path);
  if (!/^Teardown:/m.test(message)) return;
  const differences = teardownDifferences(liveState(root), startState(root, branch));
  if (differences.length > 0) {
    answer({ decision: 'block', reason: `Teardown is not done:\n- ${differences.join('\n- ')}` });
  }
}

function lastMessageIn(transcript) {
  try {
    const lines = readFileSync(transcript, 'utf8').trim().split('\n').reverse();
    for (const line of lines) {
      const entry = JSON.parse(line);
      if (entry.type !== 'assistant') continue;
      const text = (entry.message?.content ?? [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
      if (text !== '') return text;
    }
  } catch {
    // an unreadable transcript reads as no message: a helper's verdict is then NONE, which a commit refuses
  }
  return '';
}
