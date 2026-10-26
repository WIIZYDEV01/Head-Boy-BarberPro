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
