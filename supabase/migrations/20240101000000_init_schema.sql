-- ─────────────────────────────────────────────────────────────────────────────
-- Itinera – Initial Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- SHARED: updated_at trigger function
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  currency     text not null default 'USD',
  timezone     text not null default 'UTC',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIPS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  destination text not null,
  start_date  date not null,
  end_date    date not null,
  timezone    text not null default 'UTC',
  currency    text not null default 'USD',
  cover_url   text,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint valid_trip_dates check (end_date >= start_date)
);

create trigger set_trips_updated_at before update on public.trips
  for each row execute procedure public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIP MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
create type if not exists public.member_role as enum ('owner', 'editor', 'viewer');

create table if not exists public.trip_members (
  id         uuid primary key default uuid_generate_v4(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.member_role not null default 'viewer',
  invited_by uuid references auth.users(id),
  joined_at  timestamptz not null default now(),
  unique (trip_id, user_id)
);

create index if not exists idx_trip_members_trip_id on public.trip_members(trip_id);
create index if not exists idx_trip_members_user_id on public.trip_members(user_id);

-- Auto-add creator as owner when trip is created
create or replace function public.handle_new_trip()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (trip_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_trip_created on public.trips;
create trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_new_trip();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIP INVITATIONS
-- ─────────────────────────────────────────────────────────────────────────────
create type if not exists public.invite_status as enum ('pending', 'accepted', 'declined', 'expired');

create table if not exists public.trip_invitations (
  id            uuid primary key default uuid_generate_v4(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  invited_email text not null,
  role          public.member_role not null default 'editor',
  invited_by    uuid not null references auth.users(id),
  token         text not null unique default encode(gen_random_bytes(32), 'hex'),
  status        public.invite_status not null default 'pending',
  expires_at    timestamptz not null default (now() + interval '7 days'),
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIP DAYS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.trip_days (
  id       uuid primary key default uuid_generate_v4(),
  trip_id  uuid not null references public.trips(id) on delete cascade,
  day_date date not null,
  notes    text,
  unique (trip_id, day_date)
);

create index if not exists idx_trip_days_trip_id on public.trip_days(trip_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ITINERARY ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
create type if not exists public.item_type as enum ('flight', 'hotel', 'activity', 'transport', 'custom');

create table if not exists public.itinerary_items (
  id           uuid primary key default uuid_generate_v4(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  trip_day_id  uuid references public.trip_days(id) on delete set null,
  day_date     date not null,
  type         public.item_type not null default 'custom',
  title        text not null,
  start_time   time,
  end_time     time,
  location     text,
  notes        text,
  is_completed boolean not null default false,
  sort_order   integer not null default 0,
  created_by   uuid not null references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_items_trip_id  on public.itinerary_items(trip_id);
create index if not exists idx_items_day_date on public.itinerary_items(trip_id, day_date);

create trigger set_items_updated_at before update on public.itinerary_items
  for each row execute procedure public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- ACTIONS
-- ─────────────────────────────────────────────────────────────────────────────
create type if not exists public.action_status as enum ('pending', 'completed');

create table if not exists public.actions (
  id                  uuid primary key default uuid_generate_v4(),
  trip_id             uuid not null references public.trips(id) on delete cascade,
  itinerary_item_id   uuid references public.itinerary_items(id) on delete set null,
  title               text not null,
  notes               text,
  status              public.action_status not null default 'pending',
  due_date            date,
  assigned_to         uuid references auth.users(id),
  created_by          uuid not null references auth.users(id),
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_actions_trip_id on public.actions(trip_id);
create index if not exists idx_actions_status  on public.actions(trip_id, status);

create trigger set_actions_updated_at before update on public.actions
  for each row execute procedure public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────────────────────────────────────
create type if not exists public.expense_category as enum (
  'accommodation', 'food', 'transport', 'activities',
  'shopping', 'health', 'communication', 'other'
);

create table if not exists public.expenses (
  id                  uuid primary key default uuid_generate_v4(),
  trip_id             uuid not null references public.trips(id) on delete cascade,
  itinerary_item_id   uuid references public.itinerary_items(id) on delete set null,
  title               text not null,
  amount              numeric(12, 2) not null check (amount >= 0),
  currency            text not null,
  category            public.expense_category not null default 'other',
  paid_by             uuid not null references auth.users(id),
  expense_date        date not null default current_date,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_expenses_trip_id on public.expenses(trip_id);

create trigger set_expenses_updated_at before update on public.expenses
  for each row execute procedure public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────────────────────────────────────────
create type if not exists public.booking_type as enum ('flight', 'hotel', 'car', 'activity', 'other');

create table if not exists public.bookings (
  id                  uuid primary key default uuid_generate_v4(),
  trip_id             uuid not null references public.trips(id) on delete cascade,
  itinerary_item_id   uuid references public.itinerary_items(id) on delete set null,
  type                public.booking_type not null default 'other',
  title               text not null,
  confirmation_code   text,
  provider            text,
  booking_date        date,
  check_in            timestamptz,
  check_out           timestamptz,
  notes               text,
  attachment_url      text,
  created_by          uuid not null references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_bookings_trip_id on public.bookings(trip_id);

create trigger set_bookings_updated_at before update on public.bookings
  for each row execute procedure public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles          enable row level security;
alter table public.trips             enable row level security;
alter table public.trip_members      enable row level security;
alter table public.trip_invitations  enable row level security;
alter table public.trip_days         enable row level security;
alter table public.itinerary_items   enable row level security;
alter table public.actions           enable row level security;
alter table public.expenses          enable row level security;
alter table public.bookings          enable row level security;

-- Helper functions
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

create or replace function public.trip_member_role(p_trip_id uuid)
returns public.member_role language sql security definer stable as $$
  select role from public.trip_members
  where trip_id = p_trip_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_write_trip(p_trip_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

-- PROFILES policies
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select using (id = auth.uid());

drop policy if exists "Users can read co-member profiles" on public.profiles;
create policy "Users can read co-member profiles"
  on public.profiles for select using (
    exists (
      select 1 from public.trip_members tm1
      join public.trip_members tm2 on tm1.trip_id = tm2.trip_id
      where tm1.user_id = auth.uid() and tm2.user_id = profiles.id
    )
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (id = auth.uid());

-- TRIPS policies
drop policy if exists "Members can view trip" on public.trips;
create policy "Members can view trip"
  on public.trips for select using (public.is_trip_member(id));

drop policy if exists "Authenticated users can create trips" on public.trips;
create policy "Authenticated users can create trips"
  on public.trips for insert with check (auth.uid() = created_by);

drop policy if exists "Owners and editors can update trip" on public.trips;
create policy "Owners and editors can update trip"
  on public.trips for update using (public.can_write_trip(id));

drop policy if exists "Only owners can delete trip" on public.trips;
create policy "Only owners can delete trip"
  on public.trips for delete using (public.trip_member_role(id) = 'owner');

-- TRIP MEMBERS policies
drop policy if exists "Members can view trip members" on public.trip_members;
create policy "Members can view trip members"
  on public.trip_members for select using (public.is_trip_member(trip_id));

drop policy if exists "Owners can insert members" on public.trip_members;
create policy "Owners can insert members"
  on public.trip_members for insert with check (public.trip_member_role(trip_id) = 'owner');

drop policy if exists "Owners can update member roles" on public.trip_members;
create policy "Owners can update member roles"
  on public.trip_members for update using (public.trip_member_role(trip_id) = 'owner');

drop policy if exists "Owners can remove members" on public.trip_members;
create policy "Owners can remove members"
  on public.trip_members for delete using (
    public.trip_member_role(trip_id) = 'owner' or user_id = auth.uid()
  );

-- TRIP INVITATIONS policies
drop policy if exists "Owners can manage invitations" on public.trip_invitations;
create policy "Owners can manage invitations"
  on public.trip_invitations for all using (public.trip_member_role(trip_id) = 'owner');

-- TRIP DAYS policies
drop policy if exists "Members can read trip_days" on public.trip_days;
create policy "Members can read trip_days"
  on public.trip_days for select using (public.is_trip_member(trip_id));

drop policy if exists "Editors can write trip_days" on public.trip_days;
create policy "Editors can write trip_days"
  on public.trip_days for insert with check (public.can_write_trip(trip_id));

drop policy if exists "Editors can update trip_days" on public.trip_days;
create policy "Editors can update trip_days"
  on public.trip_days for update using (public.can_write_trip(trip_id));

drop policy if exists "Editors can delete trip_days" on public.trip_days;
create policy "Editors can delete trip_days"
  on public.trip_days for delete using (public.can_write_trip(trip_id));

-- ITINERARY ITEMS policies
drop policy if exists "Members can read itinerary_items" on public.itinerary_items;
create policy "Members can read itinerary_items"
  on public.itinerary_items for select using (public.is_trip_member(trip_id));

drop policy if exists "Editors can insert itinerary_items" on public.itinerary_items;
create policy "Editors can insert itinerary_items"
  on public.itinerary_items for insert with check (public.can_write_trip(trip_id));

drop policy if exists "Editors can update itinerary_items" on public.itinerary_items;
create policy "Editors can update itinerary_items"
  on public.itinerary_items for update using (public.can_write_trip(trip_id));

drop policy if exists "Editors can delete itinerary_items" on public.itinerary_items;
create policy "Editors can delete itinerary_items"
  on public.itinerary_items for delete using (public.can_write_trip(trip_id));

-- ACTIONS policies
drop policy if exists "Members can read actions" on public.actions;
create policy "Members can read actions"
  on public.actions for select using (public.is_trip_member(trip_id));

drop policy if exists "Editors can insert actions" on public.actions;
create policy "Editors can insert actions"
  on public.actions for insert with check (public.can_write_trip(trip_id));

drop policy if exists "Editors can update actions" on public.actions;
create policy "Editors can update actions"
  on public.actions for update using (public.can_write_trip(trip_id));

drop policy if exists "Editors can delete actions" on public.actions;
create policy "Editors can delete actions"
  on public.actions for delete using (public.can_write_trip(trip_id));

-- EXPENSES policies
drop policy if exists "Members can read expenses" on public.expenses;
create policy "Members can read expenses"
  on public.expenses for select using (public.is_trip_member(trip_id));

drop policy if exists "Editors can insert expenses" on public.expenses;
create policy "Editors can insert expenses"
  on public.expenses for insert with check (public.can_write_trip(trip_id));

drop policy if exists "Editors can update expenses" on public.expenses;
create policy "Editors can update expenses"
  on public.expenses for update using (public.can_write_trip(trip_id));

drop policy if exists "Editors can delete expenses" on public.expenses;
create policy "Editors can delete expenses"
  on public.expenses for delete using (public.can_write_trip(trip_id));

-- BOOKINGS policies
drop policy if exists "Members can read bookings" on public.bookings;
create policy "Members can read bookings"
  on public.bookings for select using (public.is_trip_member(trip_id));

drop policy if exists "Editors can insert bookings" on public.bookings;
create policy "Editors can insert bookings"
  on public.bookings for insert with check (public.can_write_trip(trip_id));

drop policy if exists "Editors can update bookings" on public.bookings;
create policy "Editors can update bookings"
  on public.bookings for update using (public.can_write_trip(trip_id));

drop policy if exists "Editors can delete bookings" on public.bookings;
create policy "Editors can delete bookings"
  on public.bookings for delete using (public.can_write_trip(trip_id));
