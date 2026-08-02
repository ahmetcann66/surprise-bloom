-- Supabase şeması: supabase SQL Editor'de çalıştırın (veya `supabase db push`)
-- Tebrik linklerini tutan tablo.

create table if not exists public.greetings (
  id text primary key,
  template text not null,
  palette text,
  name text not null,
  message text,
  audio jsonb,
  photo text,
  video text,
  created_at timestamptz not null default now()
);

-- Mevcut tablolara palet, ses, fotoğraf ve video sütunlarını ekler (create table if not exists kullanıldığı için)
alter table public.greetings add column if not exists palette text;
alter table public.greetings add column if not exists audio jsonb;
alter table public.greetings add column if not exists photo text;
alter table public.greetings add column if not exists video text;

alter table public.greetings enable row level security;

-- Anon anahtarı: herkes mesaj oluşturabilmeli (insert) ve okuyabilmeli (select).
-- Güncelleme/silme kasıtlı olarak kapalı.
create policy "anon_greetings_insert" on public.greetings
  for insert to anon
  with check (true);

create policy "anon_greetings_select" on public.greetings
  for select to anon
  using (true);

create index if not exists greetings_created_at_idx on public.greetings (created_at desc);
