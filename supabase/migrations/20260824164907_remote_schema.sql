alter default privileges for role "postgres" in schema "public" revoke all on sequences from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "service_role";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "service_role";

create table "public"."photos" (
  "id"         uuid                     not null default gen_random_uuid(),
  "filename"   character varying        not null,
  "angle"      character varying        not null,
  "created_at" timestamp with time zone not null default now(),
  "stat_id"    uuid                     not null default gen_random_uuid(),
  "user_id"    uuid,
  constraint "photos_pkey" primary key (id)
);

alter table "public"."photos"
  enable row level security;

create table "public"."plans" (
  "id"         uuid                     not null default gen_random_uuid(),
  "name"       character varying        not null,
  "duration"   numeric                  not null,
  "created_at" timestamp with time zone not null default now(),
  constraint "plans_pkey" primary key (id)
);

alter table "public"."plans"
  enable row level security;

create table "public"."profiles" (
  "id"         uuid                     not null,
  "created_at" timestamp with time zone not null default now(),
  "name"       character varying        not null,
  "role"       character varying        not null default '''mentee''::character varying'::character varying,
  "sex"        character varying        not null default 'female'::character varying,
  "height"     double precision         not null default '70'::double precision,
  constraint "profiles_pkey" primary key (id)
);

alter table "public"."profiles"
  enable row level security;

create table "public"."stats" (
  "id"         uuid                     not null default gen_random_uuid(),
  "user_id"    uuid                     not null,
  "weight"     double precision         not null,
  "neck"       double precision         not null,
  "bfp"        double precision         not null,
  "waist"      double precision         not null,
  "created_at" timestamp with time zone not null default now(),
  "hip"        double precision         not null,
  constraint "stats_pkey" primary key (id)
);

alter table "public"."stats"
  enable row level security;

create table "public"."subscriptions" (
  "id"         uuid                     not null default gen_random_uuid(),
  "plan_id"    uuid                     not null,
  "start_date" date                     not null,
  "end_date"   date                     not null,
  "created_at" timestamp with time zone not null default now(),
  "user_id"    uuid                     not null default gen_random_uuid(),
  constraint "subscriptions_pkey" primary key (id)
);

alter table "public"."subscriptions"
  enable row level security;

alter table "public"."photos"
  add constraint "photos_user_id_fkey" foreign key (user_id) references auth.users(id) on update restrict on delete cascade;

alter table "public"."profiles"
  add constraint "profiles_id_fkey" foreign key (id) references auth.users(id) on update restrict on delete cascade;

alter table "public"."photos"
  add constraint "photos_stat_id_fkey" foreign key (stat_id) references public.stats(id) on update restrict on delete cascade;

alter table "public"."stats"
  add constraint "stats_user_id_fkey" foreign key (user_id) references auth.users(id) on update restrict on delete cascade;

alter table "public"."subscriptions"
  add constraint "subscriptions_plan_id_fkey" foreign key (plan_id) references public.plans(id) on update restrict on delete cascade;

alter table "public"."subscriptions"
  add constraint "subscriptions_user_id_fkey" foreign key (user_id) references auth.users(id) on update restrict on delete cascade;

create policy "Enable insert for self" on "public"."photos"
  for insert
  to "authenticated"
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "Enable read for self" on "public"."photos"
  for select
  to "authenticated"
  using ((( select auth.uid() as uid) = user_id));

create policy "Enable read access for authenticated users" on "public"."plans"
  for select
  to "authenticated"
  using (true);

create policy "Enable read access for self" on "public"."profiles"
  for select
  to "authenticated"
  using ((( select auth.uid() as uid) = id));

create policy "Enable insert for self" on "public"."stats"
  for insert
  to "authenticated"
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "Enable read access for self" on "public"."stats"
  for select
  to "authenticated"
  using ((( select auth.uid() as uid) = user_id));

create policy "Enable read access for self" on "public"."subscriptions"
  for select
  to "authenticated"
  using ((( select auth.uid() as uid) = user_id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."photos" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."plans" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."profiles" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."stats" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."subscriptions" to "anon", "authenticated", "postgres", "service_role";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "anon";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "authenticated";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "service_role";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "anon";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "authenticated";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "service_role";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "anon";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "authenticated";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "service_role";

