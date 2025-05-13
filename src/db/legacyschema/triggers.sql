-- triggers.sql
-- Triggers and functions for HrdHat application

-- Updated at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_form_data_updated_at
  before update on public.form_data
  for each row
  execute function update_updated_at_column();

create trigger update_form_data_photos_updated_at
  before update on public.form_data_photos
  for each row
  execute function update_form_data_photos_updated_at();

create trigger update_form_list_updated_at
  before update on public.form_list
  for each row
  execute function update_form_list_updated_at_column();

create trigger update_module_list_updated_at
  before update on public.module_list
  for each row
  execute function update_module_list_updated_at_column();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function update_updated_at_column();

-- New user trigger
create or replace function copy_default_flra_modules_for_new_user()
returns trigger as $$
declare
  flra_form_id uuid;
  module_record record;
begin
  -- Get the FLRA form template ID
  select id into flra_form_id
  from public.form_list
  where name = 'FLRA'
  and is_active = true
  limit 1;

  -- If FLRA form template exists, copy its modules to user preferences
  if flra_form_id is not null then
    for module_record in (
      select 
        module_list_id,
        module_order,
        is_required
      from public.form_template_modules
      where form_list_id = flra_form_id
    ) loop
      insert into public.user_form_module_preferences (
        user_id,
        form_list_id,
        module_list_id,
        module_order,
        is_required
      ) values (
        new.id,
        flra_form_id,
        module_record.module_list_id,
        module_record.module_order,
        module_record.is_required
      );
    end loop;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger after_profile_created_copy_flra_modules
  after insert on public.profiles
  for each row
  execute function copy_default_flra_modules_for_new_user(); 