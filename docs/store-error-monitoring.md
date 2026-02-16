# Store Sonrası Hata İzleme

## Amaç
Canlı ortamda kullanıcıların yaşadığı sistemsel hataları sürüm bazlı takip ederek hızlı aksiyon almak.

## Veri Kaynağı
- API endpoint: `POST /api/system-errors`
- Tablo: `system-error-reports`
- Kritik alanlar:
  - `appVersion`
  - `platform`
  - `errorType`
  - `message`
  - `correlationId`
  - `occurredAt`

## Operasyon Akışı
1. Mobil uygulama global JS hatalarını yakalar.
2. Hata payload'ı API'ye gönderilir.
3. API kayıtları `system-error-reports` tablosuna yazar.
4. Ekip sürüm bazlı sorgu ile regresyonu izler.

## Release Kararı Kuralı
1. Aynı `appVersion` için hata yoğunluğu artarsa yeni issue açılır.
2. Kritik hata ise hotfix branch çıkarılır.
3. Düzeltme sonrası test/build kanıtı ile sürüm notu güncellenir.
