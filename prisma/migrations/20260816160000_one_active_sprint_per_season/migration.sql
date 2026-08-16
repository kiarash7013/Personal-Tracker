-- Prevent concurrent writes from activating more than one sprint in a season.
CREATE UNIQUE INDEX "sprints_one_active_per_season_idx"
ON "sprints" ("season_id")
WHERE "status" = 'ACTIVE';
