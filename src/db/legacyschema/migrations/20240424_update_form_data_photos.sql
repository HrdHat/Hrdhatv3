-- 20240424_update_form_data_photos.sql
-- Migration: Ensure form_data_photos table supports all required fields for photo tracking

create extension if not exists "uuid-ossp";

create table if not exists public.form_data_photos (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid not null references public.form_modules(id),
  uploaded_by uuid not null references public.profiles(id),
  storage_path text not null,
  public_url text not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  description text,
  sort_order integer,
  tag text,
  source text,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
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

-- Updated at trigger
create or replace function update_form_data_photos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_form_data_photos_updated_at on public.form_data_photos;

create trigger update_form_data_photos_updated_at
  before update on public.form_data_photos
  for each row
  execute procedure update_form_data_photos_updated_at(); 