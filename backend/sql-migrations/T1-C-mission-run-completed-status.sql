-- T1-C prerequisite: the live mission run enum omitted the completion state
-- even though the existing completion triggers already depend on it.
-- Apply this migration before T1-C-mission-settlement.sql. PostgreSQL requires
-- the new enum value to be committed before it can be used by another query.

ALTER TYPE public.run_status
  ADD VALUE IF NOT EXISTS 'completed' AFTER 'active';