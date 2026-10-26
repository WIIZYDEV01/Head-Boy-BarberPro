create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create type public.membership_role as enum ('owner', 'manager', 'barber');
create type public.membership_status as enum ('active', 'invited', 'deactivated');
create type public.payment_policy as enum ('full', 'deposit', 'at_salon');
create type public.appointment_status as enum (
  'pending_payment',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);
create type public.payment_status as enum (
  'pending',
  'success',
  'failed',
  'abandoned',
  'refunded'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  address_line text,
  city text,
  state text,
  country text,
  phone text,
  email text,
  timezone text not null default 'Africa/Lagos',
  currency text not null default 'NGN',
  logo_url text,
  cover_url text,
  payment_policy public.payment_policy not null default 'at_salon',
  deposit_percent integer not null default 20 check (deposit_percent between 0 and 100),
  booking_buffer_minutes integer not null default 0 check (booking_buffer_minutes between 0 and 60),
  cancellation_hours integer not null default 12 check (cancellation_hours between 0 and 168),
  is_published boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salon_memberships (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, user_id)
);

create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  membership_id uuid not null unique references public.salon_memberships (id) on delete cascade,
  display_name text not null,
  bio text,
  specialties text[] not null default '{}',
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  name text not null,
  description text,
  category text,
  price_kobo integer not null check (price_kobo >= 0),
  duration_minutes integer not null check (duration_minutes between 10 and 480),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_salon_user_idx
  on public.customers (salon_id, user_id)
  where user_id is not null;

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  barber_id uuid references public.barbers (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null default '09:00',
  end_time time not null default '18:00',
  is_closed boolean not null default false
);

create unique index working_hours_salon_default_day_idx
  on public.working_hours (salon_id, day_of_week)
  where barber_id is null;

create unique index working_hours_barber_day_idx
  on public.working_hours (barber_id, day_of_week)
  where barber_id is not null;

create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  barber_id uuid not null references public.barbers (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete restrict,
  service_id uuid references public.services (id) on delete set null,
  barber_id uuid not null references public.barbers (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  customer_user_id uuid references public.profiles (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null,
  price_kobo integer not null check (price_kobo >= 0),
  service_name_snapshot text not null,
  duration_minutes_snapshot integer not null,
  currency text not null,
  notes text,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    barber_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending_payment', 'confirmed', 'completed'));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete restrict,
  appointment_id uuid not null references public.appointments (id) on delete restrict,
  amount_kobo integer not null check (amount_kobo > 0),
  currency text not null,
  provider text not null default 'paystack',
  reference text not null unique,
  provider_reference text,
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_one_success_per_appointment
  on public.payments (appointment_id)
  where status = 'success';

create table public.appointment_audit (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  from_status public.appointment_status,
  to_status public.appointment_status,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index salons_owner_idx on public.salons (owner_id);
create index memberships_user_idx on public.salon_memberships (user_id);
create index memberships_salon_idx on public.salon_memberships (salon_id);
create index barbers_salon_idx on public.barbers (salon_id);
create index services_salon_idx on public.services (salon_id);
create index customers_salon_idx on public.customers (salon_id);
create index appointments_salon_starts_idx on public.appointments (salon_id, starts_at);
create index appointments_barber_starts_idx on public.appointments (barber_id, starts_at);
create index appointments_customer_user_idx on public.appointments (customer_user_id);
create index payments_salon_idx on public.payments (salon_id, status);
create index working_hours_salon_idx on public.working_hours (salon_id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger salons_updated_at before update on public.salons
  for each row execute function public.set_updated_at();
create trigger memberships_updated_at before update on public.salon_memberships
  for each row execute function public.set_updated_at();
create trigger barbers_updated_at before update on public.barbers
  for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_salon_member(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.salon_memberships m
    where m.salon_id = p_salon_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_salon_manager(p_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.salon_memberships m
    where m.salon_id = p_salon_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'manager')
  );
$$;

create or replace function public.protect_profile_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    new.is_platform_admin := old.is_platform_admin;
  end if;
  return new;
end;
$$;

create trigger protect_profile_admin
  before update on public.profiles
  for each row execute function public.protect_profile_admin_flag();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'user'), '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.on_salon_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership uuid;
  v_name text;
  d integer;
begin
  insert into public.salon_memberships (salon_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active')
  returning id into v_membership;

  select coalesce(p.full_name, 'Owner') into v_name
  from public.profiles p
  where p.id = new.owner_id;

  insert into public.barbers (salon_id, membership_id, display_name)
  values (new.id, v_membership, v_name);

  for d in 0..6 loop
    insert into public.working_hours (salon_id, barber_id, day_of_week, start_time, end_time, is_closed)
    values (new.id, null, d, '09:00', '18:00', d = 0);
  end loop;

  return new;
end;
$$;

create trigger salon_created
  after insert on public.salons
  for each row execute function public.on_salon_created();

create or replace function public.expire_stale_holds()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.appointments
  set status = 'cancelled'
  where status = 'pending_payment'
    and hold_expires_at is not null
    and hold_expires_at < now();
end;
$$;

create or replace function public.book_appointment(
  p_salon_id uuid,
  p_service_id uuid,
  p_barber_id uuid,
  p_starts_at timestamptz,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_salon public.salons%rowtype;
  v_service public.services%rowtype;
  v_barber public.barbers%rowtype;
  v_customer_id uuid;
  v_status public.appointment_status;
  v_ends timestamptz;
  v_id uuid;
  v_profile public.profiles%rowtype;
  v_email text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  perform public.expire_stale_holds();

  select * into v_salon from public.salons where id = p_salon_id and is_active = true;
  if not found then
    raise exception 'Salon is not available';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id and salon_id = p_salon_id and is_active = true;
  if not found then
    raise exception 'Service is not available for this salon';
  end if;

  if p_starts_at <= now() then
    raise exception 'Cannot book in the past';
  end if;

  v_ends := p_starts_at + make_interval(mins => v_service.duration_minutes + v_salon.booking_buffer_minutes);

  if p_barber_id is not null then
    select * into v_barber
    from public.barbers
    where id = p_barber_id and salon_id = p_salon_id and is_active = true;
    if not found then
      raise exception 'Barber is not available for this salon';
    end if;
  else
    select b.* into v_barber
    from public.barbers b
    where b.salon_id = p_salon_id and b.is_active = true
      and not exists (
        select 1 from public.appointments a
        where a.barber_id = b.id
          and a.status in ('pending_payment', 'confirmed', 'completed')
          and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_starts_at, v_ends, '[)')
      )
      and not exists (
        select 1 from public.time_off t
        where t.barber_id = b.id
          and tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(p_starts_at, v_ends, '[)')
      )
    order by b.created_at
    limit 1;
    if not found then
      raise exception 'No barber is available for that time';
    end if;
  end if;

  if exists (
    select 1 from public.time_off t
    where t.barber_id = v_barber.id
      and tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(p_starts_at, v_ends, '[)')
  ) then
    raise exception 'Barber is unavailable at that time';
  end if;

  select * into v_profile from public.profiles where id = v_user;
  select email into v_email from auth.users where id = v_user;

  insert into public.customers (salon_id, user_id, full_name, email, phone)
  values (
    p_salon_id,
    v_user,
    coalesce(v_profile.full_name, 'Customer'),
    v_email,
    v_profile.phone
  )
  on conflict (salon_id, user_id) where user_id is not null
  do update set
    full_name = excluded.full_name,
    email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  v_status := case
    when v_salon.payment_policy = 'at_salon' then 'confirmed'::public.appointment_status
    else 'pending_payment'::public.appointment_status
  end;

  insert into public.appointments (
    salon_id, service_id, barber_id, customer_id, customer_user_id,
    starts_at, ends_at, status, price_kobo, service_name_snapshot,
    duration_minutes_snapshot, currency, notes, hold_expires_at
  ) values (
    p_salon_id, v_service.id, v_barber.id, v_customer_id, v_user,
    p_starts_at, v_ends, v_status, v_service.price_kobo, v_service.name,
    v_service.duration_minutes, v_salon.currency, p_notes,
    case when v_status = 'pending_payment' then now() + interval '15 minutes' else null end
  )
  returning id into v_id;

  insert into public.appointment_audit (appointment_id, salon_id, actor_id, action, to_status)
  values (v_id, p_salon_id, v_user, 'booked', v_status);

  return v_id;
exception
  when exclusion_violation then
    raise exception 'That time slot is no longer available';
end;
$$;

create or replace function public.log_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (old.status is distinct from new.status) then
    insert into public.appointment_audit (
      appointment_id, salon_id, actor_id, action, from_status, to_status
    ) values (
      new.id, new.salon_id, auth.uid(), 'status_change', old.status, new.status
    );
  end if;
  return new;
end;
$$;

create trigger appointment_status_audit
  after update on public.appointments
  for each row execute function public.log_appointment_change();

alter table public.profiles enable row level security;
alter table public.salons enable row level security;
alter table public.salon_memberships enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.appointment_audit enable row level security;
alter table public.reviews enable row level security;

create policy "profiles_select_own_or_staff_needed"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.is_platform_admin()
    or exists (
      select 1
      from public.salon_memberships mine
      join public.salon_memberships theirs
        on mine.salon_id = theirs.salon_id
      where mine.user_id = auth.uid()
        and mine.status = 'active'
        and theirs.user_id = profiles.id
        and theirs.status = 'active'
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "salons_select"
  on public.salons for select
  using (
    (is_published = true and is_active = true)
    or public.is_salon_member(id)
    or public.is_platform_admin()
  );

create policy "salons_insert"
  on public.salons for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

create policy "salons_update"
  on public.salons for update
  using (public.is_salon_manager(id) or public.is_platform_admin())
  with check (public.is_salon_manager(id) or public.is_platform_admin());

create policy "memberships_select"
  on public.salon_memberships for select
  using (public.is_salon_member(salon_id) or user_id = auth.uid() or public.is_platform_admin());

create policy "memberships_insert"
  on public.salon_memberships for insert
  with check (public.is_salon_manager(salon_id));

create policy "memberships_update"
  on public.salon_memberships for update
  using (public.is_salon_manager(salon_id))
  with check (public.is_salon_manager(salon_id));

create policy "barbers_select"
  on public.barbers for select
  using (
    public.is_salon_member(salon_id)
    or public.is_platform_admin()
    or exists (
      select 1 from public.salons s
      where s.id = barbers.salon_id and s.is_published = true and s.is_active = true
    )
  );

create policy "barbers_write"
  on public.barbers for all
  using (public.is_salon_manager(salon_id))
  with check (public.is_salon_manager(salon_id));

create policy "services_select"
  on public.services for select
  using (
    public.is_salon_member(salon_id)
    or public.is_platform_admin()
    or exists (
      select 1 from public.salons s
      where s.id = services.salon_id and s.is_published = true and s.is_active = true and services.is_active = true
    )
  );

create policy "services_write"
  on public.services for all
  using (public.is_salon_manager(salon_id))
  with check (public.is_salon_manager(salon_id));

create policy "customers_select"
  on public.customers for select
  using (
    public.is_salon_member(salon_id)
    or user_id = auth.uid()
    or public.is_platform_admin()
  );

create policy "customers_insert"
  on public.customers for insert
  with check (public.is_salon_member(salon_id));

create policy "customers_update"
  on public.customers for update
  using (public.is_salon_manager(salon_id) or user_id = auth.uid())
  with check (public.is_salon_manager(salon_id) or user_id = auth.uid());

create policy "working_hours_select"
  on public.working_hours for select
  using (
    public.is_salon_member(salon_id)
    or public.is_platform_admin()
    or exists (
      select 1 from public.salons s
      where s.id = working_hours.salon_id and s.is_published = true and s.is_active = true
    )
  );

create policy "working_hours_write"
  on public.working_hours for all
  using (public.is_salon_manager(salon_id))
  with check (public.is_salon_manager(salon_id));

create policy "time_off_select"
  on public.time_off for select
  using (public.is_salon_member(salon_id) or public.is_platform_admin());

create policy "time_off_write"
  on public.time_off for all
  using (
    public.is_salon_manager(salon_id)
    or exists (
      select 1 from public.barbers b
      join public.salon_memberships m on m.id = b.membership_id
      where b.id = time_off.barber_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
  with check (
    public.is_salon_manager(salon_id)
    or exists (
      select 1 from public.barbers b
      join public.salon_memberships m on m.id = b.membership_id
      where b.id = time_off.barber_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and b.salon_id = time_off.salon_id
    )
  );

create policy "appointments_select"
  on public.appointments for select
  using (
    public.is_salon_member(salon_id)
    or customer_user_id = auth.uid()
    or public.is_platform_admin()
  );

create policy "appointments_update_staff"
  on public.appointments for update
  using (public.is_salon_member(salon_id))
  with check (public.is_salon_member(salon_id));

create policy "appointments_update_customer"
  on public.appointments for update
  using (customer_user_id = auth.uid())
  with check (customer_user_id = auth.uid());

create policy "payments_select"
  on public.payments for select
  using (
    public.is_salon_manager(salon_id)
    or public.is_platform_admin()
    or exists (
      select 1 from public.appointments a
      where a.id = payments.appointment_id and a.customer_user_id = auth.uid()
    )
  );

create policy "audit_select"
  on public.appointment_audit for select
  using (public.is_salon_manager(salon_id) or public.is_platform_admin());

create policy "reviews_select"
  on public.reviews for select
  using (
    is_published = true
    or public.is_salon_member(salon_id)
    or exists (
      select 1 from public.customers c
      where c.id = reviews.customer_id and c.user_id = auth.uid()
    )
  );

create policy "reviews_insert"
  on public.reviews for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.customer_user_id = auth.uid()
        and a.status = 'completed'
        and a.salon_id = reviews.salon_id
    )
  );

insert into storage.buckets (id, name, public)
values
  ('salon-assets', 'salon-assets', true)
on conflict (id) do nothing;

create policy "salon_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'salon-assets');

create policy "salon_assets_member_write"
  on storage.objects for insert
  with check (
    bucket_id = 'salon-assets'
    and public.is_salon_member((storage.foldername(name))[1]::uuid)
  );

create policy "salon_assets_member_update"
  on storage.objects for update
  using (
    bucket_id = 'salon-assets'
    and public.is_salon_member((storage.foldername(name))[1]::uuid)
  );

create policy "salon_assets_member_delete"
  on storage.objects for delete
  using (
    bucket_id = 'salon-assets'
    and public.is_salon_member((storage.foldername(name))[1]::uuid)
  );

grant execute on function public.book_appointment(uuid, uuid, uuid, timestamptz, text) to authenticated;
grant execute on function public.expire_stale_holds() to authenticated;

create or replace function public.barber_busy_ranges(
  p_salon_id uuid,
  p_barber_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.starts_at, a.ends_at
  from public.appointments a
  join public.salons s on s.id = a.salon_id
  where a.salon_id = p_salon_id
    and a.barber_id = p_barber_id
    and a.status in ('pending_payment', 'confirmed', 'completed')
    and a.starts_at < p_to
    and a.ends_at > p_from
    and (s.is_published = true or public.is_salon_member(p_salon_id) or auth.uid() is not null)
  union all
  select t.starts_at, t.ends_at
  from public.time_off t
  where t.salon_id = p_salon_id
    and t.barber_id = p_barber_id
    and t.starts_at < p_to
    and t.ends_at > p_from;
$$;

grant execute on function public.barber_busy_ranges(uuid, uuid, timestamptz, timestamptz) to anon, authenticated;

create policy "payments_insert_customer"
  on public.payments for insert
  with check (
    exists (
      select 1
      from public.appointments a
      where a.id = appointment_id
        and a.salon_id = payments.salon_id
        and a.customer_user_id = auth.uid()
        and a.status = 'pending_payment'
    )
  );

insert into public.profiles (id, full_name)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(coalesce(email, 'user'), '@', 1))
from auth.users
on conflict (id) do nothing;

