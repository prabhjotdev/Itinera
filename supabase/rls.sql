-- ─────────────────────────────────────────────────────────────────────────────
-- Itinera – Row Level Security Policies
-- Run AFTER schema.sql
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper functions
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIPS
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIP MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIP INVITATIONS
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "Owners can manage invitations" on public.trip_invitations;
create policy "Owners can manage invitations"
  on public.trip_invitations for all using (public.trip_member_role(trip_id) = 'owner');

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIP DAYS
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- ITINERARY ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- ACTIONS
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────────────────────────────────────────
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
