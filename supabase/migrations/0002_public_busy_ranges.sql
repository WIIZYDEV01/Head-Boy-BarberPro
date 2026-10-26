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
