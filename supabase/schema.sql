-- Supabase şeması: supabase SQL Editor'de çalıştırın (veya `supabase db push`)
-- Tebrik linklerini tutan tablo.

create table if not exists public.greetings (
  id text primary key,
  template text not null,
  palette text,
  name text,
  message text,
  audio jsonb,
  photo text,
  video text,
  position text,
  effect text,
  effects jsonb,
  photo_pos jsonb,
  text_pos jsonb,
  effect_scale real,
  video_scale real,
  animation_speed real,
  text_font text,
  created_at timestamptz not null default now()
);

-- Mevcut tablolara palet, ses, fotoğraf ve video sütunlarını ekler (create table if not exists kullanıldığı için)
alter table public.greetings add column if not exists palette text;
alter table public.greetings add column if not exists audio jsonb;
alter table public.greetings add column if not exists photo text;
alter table public.greetings add column if not exists video text;
alter table public.greetings add column if not exists position text;
alter table public.greetings add column if not exists effect text;
alter table public.greetings add column if not exists effects jsonb;
alter table public.greetings add column if not exists photo_pos jsonb;
alter table public.greetings add column if not exists text_pos jsonb;
alter table public.greetings add column if not exists effect_scale real;
alter table public.greetings add column if not exists video_scale real;
alter table public.greetings add column if not exists animation_speed real;
alter table public.greetings add column if not exists text_font text;

-- İsim artık zorunlu değil (eski tablolarda NOT NULL olabilir)
alter table public.greetings alter column name drop not null;

alter table public.greetings enable row level security;

-- Anon anahtarı: herkes mesaj oluşturabilmeli (insert) ve okuyabilmeli (select).
-- Güncelleme/silme kasıtlı olarak kapalı.
-- Drop-if-exists: SQL'i tekrar çalıştırırsan "policy already exists" hatası vermesin.
drop policy if exists "anon_greetings_insert" on public.greetings;
create policy "anon_greetings_insert" on public.greetings
  for insert to anon
  with check (true);

drop policy if exists "anon_greetings_select" on public.greetings;
create policy "anon_greetings_select" on public.greetings
  for select to anon
  using (true);

create index if not exists greetings_created_at_idx on public.greetings (created_at desc);

-- Davetiye linklerini tutan tablo (Faz B — düğün/nikah/sünnet/kutlama).
create table if not exists public.invitations (
  id text primary key,
  theme text not null,
  name text,
  event_type text not null,
  partner_a text not null,
  partner_b text,
  event_date text not null,
  time text,
  venue text not null,
  city text,
  address text,
  message text,
  audio jsonb,
  photo text,
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

drop policy if exists "anon_invitations_insert" on public.invitations;
create policy "anon_invitations_insert" on public.invitations
  for insert to anon
  with check (true);

drop policy if exists "anon_invitations_select" on public.invitations;
create policy "anon_invitations_select" on public.invitations
  for select to anon
  using (true);

create index if not exists invitations_created_at_idx on public.invitations (created_at desc);
