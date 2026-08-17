-- Orbit cloud sync. Re-run this whole file in the Supabase SQL editor after updates.
-- Enable Email (magic link) under Authentication > Providers.
-- Add redirect URLs for your GitHub Pages origin and local testing.
-- This also creates the private orbit-media bucket for per-account wallpapers.

create table if not exists public.groups (
    id text primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null default 'Group',
    sort integer not null default 0,
    updated_at timestamptz not null default now()
);

create table if not exists public.lists (
    id text primary key,
    owner_id uuid not null references auth.users (id) on delete cascade,
    group_id text,
    name text not null default 'List',
    icon text not null default '📋',
    theme text not null default 'rb-particles',
    color text not null default '#b19eef',
    reset_frequency text not null default 'none',
    reset jsonb not null default '{"type":"none"}'::jsonb,
    updated_at timestamptz not null default now()
);

create table if not exists public.list_members (
    list_id text not null references public.lists (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    role text not null default 'editor' check (role in ('owner', 'editor')),
    created_at timestamptz not null default now(),
    primary key (list_id, user_id)
);

create table if not exists public.list_invites (
    token text primary key,
    list_id text not null references public.lists (id) on delete cascade,
    created_by uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz
);

create table if not exists public.tasks (
    id text primary key,
    list_id text not null references public.lists (id) on delete cascade,
    text text not null,
    completed boolean not null default false,
    date text,
    tags jsonb not null default '[]'::jsonb,
    sort_order integer not null default 0,
    updated_at timestamptz not null default now()
);

create table if not exists public.tags (
    id text primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    color text not null default '#b19eef',
    updated_at timestamptz not null default now()
);

create table if not exists public.user_prefs (
    user_id uuid primary key references auth.users (id) on delete cascade,
    settings jsonb not null default '{}'::jsonb,
    bits_params jsonb not null default '{}'::jsonb,
    wallpaper_adjust jsonb not null default '{}'::jsonb,
    custom_themes jsonb not null default '[]'::jsonb,
    current_list_id text,
    updated_at timestamptz not null default now()
);

create index if not exists lists_owner_idx on public.lists (owner_id);
create index if not exists tasks_list_idx on public.tasks (list_id);
create index if not exists tags_user_idx on public.tags (user_id);
create index if not exists groups_user_idx on public.groups (user_id);
create index if not exists list_members_user_idx on public.list_members (user_id);

create or replace function public.is_list_member(_list_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.list_members
        where list_id = _list_id and user_id = auth.uid()
    ) or exists (
        select 1 from public.lists
        where id = _list_id and owner_id = auth.uid()
    );
$$;

create or replace function public.is_list_owner(_list_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.lists
        where id = _list_id and owner_id = auth.uid()
    );
$$;

create or replace function public.add_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.list_members (list_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict (list_id, user_id) do nothing;
    return new;
end;
$$;

-- Owner membership is also upserted from the app after each list write.
-- The trigger only fires on INSERT; upserts of existing rows need the JS insert.
drop trigger if exists lists_add_owner_member on public.lists;
create trigger lists_add_owner_member
after insert on public.lists
for each row execute function public.add_owner_member();

create or replace function public.protect_list_owner()
returns trigger
language plpgsql
as $$
begin
    new.owner_id := old.owner_id;
    return new;
end;
$$;

drop trigger if exists lists_protect_owner on public.lists;
create trigger lists_protect_owner
before update on public.lists
for each row execute function public.protect_list_owner();

create or replace function public.redeem_list_invite(invite_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    inv public.list_invites%rowtype;
    uid uuid := auth.uid();
begin
    if uid is null then
        raise exception 'Sign in first';
    end if;
    select * into inv
    from public.list_invites
    where token = invite_token
      and (expires_at is null or expires_at > now());
    if not found then
        raise exception 'That invite is invalid or expired';
    end if;
    insert into public.list_members (list_id, user_id, role)
    values (inv.list_id, uid, 'editor')
    on conflict (list_id, user_id) do nothing;
    return inv.list_id;
end;
$$;

create or replace function public.leave_shared_list(p_list_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'Sign in first';
    end if;
    if public.is_list_owner(p_list_id) then
        raise exception 'Owners cannot leave their own list';
    end if;
    delete from public.list_members
    where list_id = p_list_id and user_id = auth.uid();
end;
$$;

alter table public.groups enable row level security;
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.list_invites enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.user_prefs enable row level security;

drop policy if exists groups_own on public.groups;
create policy groups_own on public.groups
    for all using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists lists_select on public.lists;
create policy lists_select on public.lists
    for select using (owner_id = auth.uid() or public.is_list_member(id));

drop policy if exists lists_insert on public.lists;
create policy lists_insert on public.lists
    for insert with check (owner_id = auth.uid());

drop policy if exists lists_update on public.lists;
create policy lists_update on public.lists
    for update using (owner_id = auth.uid() or public.is_list_member(id))
    with check (owner_id = auth.uid() or public.is_list_member(id));

drop policy if exists lists_delete on public.lists;
create policy lists_delete on public.lists
    for delete using (owner_id = auth.uid());

drop policy if exists members_select on public.list_members;
create policy members_select on public.list_members
    for select using (public.is_list_member(list_id));

drop policy if exists members_insert on public.list_members;
create policy members_insert on public.list_members
    for insert with check (
        user_id = auth.uid() and public.is_list_owner(list_id)
        or public.is_list_owner(list_id)
    );

drop policy if exists members_delete on public.list_members;
create policy members_delete on public.list_members
    for delete using (user_id = auth.uid() or public.is_list_owner(list_id));

drop policy if exists invites_owner on public.list_invites;
create policy invites_owner on public.list_invites
    for all using (public.is_list_owner(list_id))
    with check (public.is_list_owner(list_id) and created_by = auth.uid());

drop policy if exists tasks_member on public.tasks;
create policy tasks_member on public.tasks
    for all using (public.is_list_member(list_id))
    with check (public.is_list_member(list_id));

drop policy if exists tags_own on public.tags;
create policy tags_own on public.tags
    for all using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists prefs_own on public.user_prefs;
create policy prefs_own on public.user_prefs
    for all using (user_id = auth.uid())
    with check (user_id = auth.uid());

grant execute on function public.redeem_list_invite(text) to authenticated;
grant execute on function public.leave_shared_list(text) to authenticated;
grant execute on function public.is_list_member(text) to authenticated;
grant execute on function public.is_list_owner(text) to authenticated;

grant select, insert, update, delete on
    public.groups,
    public.lists,
    public.list_members,
    public.list_invites,
    public.tasks,
    public.tags,
    public.user_prefs
to authenticated;
grant usage on schema public to authenticated;

do $$
begin
    if exists (
        select 1 from pg_constraint
        where conrelid = 'public.tags'::regclass and contype = 'p' and array_length(conkey, 1) = 1
    ) then
        alter table public.tags drop constraint tags_pkey;
        alter table public.tags add primary key (user_id, id);
    end if;
    if exists (
        select 1 from pg_constraint
        where conrelid = 'public.groups'::regclass and contype = 'p' and array_length(conkey, 1) = 1
    ) then
        alter table public.groups drop constraint groups_pkey;
        alter table public.groups add primary key (user_id, id);
    end if;
exception when others then
    null;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
    ) then
        execute 'alter publication supabase_realtime add table public.tasks';
    end if;
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lists'
    ) then
        execute 'alter publication supabase_realtime add table public.lists';
    end if;
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'list_members'
    ) then
        execute 'alter publication supabase_realtime add table public.list_members';
    end if;
end $$;

-- Per-account wallpaper files. Path: {user_id}/wallpapers/{id}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'orbit-media',
    'orbit-media',
    false,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists orbit_media_select on storage.objects;
drop policy if exists orbit_media_insert on storage.objects;
drop policy if exists orbit_media_update on storage.objects;
drop policy if exists orbit_media_delete on storage.objects;

create policy orbit_media_select on storage.objects
    for select to authenticated
    using (
        bucket_id = 'orbit-media'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy orbit_media_insert on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'orbit-media'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy orbit_media_update on storage.objects
    for update to authenticated
    using (
        bucket_id = 'orbit-media'
        and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
        bucket_id = 'orbit-media'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy orbit_media_delete on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'orbit-media'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
