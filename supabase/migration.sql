-- Ensures gen_random_uuid() (for the review links, FE-04) is guaranteed to exist.
create extension if not exists pgcrypto;

-- A status may ONLY be one of these three words. If you accidentally type
-- "klaar" instead of "afgerond" somewhere, the database will automatically reject it (TE-05).
create type public.feedback_status as enum (
  'open',
  'bezig',
  'afgerond'
);