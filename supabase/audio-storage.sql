-- Supabase Storage: yüklenen ses dosyaları bucket'ı + RLS.
-- Supabase SQL Editor'de çalıştırın (storage tabloları storage schema'sında yaşar).

-- 1) Bucket'ı oluştur (public okuma, anon yazma için RLS'e bırakıyoruz).
insert into storage.buckets (id, name, public)
values ('audio-files', 'audio-files', true)
on conflict (id) do nothing;

-- 2) RLS'i etkinleştir.
alter table storage.objects enable row level security;

-- 3) Policy'leri tanımla (drop-if-exists: tekrar çalıştırılabilir olmalı).

-- Anon: herkes ses dosyası yükleyebilsin (insert + upload).
drop policy if exists "anon_audio_upload" on storage.objects;
create policy "anon_audio_upload" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'audio-files'
    and (storage.foldername(name))[1] in ('uploads', 'library')
  );

-- Anon: herkes yüklenen sesleri okuyabilsin (select). Bucket public olduğu için
-- zaten CDN üzerinden erişilebilir; yine de listeleme için select gerekir.
drop policy if exists "anon_audio_select" on storage.objects;
create policy "anon_audio_select" on storage.objects
  for select to anon
  using (bucket_id = 'audio-files');

-- Anon: silme/güncelleme kasıtlı olarak kapalı (referans kontrolü olmadan
-- otomatik silme yok — temizlik yalnızca sahibi/operatör tarafından yapılır).
