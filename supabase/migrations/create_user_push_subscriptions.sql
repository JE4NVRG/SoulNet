-- Create user_push_subscriptions table for PWA push notifications
create table if not exists user_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

-- Create index for better query performance
create index if not exists idx_user_push_subscriptions_user on user_push_subscriptions(user_id);

-- Enable RLS (Row Level Security)
alter table user_push_subscriptions enable row level security;

-- Create RLS policies
create policy "Users can view their own push subscriptions"
  on user_push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push subscriptions"
  on user_push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own push subscriptions"
  on user_push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own push subscriptions"
  on user_push_subscriptions for delete
  using (auth.uid() = user_id);

-- Grant permissions to authenticated users
grant all privileges on user_push_subscriptions to authenticated;
grant usage on schema public to authenticated;