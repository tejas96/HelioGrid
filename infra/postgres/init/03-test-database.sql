-- The test database. Runs after 02-databases.sql on an empty data directory (first start, after
-- `pnpm infra:reset`); on an existing volume it is applied ONCE by hand, as infra/README.md says.
-- CI names 01 and 02 by file and never runs this: its lane has one database, heliogrid_ci.
--
-- SAME container, SEPARATE database: `/task` QA, local api tests and the invariants run here, and
-- heliogrid_dev keeps only the owner's own development data.
-- vitest.config.mts skips the api tests off CI unless both URLs name heliogrid_test, and throws on
-- heliogrid_dev whenever they are collected. Switching is the database name in DATABASE_URL and
-- DATABASE_ADMIN_URL in .env.local, then an api restart. No data is copied.
CREATE DATABASE heliogrid_test;

\connect heliogrid_test

-- The same connect-level privileges 02-databases.sql grants on the application database; the
-- table grants, policies and extensions remain each migration's (Law 9).
GRANT CONNECT ON DATABASE heliogrid_test TO app_runtime, app_admin, qa_readonly;
GRANT USAGE   ON SCHEMA   public         TO app_runtime, app_admin, qa_readonly;
GRANT CREATE  ON SCHEMA   public         TO app_admin;
