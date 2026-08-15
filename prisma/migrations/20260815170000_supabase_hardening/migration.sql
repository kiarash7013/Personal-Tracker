DO $$
DECLARE
  application_table text;
BEGIN
  FOREACH application_table IN ARRAY ARRAY[
    'users',
    'seasons',
    'season_members',
    'season_plan_versions',
    'projects',
    'project_plans',
    'agreements',
    'agreement_revisions',
    'work_practices',
    'agreement_practices',
    'sprints',
    'tasks',
    'task_practices',
    'evidence',
    'task_agreement_matches',
    'performance_setting_versions',
    'performance_snapshots',
    'snapshot_metric_details',
    'audit_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', application_table);
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO prisma',
      application_table
    );
    EXECUTE format(
      'CREATE POLICY prisma_backend_access ON public.%I FOR ALL TO prisma USING (true) WITH CHECK (true)',
      application_table
    );
  END LOOP;
END;
$$;
