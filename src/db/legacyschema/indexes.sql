-- indexes.sql
-- Indexes for HrdHat application

-- Form Data Photos Indexes
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

-- Forms Indexes
create index if not exists idx_forms_created_by 
  on public.forms(created_by);
create index if not exists idx_form_modules_form_id 
  on public.form_modules(form_id);
create index if not exists idx_user_form_module_preferences_user_id 
  on public.user_form_module_preferences(user_id); 