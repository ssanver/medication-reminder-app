# Sıklık Akışı Video Analizi (2026-02-28)

## Gözlemler (Videodan)
- Sıklık seçimi tek ekranda hızlı karar odaklı sunuluyor.
- Kullanıcıya ilk etapta hazır seçenekler gösteriliyor:
  - Günde 1 kez
  - Günde 2 kez
  - Gerektiğinde (hatırlatma yok)
  - Daha fazla seçenek
- Hızlı seçim sonrası "Sonraki" butonu net şekilde aktif/pasif oluyor.
- "Daha fazla seçenek" ile detaylı konfigürasyon akışına geçiliyor.

## Bizim Uygulama İçin Önerilen Hedef Akış
- `add-meds` içindeki `frequency` adımında önce hızlı kartlar:
  - `Günde 1 kez`
  - `Günde 2 kez`
  - `Daha fazla seçenek`
- Kullanıcı hızlı seçim yaparsa detay alanları gizli kalır (daha az karmaşa).
- Kullanıcı `Daha fazla seçenek` seçerse mevcut detaylı ayarlar görünür:
  - Interval türü (gün/hafta)
  - Interval sayısı
  - Haftalık gün seçimi
  - Günlük doz sayısı

## Neden Mantıklı?
- Mevcut ekranı sadeleştirir ve karar süresini kısaltır.
- Yeni kullanıcı için "ilk ilaç ekleme" sürtünmesini azaltır.
- Mevcut backend sözleşmesini (daily/weekly + intervalCount + daysOfWeek) bozmadan ilerler.

## Yapılacak İşler (Backlog)
1. FE: `frequency` adımına hızlı seçenek kartları ekle.
2. FE: Hızlı seçimde detay alanlarını gizle, `Daha fazla seçenek` ile aç.
3. FE: Seçim metinlerini localization JSON anahtarlarından oku.
4. BE: Schedule validasyonları (`repeatType`, `intervalCount`, `daysOfWeek`) mevcut kurallarla merkezi kalmaya devam etsin.
5. QA: Hızlı seçim + custom seçim için uçtan uca test senaryoları ekle.
6. QA: Gün/hafta + çoklu saat + haftanın başlangıç günü kombinasyon regresyonu koş.

## Sonraki Faz (Opsiyonel)
- `Gerektiğinde (hatırlatma yok)` seçeneği eklenecekse backend modelde açık bir iş kuralı gerekir:
  - ya yeni bir `repeatType` (örn. `as-needed`),
  - ya da hatırlatmasız ilaç için ayrı bir kayıt modeli.
- Bu faz mevcut DB/API sözleşmesini değiştireceği için ayrı PBI olarak ele alınmalı.

## Kabul Kriterleri
- Kullanıcı `Günde 1 kez` seçtiğinde:
  - `intervalUnit=day`, `intervalCount=1`, `dosesPerDay=1` olur.
- Kullanıcı `Günde 2 kez` seçtiğinde:
  - `intervalUnit=day`, `intervalCount=1`, `dosesPerDay=2` olur.
- Kullanıcı `Daha fazla seçenek` seçtiğinde:
  - interval ve gün seçimi alanları görünür.
- Backend'e giden payload mevcut sözleşmeyle uyumlu kalır.
- TR/EN başta olmak üzere metinler JSON tabanlı localization'dan gelir.
