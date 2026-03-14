# Store Launch Configuration

## Amaç
- Store çıkışına yakın dönemde gerekli tüm monetization ayarlarını tek yerde toplamak.
- Frontend, backend ve mağaza panelleri için eksik bırakılmaması gereken kurulumları izlenebilir hale getirmek.

## Clean Architecture Kapsamı
- Backend monetization iş kuralları `api-application/monetization-application/` altında tutulur.
- Backend persistence adaptörleri `api/services/monetization-persistence/` altında tutulur.
- Frontend monetization domain tipleri `mobile-app/src/features/monetization/domain/` altında tutulur.
- Frontend application state orkestrasyonu `mobile-app/src/features/monetization/application/` altında tutulur.
- Frontend altyapı servisleri `mobile-app/src/features/monetization/` altındaki servis dosyalarından sağlanır.

## Gerekli Frontend Ayarları
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`
- `EXPO_PUBLIC_DONATION_URL`
- `EXPO_PUBLIC_SUPPORT_EMAIL`
- İsteğe bağlı, sadece local geliştirme için:
  - `EXPO_PUBLIC_ALLOW_DIRECT_SUBSCRIPTION_ACTIVATION=false`

## Gerekli Backend Ayarları
- `AllowUnsafeDirectSubscriptionActivation=false`
- `DB_CONNECTION_STRING`
- `Authentication__Jwt__Issuer`
- `Authentication__Jwt__Audience`
- `Authentication__Jwt__SecretKey`

## App Store Connect Ayarları
- Auto-renewable subscription grubu oluştur
- En az iki ürün tanımla:
  - `premium-monthly`
  - `premium-yearly`
- Review metadata doldur:
  - açıklama
  - fiyat bilgisi
  - screenshot
  - review note
- Sandbox test account oluştur

## Google Play Console Ayarları
- Subscription ürünleri oluştur
- Base plan ve offer yapılarını tanımla
- Test lisans hesabı ekle
- Store listing içinde premium açıklamalarını güncelle

## RevenueCat Ayarları
- App tanımla:
  - iOS bundle id: `com.suleymansanver.medicationreminder`
- Entitlement:
  - `premium`
- Offering:
  - `default`
- Package eşleştirmeleri:
  - monthly -> `premium-monthly`
  - annual -> `premium-yearly`

## Çıkış Öncesi Kontrol Listesi
1. Guest kullanıcı premium ekranında sessiz hata yaşamıyor olmalı.
2. Giriş yapmış kullanıcı için store ürünleri fiyatla listeleniyor olmalı.
3. Satın alma sonrası `vip` durumu local state içinde güncelleniyor olmalı.
4. `Restore purchases` çalışıyor olmalı.
5. Backend tarafında doğrulamasız aktivasyon production’da kapalı olmalı.
6. Bağış bağlantısı dış tarayıcıda açılıyor olmalı.
7. Destek e-postası açılıyor olmalı.

## Kabul Kriterleri
- Tüm gerekli environment ayarları bir dokümanda kayıtlı olmalı.
- Apple, Google ve RevenueCat için eksik panel ayarı kalmamalı.
- Frontend ve backend monetization akışı katmanlı yapı ile izlenebilir olmalı.
