-- Keep Prisma's migration history readable, but never writable, by the backend role.
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."_prisma_migrations" FROM prisma;
GRANT SELECT ON TABLE public."_prisma_migrations" TO prisma;

DROP POLICY IF EXISTS prisma_backend_access ON public."_prisma_migrations";
CREATE POLICY prisma_migration_history_read
  ON public."_prisma_migrations"
  FOR SELECT
  TO prisma
  USING (true);
