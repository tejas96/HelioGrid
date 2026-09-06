#!/usr/bin/env python3
"""What do I design next?

Reads the screen register and prints the pending V1 screens in build order, with the
exact brief file to paste and the exact two lines to edit when you're done.

    python3 scripts/next-screen.py            # next 10 pending V1 screens
    python3 scripts/next-screen.py SHELL      # only the SHELL module
    python3 scripts/next-screen.py M06 40     # M06, up to 40 rows
    python3 scripts/next-screen.py all        # every pending V1 screen
    python3 scripts/next-screen.py v2         # the deferred V2 screens, for reference only

Columns are located by NAME from the register's own header row, never by position. When the
register gains a column, hard-coded indices silently read the wrong column as the status, so
every screen looks designed and the script reports "150 of 150 · nothing left to do". Reading
the header makes the next column addition a non-event.
"""
import re, sys, os, glob, collections

# Two dirnames: this script lives in scripts/, so the repo is its parent.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REG = os.path.join(ROOT, 'docs/prd/registers/screens.md')

# Build order, not register order. docs/start-here.md and docs/build-order.md carry the reasoning;
# the short version is that the studio is ported late, once the earlier blocks have settled
# the API and schema conventions it has to conform to.
BLOCKS = [
    ('1 · Shell + entry & tenant',          ['SHELL', 'M01']),
    ('2 · Billing & plans',                 ['M12']),
    ('3 · CRM & leads',                     ['M02']),
    ('4 · Projects',                        ['M08']),
    ('5 · Payments & collections',          ['M11']),
    ('6 · Sales execution, calling core + owner home', ['M07', 'M13']),
    ('7 · 3D Design Studio',                ['MS']),
    ('8 · Proposals + customer link',       ['M06', 'F5']),
]
_BY_MOD = {m: (i, name) for i, (name, mods) in enumerate(BLOCKS) for m in mods}
# SHELL-06 is the past-due banner. It is a shell surface but it belongs to the billing block —
# it exists to show a tenant its M12 state, and designing it apart from M12 would mean guessing
# what states it has to render.
_BY_SID = {'SCR-SHELL-06': (1, BLOCKS[1][0])}
# Modules that are wholly V2 have no place in the V1 build order, and saying "unmapped" implies
# something is broken. They are simply deferred.
_DEFERRED = (98, 'V2 · deferred, not in the V1 build order')


def block_of(sid):
    return _BY_SID.get(sid) or _BY_MOD.get(sid.split('-')[1], _DEFERRED)

args = list(sys.argv[1:])
module, limit, scope = None, 10, 'V1'
for a in args:
    if a.isdigit():
        limit = int(a)
    elif a.lower() == 'all':
        limit = 10 ** 6
    elif a.upper() in ('V1', 'V2'):
        scope = a.upper()
    else:
        module = a.upper()

# --- read the register's screen index, by column name ---------------------------------
rows, section, cols = [], '', None
for line in open(REG, encoding='utf-8'):
    h = re.match(r'^###\s+(.*)', line)
    if h:
        section = h.group(1).strip()
    if line.startswith('| SCR | Screen |'):
        cols = {name.strip(): i for i, name in enumerate(line.strip().strip('|').split('|'))}
        continue
    m = re.match(r'^\|\s*(SCR-[A-Z0-9]+-\d+)\s*\|', line)
    if not m or not cols:
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    if len(c) <= max(cols.values()):
        continue
    get = lambda k: c[cols[k]] if k in cols else ''
    rows.append({
        'sid': c[cols['SCR']],
        'name': re.sub(r'\*+', '', get('Screen')),
        'tier': get('Tier'),
        'nrows': get('Rows'),
        'brief': get('Brief').strip('`'),
        'v': get('V'),
        'status': get('UX status').lower(),
        'section': section,
    })

if not cols:
    sys.exit("could not find the screen-index header row in " + REG)
if 'V' not in cols:
    sys.exit("the register has no `V` column — the V1 scope lock is missing; see docs/build-order.md")

# --- where each screen's DESIGN line lives --------------------------------------------
design = {}
for fp in sorted(glob.glob(os.path.join(ROOT, 'docs', 'tasks', '*.md'))):
    # docs/tasks/README.md documents the task anatomy with a worked DESIGN line. Reading it would
    # point a real screen at the documentation instead of at its real task file.
    if os.path.basename(fp).lower() == 'readme.md':
        continue
    for i, line in enumerate(open(fp, encoding='utf-8'), 1):
        m = re.search(r'DESIGN:?\*{0,2}\s*(SCR-[A-Z0-9]+-\d+)\s*→', line)
        if m:
            design[m.group(1)] = (os.path.relpath(fp, ROOT), i)

reg_line = {}
for i, line in enumerate(open(REG, encoding='utf-8'), 1):
    m = re.match(r'^\|\s*(SCR-[A-Z0-9]+-\d+)\s*\|', line)
    if m:
        reg_line[m.group(1)] = i

# --- progress, within the locked scope --------------------------------------------------
scoped = [r for r in rows if r['v'] == scope]
done = sum(1 for r in scoped if r['status'] != 'pending')
pending = [r for r in scoped if r['status'] == 'pending']

other = 'V2' if scope == 'V1' else 'V1'
n_other = sum(1 for r in rows if r['v'] == other)

print(f"\n  {done} of {len(scoped)} {scope} screens designed · {len(pending)} to go"
      f"        ({n_other} {other} screens are out of scope and not counted)")

if scope == 'V2':
    print("  V2 is deferred scope. Nothing here is designed until V1 ships.")

by_block = collections.defaultdict(int)
for r in pending:
    by_block[block_of(r['sid'])] += 1
if by_block:
    print("  still pending: " + "  ".join(
        (f"{name.split(' · ')[0]}:{n}" if i < 90 else f"deferred:{n}")
        for (i, name), n in sorted(by_block.items())))

if module:
    pending = [r for r in pending if r['sid'].split('-')[1] == module]
    if not pending:
        print(f"\n  nothing pending in {module} within {scope}\n")
        sys.exit(0)

if not pending:
    print(f"\n  ✓ every {scope} screen is marked designed.\n")
    sys.exit(0)

# build order, then register order inside a block
pending.sort(key=lambda r: (block_of(r['sid'])[0], reg_line.get(r['sid'], 0)))

print()
shown = pending[:limit]
cur = None
for r in shown:
    blk = block_of(r['sid'])[1]
    if blk != cur:
        cur = blk
        print(f"  ── {cur}")
    print(f"    {r['sid']:<14} {r['name'][:42]:<44} {r['tier']}  {r['nrows']} rows")

nxt = shown[0]
d = design.get(nxt['sid'])
print(f"""
  ────────────────────────────────────────────────────────────────────────
  NEXT: {nxt['sid']} · {nxt['name']}

  1. paste  docs/ux/claude-design-context.md
  2. paste  {nxt['brief']}
  3. run the four messages (see docs/start-here.md)

  when approved, edit these two lines:
     {os.path.relpath(REG, ROOT)}:{reg_line.get(nxt['sid'], '?')}   pending → designed, — → <link>
     {d[0] + ':' + str(d[1]) if d else '(no DESIGN line found)'}   PENDING → <link>
  ────────────────────────────────────────────────────────────────────────
""")
if len(pending) > len(shown):
    print(f"  (+{len(pending)-len(shown)} more pending — pass a number, a module, or 'all')\n")
