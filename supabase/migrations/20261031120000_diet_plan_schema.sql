-- Diet Plan Feature: food_items, diet_plans, diet_plan_meals, diet_plan_food_items, diet_plan_logs, diet_plan_notes

-- ============================================================================
-- Enable pg_trgm extension for name search (if not already enabled)
-- ============================================================================
create extension if not exists pg_trgm;

-- ============================================================================
-- food_items (Global Food Database)
-- ============================================================================
create table "public"."food_items" (
  "id"                    uuid                     not null default gen_random_uuid(),
  "name"                  character varying        not null,
  "calories_per_100g"     integer                  not null,
  "protein_g_per_100g"    numeric(6,2)             not null,
  "carbs_g_per_100g"      numeric(6,2)             not null,
  "fat_g_per_100g"        numeric(6,2)             not null,
  "fiber_g_per_100g"      numeric(6,2)             not null,
  "source"                character varying        not null default 'custom',
  "usda_fdc_id"           integer,
  "created_by"            uuid,
  "created_at"            timestamp with time zone not null default now(),
  "updated_at"            timestamp with time zone not null default now(),
  constraint "food_items_pkey" primary key (id),
  constraint "food_items_name_key" unique (name),
  constraint "food_items_source_check" check (source in ('usda', 'custom'))
);

alter table "public"."food_items" enable row level security;

-- Indexes
create index "food_items_source_idx" on "public"."food_items" ("source");
create index "food_items_name_search_idx" on "public"."food_items" using gin ("name" gin_trgm_ops);

-- RLS Policies
create policy "food_items_select_all_authenticated"
  on "public"."food_items"
  for select
  to "authenticated"
  using (true);

create policy "food_items_insert_coach"
  on "public"."food_items"
  for insert
  to "authenticated"
  with check (
    (select role from public.profiles where id = auth.uid()) = 'coach'
  );

create policy "food_items_update_creator"
  on "public"."food_items"
  for update
  to "authenticated"
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "food_items_delete_creator"
  on "public"."food_items"
  for delete
  to "authenticated"
  using (auth.uid() = created_by);

-- ============================================================================
-- diet_plans
-- ============================================================================
create table "public"."diet_plans" (
  "id"          uuid                     not null default gen_random_uuid(),
  "mentee_id"   uuid                     not null,
  "coach_id"    uuid                     not null,
  "name"        character varying        not null,
  "start_date"  date                     not null,
  "end_date"    date                     not null,
  "notes"       text,
  "created_at"  timestamp with time zone not null default now(),
  "updated_at"  timestamp with time zone not null default now(),
  constraint "diet_plans_pkey" primary key (id),
  constraint "diet_plans_mentee_id_fkey" foreign key (mentee_id) references public.profiles(id) on delete cascade,
  constraint "diet_plans_coach_id_fkey" foreign key (coach_id) references public.profiles(id) on delete cascade,
  constraint "diet_plans_unique_mentee_start" unique (mentee_id, start_date),
  constraint "diet_plans_date_order" check (start_date <= end_date)
);

alter table "public"."diet_plans" enable row level security;

-- Indexes
create index "diet_plans_mentee_id_idx" on "public"."diet_plans" ("mentee_id");
create index "diet_plans_coach_id_idx" on "public"."diet_plans" ("coach_id");
create index "diet_plans_date_range_idx" on "public"."diet_plans" ("start_date", "end_date");

-- RLS Policies
create policy "diet_plans_coach_crud"
  on "public"."diet_plans"
  for all
  to "authenticated"
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "diet_plans_mentee_select"
  on "public"."diet_plans"
  for select
  to "authenticated"
  using (auth.uid() = mentee_id);

-- ============================================================================
-- diet_plan_meals
-- ============================================================================
create table "public"."diet_plan_meals" (
  "id"              uuid                     not null default gen_random_uuid(),
  "diet_plan_id"    uuid                     not null,
  "name"            character varying        not null,
  "display_order"   integer                  not null,
  "created_at"      timestamp with time zone not null default now(),
  constraint "diet_plan_meals_pkey" primary key (id),
  constraint "diet_plan_meals_diet_plan_id_fkey" foreign key (diet_plan_id) references public.diet_plans(id) on delete cascade,
  constraint "diet_plan_meals_unique_name_order" unique (diet_plan_id, name, display_order)
);

alter table "public"."diet_plan_meals" enable row level security;

-- Indexes
create index "diet_plan_meals_diet_plan_id_idx" on "public"."diet_plan_meals" ("diet_plan_id");

-- RLS Policies
create policy "diet_plan_meals_coach_crud"
  on "public"."diet_plan_meals"
  for all
  to "authenticated"
  using (
    exists (
      select 1 from public.diet_plans dp
      where dp.id = diet_plan_id and dp.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.diet_plans dp
      where dp.id = diet_plan_id and dp.coach_id = auth.uid()
    )
  );

create policy "diet_plan_meals_mentee_select"
  on "public"."diet_plan_meals"
  for select
  to "authenticated"
  using (
    exists (
      select 1 from public.diet_plans dp
      where dp.id = diet_plan_id and dp.mentee_id = auth.uid()
    )
  );

-- ============================================================================
-- diet_plan_food_items
-- ============================================================================
create table "public"."diet_plan_food_items" (
  "id"              uuid                     not null default gen_random_uuid(),
  "meal_id"         uuid                     not null,
  "food_item_id"    uuid                     not null,
  "quantity_g"      numeric(8,2)             not null,
  "calories"        integer                  not null,
  "protein_g"       numeric(6,2)             not null,
  "carbs_g"         numeric(6,2)             not null,
  "fat_g"           numeric(6,2)             not null,
  "fiber_g"         numeric(6,2)             not null,
  "display_order"   integer                  not null,
  "created_at"      timestamp with time zone not null default now(),
  constraint "diet_plan_food_items_pkey" primary key (id),
  constraint "diet_plan_food_items_meal_id_fkey" foreign key (meal_id) references public.diet_plan_meals(id) on delete cascade,
  constraint "diet_plan_food_items_food_item_id_fkey" foreign key (food_item_id) references public.food_items(id) on delete restrict,
  constraint "diet_plan_food_items_quantity_positive" check (quantity_g > 0)
);

alter table "public"."diet_plan_food_items" enable row level security;

-- Indexes
create index "diet_plan_food_items_meal_id_idx" on "public"."diet_plan_food_items" ("meal_id");
create index "diet_plan_food_items_food_item_id_idx" on "public"."diet_plan_food_items" ("food_item_id");

-- RLS Policies
create policy "diet_plan_food_items_coach_crud"
  on "public"."diet_plan_food_items"
  for all
  to "authenticated"
  using (
    exists (
      select 1 from public.diet_plan_meals dm
      join public.diet_plans dp on dp.id = dm.diet_plan_id
      where dm.id = meal_id and dp.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.diet_plan_meals dm
      join public.diet_plans dp on dp.id = dm.diet_plan_id
      where dm.id = meal_id and dp.coach_id = auth.uid()
    )
  );

create policy "diet_plan_food_items_mentee_select"
  on "public"."diet_plan_food_items"
  for select
  to "authenticated"
  using (
    exists (
      select 1 from public.diet_plan_meals dm
      join public.diet_plans dp on dp.id = dm.diet_plan_id
      where dm.id = meal_id and dp.mentee_id = auth.uid()
    )
  );

-- ============================================================================
-- diet_plan_logs (Mentee Consumption Tracking)
-- ============================================================================
create table "public"."diet_plan_logs" (
  "id"              uuid                     not null default gen_random_uuid(),
  "mentee_id"       uuid                     not null,
  "diet_plan_id"    uuid                     not null,
  "food_item_id"    uuid                     not null,
  "log_date"        date                     not null,
  "consumed"        boolean                  not null default false,
  "consumed_at"     timestamp with time zone,
  "created_at"      timestamp with time zone not null default now(),
  "updated_at"      timestamp with time zone not null default now(),
  constraint "diet_plan_logs_pkey" primary key (id),
  constraint "diet_plan_logs_mentee_id_fkey" foreign key (mentee_id) references public.profiles(id) on delete cascade,
  constraint "diet_plan_logs_diet_plan_id_fkey" foreign key (diet_plan_id) references public.diet_plans(id) on delete cascade,
  constraint "diet_plan_logs_food_item_id_fkey" foreign key (food_item_id) references public.diet_plan_food_items(id) on delete cascade,
  constraint "diet_plan_logs_unique_mentee_item_date" unique (mentee_id, food_item_id, log_date)
);

alter table "public"."diet_plan_logs" enable row level security;

-- Indexes
create index "diet_plan_logs_mentee_id_idx" on "public"."diet_plan_logs" ("mentee_id");
create index "diet_plan_logs_diet_plan_id_idx" on "public"."diet_plan_logs" ("diet_plan_id");
create index "diet_plan_logs_log_date_idx" on "public"."diet_plan_logs" ("log_date");

-- RLS Policies
create policy "diet_plan_logs_mentee_crud"
  on "public"."diet_plan_logs"
  for all
  to "authenticated"
  using (auth.uid() = mentee_id)
  with check (auth.uid() = mentee_id);

create policy "diet_plan_logs_coach_select"
  on "public"."diet_plan_logs"
  for select
  to "authenticated"
  using (
    exists (
      select 1 from public.diet_plans dp
      where dp.id = diet_plan_id and dp.coach_id = auth.uid()
    )
  );

-- ============================================================================
-- diet_plan_notes (Mentee Daily Notes)
-- ============================================================================
create table "public"."diet_plan_notes" (
  "id"           uuid                     not null default gen_random_uuid(),
  "mentee_id"    uuid                     not null,
  "diet_plan_id" uuid                     not null,
  "log_date"     date                     not null,
  "notes"        text,
  "created_at"   timestamp with time zone not null default now(),
  "updated_at"   timestamp with time zone not null default now(),
  constraint "diet_plan_notes_pkey" primary key (id),
  constraint "diet_plan_notes_mentee_id_fkey" foreign key (mentee_id) references public.profiles(id) on delete cascade,
  constraint "diet_plan_notes_diet_plan_id_fkey" foreign key (diet_plan_id) references public.diet_plans(id) on delete cascade,
  constraint "diet_plan_notes_unique_mentee_plan_date" unique (mentee_id, diet_plan_id, log_date)
);

alter table "public"."diet_plan_notes" enable row level security;

-- Indexes
create index "diet_plan_notes_mentee_id_idx" on "public"."diet_plan_notes" ("mentee_id");
create index "diet_plan_notes_diet_plan_id_idx" on "public"."diet_plan_notes" ("diet_plan_id");
create index "diet_plan_notes_log_date_idx" on "public"."diet_plan_notes" ("log_date");

-- RLS Policies
create policy "diet_plan_notes_mentee_crud"
  on "public"."diet_plan_notes"
  for all
  to "authenticated"
  using (auth.uid() = mentee_id)
  with check (auth.uid() = mentee_id);

create policy "diet_plan_notes_coach_select"
  on "public"."diet_plan_notes"
  for select
  to "authenticated"
  using (
    exists (
      select 1 from public.diet_plans dp
      where dp.id = diet_plan_id and dp.coach_id = auth.uid()
    )
  );

-- ============================================================================
-- updated_at triggers (reusable function)
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger "food_items_updated_at"
  before update on "public"."food_items"
  for each row execute function public.set_updated_at();

create trigger "diet_plans_updated_at"
  before update on "public"."diet_plans"
  for each row execute function public.set_updated_at();

create trigger "diet_plan_logs_updated_at"
  before update on "public"."diet_plan_logs"
  for each row execute function public.set_updated_at();

create trigger "diet_plan_notes_updated_at"
  before update on "public"."diet_plan_notes"
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Grants (following existing pattern)
-- ============================================================================
grant select, insert, update, delete on "public"."food_items" to "anon", "authenticated", "postgres", "service_role";
grant select, insert, update, delete on "public"."diet_plans" to "anon", "authenticated", "postgres", "service_role";
grant select, insert, update, delete on "public"."diet_plan_meals" to "anon", "authenticated", "postgres", "service_role";
grant select, insert, update, delete on "public"."diet_plan_food_items" to "anon", "authenticated", "postgres", "service_role";
grant select, insert, update, delete on "public"."diet_plan_logs" to "anon", "authenticated", "postgres", "service_role";
grant select, insert, update, delete on "public"."diet_plan_notes" to "anon", "authenticated", "postgres", "service_role";

-- ============================================================================
-- USDA Seed Data (Common Raw Foods)
-- ============================================================================
-- Protein sources
insert into "public"."food_items" ("name", "calories_per_100g", "protein_g_per_100g", "carbs_g_per_100g", "fat_g_per_100g", "fiber_g_per_100g", "source", "usda_fdc_id") values
  ('Chicken breast, raw', 165, 31.0, 0.0, 3.6, 0.0, 'usda', 171077),
  ('Chicken thigh, raw', 209, 18.0, 0.0, 15.5, 0.0, 'usda', 171078),
  ('Egg, whole, raw', 155, 13.0, 1.1, 11.0, 0.0, 'usda', 171292),
  ('Egg white, raw', 52, 11.0, 0.7, 0.2, 0.0, 'usda', 174760),
  ('Salmon, raw', 208, 20.0, 0.0, 13.0, 0.0, 'usda', 172976),
  ('Tuna, raw', 144, 23.0, 0.0, 4.9, 0.0, 'usda', 172974),
  ('Paneer (Indian cottage cheese)', 265, 18.0, 6.0, 20.0, 0.0, 'usda', 170886),
  ('Tofu, firm, raw', 144, 17.0, 3.0, 8.7, 2.3, 'usda', 173513),
  ('Whey protein isolate', 370, 90.0, 3.0, 1.0, 0.0, 'custom', null),
  ('Greek yogurt, plain, nonfat', 59, 10.0, 3.6, 0.4, 0.0, 'usda', 170886);

-- Carbohydrate sources
insert into "public"."food_items" ("name", "calories_per_100g", "protein_g_per_100g", "carbs_g_per_100g", "fat_g_per_100g", "fiber_g_per_100g", "source", "usda_fdc_id") values
  ('White rice, raw', 365, 7.1, 80.0, 0.7, 1.3, 'usda', 169888),
  ('Brown rice, raw', 370, 7.9, 77.0, 2.9, 3.5, 'usda', 169888),
  ('Oats, raw', 389, 16.9, 66.3, 6.9, 10.6, 'usda', 170302),
  ('Quinoa, raw', 368, 14.1, 64.2, 6.1, 7.0, 'usda', 168915),
  ('Sweet potato, raw', 86, 1.6, 20.0, 0.1, 3.0, 'usda', 168347),
  ('Potato, raw', 77, 2.0, 17.0, 0.1, 2.2, 'usda', 167155),
  ('Whole wheat flour (atta)', 340, 13.2, 72.0, 2.5, 10.7, 'usda', 170044),
  ('Banana, raw', 89, 1.1, 23.0, 0.3, 2.6, 'usda', 173944),
  ('Apple, raw', 52, 0.3, 14.0, 0.2, 2.4, 'usda', 173944),
  ('Mango, raw', 60, 0.8, 15.0, 0.4, 1.6, 'usda', 173944);

-- Legumes & Pulses (Indian staples)
insert into "public"."food_items" ("name", "calories_per_100g", "protein_g_per_100g", "carbs_g_per_100g", "fat_g_per_100g", "fiber_g_per_100g", "source", "usda_fdc_id") values
  ('Toor dal (pigeon peas), raw', 343, 22.0, 63.0, 1.5, 15.0, 'usda', 167764),
  ('Moong dal (green gram), raw', 347, 24.0, 59.0, 1.2, 16.3, 'usda', 167764),
  ('Chana dal (bengal gram), raw', 360, 20.0, 60.0, 5.0, 18.0, 'usda', 167764),
  ('Rajma (kidney beans), raw', 333, 24.0, 60.0, 0.8, 25.0, 'usda', 167764),
  ('Chickpeas (kabuli chana), raw', 364, 19.0, 61.0, 6.0, 17.0, 'usda', 167764),
  ('Black chana, raw', 360, 20.0, 58.0, 5.0, 18.0, 'usda', 167764);

-- Vegetables
insert into "public"."food_items" ("name", "calories_per_100g", "protein_g_per_100g", "carbs_g_per_100g", "fat_g_per_100g", "fiber_g_per_100g", "source", "usda_fdc_id") values
  ('Spinach, raw', 23, 2.9, 3.6, 0.4, 2.2, 'usda', 168526),
  ('Broccoli, raw', 34, 2.8, 6.6, 0.4, 2.6, 'usda', 167393),
  ('Cauliflower, raw', 25, 1.9, 5.0, 0.3, 2.0, 'usda', 167393),
  ('Carrot, raw', 41, 0.9, 9.6, 0.2, 2.8, 'usda', 168526),
  ('Tomato, raw', 18, 0.9, 3.9, 0.2, 1.2, 'usda', 170533),
  ('Cucumber, raw', 15, 0.7, 3.6, 0.1, 0.5, 'usda', 168526),
  ('Bell pepper, raw', 31, 1.0, 6.0, 0.3, 2.1, 'usda', 168526),
  ('Onion, raw', 40, 1.1, 9.3, 0.1, 1.7, 'usda', 168526),
  ('Garlic, raw', 149, 6.4, 33.0, 0.5, 2.1, 'usda', 168526),
  ('Ginger, raw', 80, 1.8, 18.0, 0.8, 2.0, 'usda', 168526);

-- Nuts & Seeds
insert into "public"."food_items" ("name", "calories_per_100g", "protein_g_per_100g", "carbs_g_per_100g", "fat_g_per_100g", "fiber_g_per_100g", "source", "usda_fdc_id") values
  ('Almonds, raw', 579, 21.0, 22.0, 50.0, 12.5, 'usda', 170044),
  ('Walnuts, raw', 654, 15.0, 14.0, 65.0, 6.7, 'usda', 170044),
  ('Peanuts, raw', 567, 26.0, 16.0, 49.0, 8.5, 'usda', 170044),
  ('Chia seeds', 486, 17.0, 42.0, 31.0, 34.0, 'usda', 170044),
  ('Flax seeds', 534, 18.0, 29.0, 42.0, 27.0, 'usda', 170044),
  ('Pumpkin seeds', 446, 19.0, 54.0, 19.0, 18.0, 'usda', 170044);

-- Fats & Oils
insert into "public"."food_items" ("name", "calories_per_100g", "protein_g_per_100g", "carbs_g_per_100g", "fat_g_per_100g", "fiber_g_per_100g", "source", "usda_fdc_id") values
  ('Ghee', 900, 0.0, 0.0, 100.0, 0.0, 'usda', 170044),
  ('Olive oil', 884, 0.0, 0.0, 100.0, 0.0, 'usda', 170044),
  ('Coconut oil', 892, 0.0, 0.0, 100.0, 0.0, 'usda', 170044),
  ('Butter', 717, 0.9, 0.1, 81.0, 0.0, 'usda', 170044);

-- Dairy
insert into "public"."food_items" ("name", "calories_per_100g", "protein_g_per_100g", "carbs_g_per_100g", "fat_g_per_100g", "fiber_g_per_100g", "source", "usda_fdc_id") values
  ('Milk, whole', 61, 3.3, 4.8, 3.3, 0.0, 'usda', 170886),
  ('Milk, skim', 34, 3.4, 5.0, 0.1, 0.0, 'usda', 170886),
  ('Curd/Yogurt, whole milk', 61, 3.5, 4.7, 3.3, 0.0, 'usda', 170886);

-- Common Indian branded / packaged (custom entries coach can use)
insert into "public"."food_items" ("name", "calories_per_100g", "protein_g_per_100g", "carbs_g_per_100g", "fat_g_per_100g", "fiber_g_per_100g", "source", "usda_fdc_id") values
  ('Rite Bite Max Protein Daily Bar', 358, 20.0, 38.0, 12.0, 8.0, 'custom', null),
  ('Yogabar Protein Bar', 360, 21.0, 35.0, 13.0, 7.0, 'custom', null),
  ('The Whole Truth Protein Bar', 340, 22.0, 30.0, 10.0, 9.0, 'custom', null);