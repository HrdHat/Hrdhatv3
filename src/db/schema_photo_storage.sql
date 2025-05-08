-- Photo Storage Schema for HrdHat
-- This schema handles all photo-related storage and metadata for forms
-- Includes RLS policies, indexes, and helper functions

-- 1. Ensure required extensions
create extension if not exists "uuid-ossp";

-- 2. Main Photos Table
create table if not exists public.form_data_photos (
  -- Primary Key
  id uuid primary key default uuid_generate_v4(),
  
  -- Foreign Keys
  form_id uuid not null references public.forms(id),
  form_module_id uuid not null references public.form_modules(id),
  uploaded_by uuid not null references public.profiles(id),
  
  -- Storage Information
  storage_path text not null,
  public_url text not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  
  -- Metadata
  description text,
  sort_order integer,  -- For displaying multiple photos in order
  tag text,           -- e.g., "guardrails", "equipment" context
  source text,        -- "mobile", "web", "imported" for analytics
  
  -- Timestamps
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Soft Delete
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  
  -- Constraints
  constraint unique_storage_path unique (storage_path),
  constraint positive_file_size check (file_size > 0),
  constraint valid_soft_delete check (
    (is_deleted = false and deleted_at is null) or
    (is_deleted = true and deleted_at is not null)
  ),
  constraint valid_mime_type check (
    mime_type in ('image/jpeg', 'image/png', 'image/heic', 'image/heif')
  )
);

-- 3. Indexes
create index if not exists idx_form_data_photos_form_id 
  on public.form_data_photos(form_id);
create index if not exists idx_form_data_photos_uploaded_by 
  on public.form_data_photos(uploaded_by);
create index if not exists idx_form_data_photos_sort_order 
  on public.form_data_photos(sort_order);
create index if not exists idx_form_data_photos_tag 
  on public.form_data_photos(tag);
create index if not exists idx_form_data_photos_is_deleted 
  on public.form_data_photos(is_deleted);

-- 4. Enable RLS
alter table public.form_data_photos enable row level security;

-- 5. RLS Policies
-- View policy
create policy "Users can view photos for their forms"
  on public.form_data_photos for select
  using (
    not is_deleted and
    exists (
      select 1 from public.forms
      where public.forms.id = form_data_photos.form_id
      and public.forms.created_by = auth.uid()
    )
  );

-- Insert policy
create policy "Users can insert photos for their forms"
  on public.form_data_photos for insert
  with check (
    exists (
      select 1 from public.forms
      where public.forms.id = form_data_photos.form_id
      and public.forms.created_by = auth.uid()
    )
    and auth.uid() = uploaded_by
  );

-- Update policy
create policy "Users can update their own photos"
  on public.form_data_photos for update
  using (
    not is_deleted and
    exists (
      select 1 from public.forms
      where public.forms.id = form_data_photos.form_id
      and public.forms.created_by = auth.uid()
    )
    and auth.uid() = uploaded_by
  );

-- Soft delete policy
create policy "Users can soft delete their own photos"
  on public.form_data_photos for update
  using (
    not is_deleted and
    exists (
      select 1 from public.forms
      where public.forms.id = form_data_photos.form_id
      and public.forms.created_by = auth.uid()
    )
    and auth.uid() = uploaded_by
  );

-- 6. Storage Bucket Policies
-- View policy
create policy "Users can access photos for their forms"
  on storage.objects for select
  using (
    bucket_id = 'form_uploads'
    and (
      exists (
        select 1 from public.forms f
        join public.form_data_photos p on p.form_id = f.id
        where f.created_by = auth.uid()
        and p.storage_path = name
        and not p.is_deleted
      )
    )
  );

-- Upload policy
create policy "Users can upload photos for their forms"
  on storage.objects for insert
  with check (
    bucket_id = 'form_uploads'
    and (
      exists (
        select 1 from public.forms f
        where f.created_by = auth.uid()
        and f.id::text = split_part(name, '/', 1)
      )
    )
  );

-- Delete policy
create policy "Users can delete photos for their forms"
  on storage.objects for delete
  using (
    bucket_id = 'form_uploads'
    and (
      exists (
        select 1 from public.forms f
        join public.form_data_photos p on p.form_id = f.id
        where f.created_by = auth.uid()
        and p.storage_path = name
        and p.is_deleted = true
      )
    )
  );

-- 7. Triggers and Functions
-- Updated at trigger
create or replace function update_form_data_photos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_form_data_photos_updated_at
  before update on public.form_data_photos
  for each row
  execute procedure update_form_data_photos_updated_at();

-- Soft delete function with proper SQL syntax
create or replace function soft_delete_photo(photo_id uuid)
returns void as $$
begin
  update public.form_data_photos p
  set is_deleted = true,
      deleted_at = now()
  from public.forms f
  where p.id = photo_id
    and p.form_id = f.id
    and f.created_by = auth.uid();
    -- Future: Add multi-company/project isolation
    -- and f.project_id in (select project_id from user_projects where user_id = auth.uid())
end;
$$ language plpgsql security definer;

-- 8. Comments
comment on table public.form_data_photos is 'Stores metadata for photos uploaded to forms';
comment on column public.form_data_photos.storage_path is 'Path in Supabase Storage';
comment on column public.form_data_photos.public_url is 'Public URL for the image';
comment on column public.form_data_photos.sort_order is 'Order for displaying multiple photos';
comment on column public.form_data_photos.tag is 'Category or context of the photo';
comment on column public.form_data_photos.source is 'Origin of the photo (mobile, web, imported)'; 