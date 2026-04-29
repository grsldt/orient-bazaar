-- Create public bucket for catalog images
insert into storage.buckets (id, name, public)
values ('catalog', 'catalog', true)
on conflict (id) do update set public = true;

-- Public read for everyone
create policy "Catalog images are publicly readable"
on storage.objects for select
using (bucket_id = 'catalog');

-- Authenticated users (admins) can upload/update/delete
create policy "Authenticated users can upload catalog images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'catalog');

create policy "Authenticated users can update catalog images"
on storage.objects for update
to authenticated
using (bucket_id = 'catalog');

create policy "Authenticated users can delete catalog images"
on storage.objects for delete
to authenticated
using (bucket_id = 'catalog');