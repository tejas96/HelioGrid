# Task archive

A shipped part's `#### Part <x> · RFC` body and `#### Runtime` ledger move here, unchanged, in
the commit that turns its row `shipped` (`docs/tasks/README.md`, Task anatomy). One file per task,
`<task id>.md`, one `## <task id> · part <x>` heading per part. No `### T-` heading and no
`**Status:**` line lives here: the `deferred-rows` check reads those as tasks.
