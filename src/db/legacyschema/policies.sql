-- policies.sql
-- Row Level Security (RLS) policies for HrdHat application

-- Enable RLS on all tables
alter table public.form_data enable row level security;
alter table public.form_data_photos enable row level security;
alter table public.form_modules enable row level security;
alter table public.forms enable row level security;
alter table public.profiles enable row level security;
alter table public.user_form_module_preferences enable row level security;

-- Form Data Policies
create policy "Users can read their own form data"
  on public.form_data for select
  using (
    exists (
      select 1 from public.forms
      where forms.id = form_data.form_id
      and forms.created_by = auth.uid()
    )
  );

create policy "Users can update their own form data"
  on public.form_data for update
  using (
    exists (
      select 1 from public.forms
      where forms.id = form_data.form_id
      and forms.created_by = auth.uid()
    )
  );

-- Form Data Photos Policies
create policy "Users can insert photos for their forms"
  on public.form_data_photos for insert
  with check (
    exists (
      select 1 from public.forms
      where forms.id = form_data_photos.form_id
      and forms.created_by = auth.uid()
    )
    and auth.uid() = uploaded_by
  );

create policy "Users can soft delete their own photos"
  on public.form_data_photos for update
  using (
    not is_deleted
    and exists (
      select 1 from public.forms
      where forms.id = form_data_photos.form_id
      and forms.created_by = auth.uid()
    )
    and auth.uid() = uploaded_by
  );

create policy "Users can update their own photos"
  on public.form_data_photos for update
  using (
    not is_deleted
    and exists (
      select 1 from public.forms
      where forms.id = form_data_photos.form_id
      and forms.created_by = auth.uid()
    )
    and auth.uid() = uploaded_by
  );

create policy "Users can view photos for their forms"
  on public.form_data_photos for select
  using (
    not is_deleted
    and exists (
      select 1 from public.forms
      where forms.id = form_data_photos.form_id
      and forms.created_by = auth.uid()
    )
  );

-- Form Modules Policies
create policy "Users can access modules of their own forms"
  on public.form_modules for select
  using (
    exists (
      select 1 from public.forms
      where forms.id = form_modules.form_id
      and forms.user_id = auth.uid()
    )
  );

create policy "Users can delete modules of their own forms"
  on public.form_modules for delete
  using (
    exists (
      select 1 from public.forms
      where forms.id = form_modules.form_id
      and forms.user_id = auth.uid()
    )
  );

create policy "Users can insert modules for their own forms"
  on public.form_modules for insert
  with check (
    exists (
      select 1 from public.forms
      where forms.id = form_modules.form_id
      and forms.user_id = auth.uid()
    )
  );

create policy "Users can update modules of their own forms"
  on public.form_modules for update
  using (
    exists (
      select 1 from public.forms
      where forms.id = form_modules.form_id
      and forms.user_id = auth.uid()
    )
  );

-- Forms Policies
create policy "Users can create their own forms"
  on public.forms for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own forms"
  on public.forms for delete
  using (auth.uid() = user_id);

create policy "Users can insert forms"
  on public.forms for insert
  with check (auth.uid() = created_by);

create policy "Users can read their own forms"
  on public.forms for select
  using (auth.uid() = created_by);

create policy "Users can update their own forms"
  on public.forms for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their own forms"
  on public.forms for select
  using (auth.uid() = user_id);

-- Profiles Policies
create policy "Allow inserts for self or trigger"
  on public.profiles for insert
  with check ((auth.uid() = id) or (auth.uid() is null));

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- User Form Module Preferences Policies
create policy "Users can access their own module preferences"
  on public.user_form_module_preferences for select
  using (auth.uid() = user_id);

create policy "Users can delete their own module preferences"
  on public.user_form_module_preferences for delete
  using (auth.uid() = user_id);

create policy "Users can insert their own module preferences"
  on public.user_form_module_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own module preferences"
  on public.user_form_module_preferences for update
  using (auth.uid() = user_id); 