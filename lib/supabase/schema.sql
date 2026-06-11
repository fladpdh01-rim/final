-- Create public users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  raw_user_meta_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, raw_user_meta_data)
  values (new.id, new.email, new.raw_user_meta_data)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger if not exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
