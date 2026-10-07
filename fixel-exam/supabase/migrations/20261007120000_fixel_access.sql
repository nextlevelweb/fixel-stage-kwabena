-- Fixel: rechten, cascade en reviewer-functies.
-- Uitvoeren in Supabase > SQL Editor. Opnieuw uitvoeren is veilig.
--
-- Wat dit doet:
--   1. profiles-tabel (TE-01)
--   2. created_by krijgt automatisch de ingelogde medewerker
--   3. verwijderen van een project verwijdert alles eronder mee (FE-02, TE-06)
--   4. medewerkers zien en beheren alleen hun eigen projecten (RLS)
--   5. activity_log is append-only: geen update of delete (TE-06)
--   6. feedback hoort bij een pagina van de website (page_path)
--   7. reviewers zonder account werken alleen via functies die de
--      reviewlink (public_key) controleren; anon heeft GEEN directe
--      toegang tot de tabellen (TE-02, TE-03)


-- 1. profiles --------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'medewerker'
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

grant select on public.profiles to authenticated;

-- profiel voor bestaande gebruikers
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- profiel voor nieuwe gebruikers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 1b. kolommen die de app nodig heeft ----------------------------------------

-- public_key is gewone tekst (minimaal 32 tekens), geen uuid-type
alter table public.projects
  alter column public_key type text using public_key::text;

create unique index if not exists projects_public_key_key
  on public.projects (public_key);

-- elk feedbackpunt hoort bij een pagina van de website, bijvoorbeeld /contact
alter table public.feedback_items
  add column if not exists page_path text not null default '/';


-- 2. created_by automatisch invullen ---------------------------------------

alter table public.projects         alter column created_by set default auth.uid();
alter table public.feedback_replies alter column created_by set default auth.uid();
alter table public.activity_log     alter column created_by set default auth.uid();


-- 3. cascade: project -> feedback -> reacties, project -> historie ---------

do $$
declare
  r record;
  c record;
begin
  for r in
    select * from (values
      ('feedback_items',   'project_id',  'projects'),
      ('feedback_replies', 'feedback_id', 'feedback_items'),
      ('activity_log',     'project_id',  'projects')
    ) as t (child_table, child_col, parent_table)
  loop
    -- oude foreign key op deze kolom weghalen
    for c in
      select con.conname
      from pg_constraint con
      join pg_attribute a
        on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
      where con.contype = 'f'
        and con.conrelid = ('public.' || r.child_table)::regclass
        and a.attname = r.child_col
    loop
      execute format(
        'alter table public.%I drop constraint %I',
        r.child_table, c.conname
      );
    end loop;

    -- nieuwe foreign key met cascade
    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references public.%I (id) on delete cascade',
      r.child_table,
      r.child_table || '_' || r.child_col || '_fkey',
      r.child_col,
      r.parent_table
    );
  end loop;
end
$$;


-- 4. rechten voor medewerkers (ingelogd) -----------------------------------

alter table public.projects         enable row level security;
alter table public.feedback_items   enable row level security;
alter table public.feedback_replies enable row level security;
alter table public.activity_log     enable row level security;

grant usage on all sequences in schema public to authenticated;

grant select, insert, update, delete on public.projects         to authenticated;
grant select, update                 on public.feedback_items   to authenticated;
grant select, insert                 on public.feedback_replies to authenticated;
grant select, insert                 on public.activity_log     to authenticated;

-- activity_log wordt nooit aangepast of los verwijderd (TE-06)
revoke update, delete on public.activity_log from authenticated;

-- projects: alleen je eigen projecten
drop policy if exists "projects own select" on public.projects;
create policy "projects own select"
  on public.projects for select to authenticated
  using (created_by = auth.uid());

drop policy if exists "projects own insert" on public.projects;
create policy "projects own insert"
  on public.projects for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "projects own update" on public.projects;
create policy "projects own update"
  on public.projects for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "projects own delete" on public.projects;
create policy "projects own delete"
  on public.projects for delete to authenticated
  using (created_by = auth.uid());

-- feedback_items: van je eigen projecten
drop policy if exists "feedback own select" on public.feedback_items;
create policy "feedback own select"
  on public.feedback_items for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = feedback_items.project_id and p.created_by = auth.uid()
  ));

drop policy if exists "feedback own update" on public.feedback_items;
create policy "feedback own update"
  on public.feedback_items for update to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = feedback_items.project_id and p.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = feedback_items.project_id and p.created_by = auth.uid()
  ));

-- feedback_replies: reacties bij feedback van je eigen projecten
drop policy if exists "replies own select" on public.feedback_replies;
create policy "replies own select"
  on public.feedback_replies for select to authenticated
  using (exists (
    select 1
    from public.feedback_items f
    join public.projects p on p.id = f.project_id
    where f.id = feedback_replies.feedback_id and p.created_by = auth.uid()
  ));

drop policy if exists "replies own insert" on public.feedback_replies;
create policy "replies own insert"
  on public.feedback_replies for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.feedback_items f
      join public.projects p on p.id = f.project_id
      where f.id = feedback_replies.feedback_id and p.created_by = auth.uid()
    )
  );

-- activity_log: historie van je eigen projecten
drop policy if exists "activity own select" on public.activity_log;
create policy "activity own select"
  on public.activity_log for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = activity_log.project_id and p.created_by = auth.uid()
  ));

drop policy if exists "activity own insert" on public.activity_log;
create policy "activity own insert"
  on public.activity_log for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = activity_log.project_id and p.created_by = auth.uid()
    )
  );

-- Bestaande projecten zonder eigenaar zijn nu onzichtbaar.
-- Koppel ze aan jezelf (vervang het id door jouw gebruiker uit Authentication > Users):
-- update public.projects set created_by = '00000000-0000-0000-0000-000000000000' where created_by is null;


-- 5. anonieme bezoekers: geen directe toegang -------------------------------

revoke all on public.projects         from anon;
revoke all on public.feedback_items   from anon;
revoke all on public.feedback_replies from anon;
revoke all on public.activity_log     from anon;
revoke all on public.profiles         from anon;


-- 7. reviewer-functies (geen account nodig, de reviewlink is de toegang) -----

-- Project, feedback en reacties van precies dit ene project.
-- Een ongeldige sleutel geeft null terug en dus geen enkele data (TE-03).
create or replace function public.review_get(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
begin
  if p_key is null or length(p_key) < 32 then
    return null;
  end if;

  select * into v_project from public.projects where public_key::text = p_key;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'project', jsonb_build_object(
      'id', v_project.id,
      'name', v_project.name,
      'url', v_project.url
    ),
    'feedback', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', f.id,
          'x_percent', f.x_percent,
          'y_percent', f.y_percent,
          'comment', f.comment,
          'page_path', f.page_path,
          'status', f.status,
          'created_at', f.created_at
        ) order by f.created_at
      )
      from public.feedback_items f
      where f.project_id = v_project.id
    ), '[]'::jsonb),
    'replies', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'feedback_id', r.feedback_id,
          'author_type', r.author_type,
          'author_name', r.author_name,
          'message', r.message,
          'created_at', r.created_at
        ) order by r.created_at
      )
      from public.feedback_replies r
      join public.feedback_items f on f.id = r.feedback_id
      where f.project_id = v_project.id
    ), '[]'::jsonb)
  );
end
$$;

-- Nieuw feedbackpunt: positie in procenten van de pagina (TE-04), pagina, tekst 1-500 tekens (FE-05).
-- De oude versie zonder p_page eerst weghalen.
drop function if exists public.review_add_feedback(text, double precision, double precision, text);

create or replace function public.review_add_feedback(
  p_key text,
  p_x double precision,
  p_y double precision,
  p_comment text,
  p_page text default '/'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
  v_item public.feedback_items%rowtype;
  v_comment text := btrim(coalesce(p_comment, ''));
  v_page text := coalesce(nullif(btrim(p_page), ''), '/');
begin
  if p_key is null or length(p_key) < 32 then
    raise exception 'Ongeldige reviewlink';
  end if;

  select * into v_project from public.projects where public_key::text = p_key;

  if not found then
    raise exception 'Ongeldige reviewlink';
  end if;

  if left(v_page, 1) <> '/' or length(v_page) > 300 then
    raise exception 'Ongeldige pagina';
  end if;

  if p_x is null or p_y is null
     or p_x < 0 or p_x > 100 or p_y < 0 or p_y > 100 then
    raise exception 'Ongeldige positie';
  end if;

  if length(v_comment) < 1 or length(v_comment) > 500 then
    raise exception 'Ongeldige tekst';
  end if;

  insert into public.feedback_items (project_id, page_path, x_percent, y_percent, comment, status)
  values (v_project.id, v_page, p_x, p_y, v_comment, 'open')
  returning * into v_item;

  insert into public.activity_log (project_id, created_by, actor_type, event_type, description)
  values (
    v_project.id, null, 'reviewer', 'feedback',
    'Nieuwe feedback geplaatst: ' || left(v_comment, 100)
  );

  return jsonb_build_object('id', v_item.id);
end
$$;

-- Nieuwe reactie van een reviewer, alleen op feedback van dit project (FE-08).
create or replace function public.review_add_reply(
  p_key text,
  p_feedback_id text,
  p_message text,
  p_author_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
  v_item public.feedback_items%rowtype;
  v_message text := btrim(coalesce(p_message, ''));
  v_name text := nullif(btrim(coalesce(p_author_name, '')), '');
begin
  if p_key is null or length(p_key) < 32 then
    raise exception 'Ongeldige reviewlink';
  end if;

  select * into v_project from public.projects where public_key::text = p_key;

  if not found then
    raise exception 'Ongeldige reviewlink';
  end if;

  select * into v_item
  from public.feedback_items f
  where f.id::text = p_feedback_id and f.project_id = v_project.id;

  if not found then
    raise exception 'Feedback niet gevonden';
  end if;

  if length(v_message) < 1 or length(v_message) > 500 then
    raise exception 'Ongeldige tekst';
  end if;

  if v_name is not null and length(v_name) > 80 then
    raise exception 'Naam te lang';
  end if;

  insert into public.feedback_replies (feedback_id, created_by, author_type, author_name, message)
  values (v_item.id, null, 'reviewer', v_name, v_message);

  insert into public.activity_log (project_id, created_by, actor_type, event_type, description)
  values (
    v_project.id, null, 'reviewer', 'reactie',
    'Nieuwe reactie: ' || left(v_message, 100)
  );

  return jsonb_build_object('ok', true);
end
$$;

revoke execute on function public.review_get(text) from public;
revoke execute on function public.review_add_feedback(text, double precision, double precision, text, text) from public;
revoke execute on function public.review_add_reply(text, text, text, text) from public;

grant execute on function public.review_get(text) to anon, authenticated;
grant execute on function public.review_add_feedback(text, double precision, double precision, text, text) to anon, authenticated;
grant execute on function public.review_add_reply(text, text, text, text) to anon, authenticated;
