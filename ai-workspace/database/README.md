# Database Documentation

This folder contains structured documentation of the Supabase database schema, policies, and storage configuration for the Apex Reps project.

## Structure

| File               | Purpose                                                             |
| ------------------ | ------------------------------------------------------------------- |
| `tables.md`        | Complete table schemas with columns, constraints, and relationships |
| `rls-policies.md`  | Row Level Security policies per table                               |
| `storage.md`       | Storage bucket configuration and policies                           |
| `migrations.md`    | Migration history and reference                                     |
| `relationships.md` | Entity relationship diagram and foreign key references              |

## Quick Reference

- **Database:** PostgreSQL (Supabase)
- **Schema:** `public`
- **All tables:** RLS enabled
- **Auth:** Integrated with `auth.users` via foreign keys
- **Storage:** Private bucket `progress_photos` with signed URL access
