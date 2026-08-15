-- Pin trigger-function name resolution to trusted schemas.
ALTER FUNCTION public.guard_project_plan() SET search_path = pg_catalog, public;
ALTER FUNCTION public.guard_agreement_revision() SET search_path = pg_catalog, public;
ALTER FUNCTION public.guard_agreement_practice() SET search_path = pg_catalog, public;
ALTER FUNCTION public.validate_plan_before_publish() SET search_path = pg_catalog, public;
ALTER FUNCTION public.validate_task_context() SET search_path = pg_catalog, public;
ALTER FUNCTION public.guard_closed_season_direct() SET search_path = pg_catalog, public;
ALTER FUNCTION public.guard_closed_season_task_child() SET search_path = pg_catalog, public;

-- Cover foreign keys used by joins and referential-integrity checks.
CREATE INDEX "audit_logs_actor_id_idx" ON public."audit_logs"("actor_id");
CREATE INDEX "evidence_created_by_id_idx" ON public."evidence"("created_by_id");
CREATE INDEX "performance_snapshots_sprint_id_idx" ON public."performance_snapshots"("sprint_id");
CREATE INDEX "season_plan_versions_created_by_id_idx" ON public."season_plan_versions"("created_by_id");
CREATE INDEX "tasks_created_by_id_idx" ON public."tasks"("created_by_id");
CREATE INDEX "tasks_season_plan_version_id_idx" ON public."tasks"("season_plan_version_id");
