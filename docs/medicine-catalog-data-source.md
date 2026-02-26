# Medicine Catalog Data Source

Bu projede ilaç katalog verisi uygulama tarafından yalnızca veritabanından okunur.

- CSV kaynak dosyası: `docs/pharmananda-medicine-database.csv`
- Başlangıçta CSV -> DB senkronizasyonu: `api/services/medicine-catalog-persistence/medicine-catalog-seeder.cs`
- Katalog arama servisi `medicine-catalog` tablosunu sorgular.
- Senkronizasyon yalnızca ekleme/güncelleme yapar; veritabanındaki mevcut satırları silmez.
- Başlangıçta otomatik DB temizleme kapalıdır (`Defaults:ResetDataOnStartup=false`).
