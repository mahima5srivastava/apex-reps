-- Create the progress_photos storage bucket (private; accessed via authenticated RLS).
insert into storage.buckets (id, name, public)
values ('progress_photos', 'progress_photos', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload only into the progress_photos bucket.
create policy "authenticated users can upload their photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'progress_photos');

-- Allow authenticated users to view objects in the progress_photos bucket.
create policy "authenticated users can view their photos"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'progress_photos');
