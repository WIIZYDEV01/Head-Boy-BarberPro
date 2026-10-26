-- Client profile extras used by Booksy / StyleSeat style flows:
-- preferred cut notes, saved shops, and avatar storage.

alter table public.profiles
  add column if not exists preferred_style text;

create table if not exists public.saved_salons (
  user_id uuid not null references public.profiles (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, salon_id)
);

create index if not exists saved_salons_salon_idx on public.saved_salons (salon_id);

alter table public.saved_salons enable row level security;

drop policy if exists "saved_salons_select_own" on public.saved_salons;
create policy "saved_salons_select_own"
  on public.saved_salons for select
  using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists "saved_salons_insert_own" on public.saved_salons;
create policy "saved_salons_insert_own"
  on public.saved_salons for insert
  with check (user_id = auth.uid());

drop policy if exists "saved_salons_delete_own" on public.saved_salons;
create policy "saved_salons_delete_own"
  on public.saved_salons for delete
  using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_own_write" on storage.objects;
create policy "avatars_own_write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

grant select, insert, delete on table public.saved_salons to authenticated;
grant select on table public.saved_salons to anon;
