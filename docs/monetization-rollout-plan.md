# Monetization Rollout Plan

## Amaç
- Premium üyelik ekranını gerçek mağaza satın alma akışına bağlamak.
- Bağış ekranını platform kurallarına uygun ve kontrollü şekilde sunmak.
- Mağaza doğrulaması tamamlanana kadar güvensiz sunucu aktivasyonunu kapatmak.

## Kapsam
- Mobil uygulamada RevenueCat tabanlı premium teklif listeleme
- Satın alma ve `restore purchases` akışı
- Premium durumunun cihaz içinde güncellenmesi
- Güvensiz `activate subscription` endpoint davranışının varsayılan olarak kapatılması

## Kapsam Dışı
- Apple makbuz doğrulama servisi
- Google Play satın alma token doğrulama servisi
- Finansal raporlama ve muhasebe entegrasyonları
- Bölgesel vergi hesaplama otomasyonu

## Gerekli Ortam Değişkenleri
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`
- İsteğe bağlı geliştirme bayrağı: `AllowUnsafeDirectSubscriptionActivation=false`

## Uygulama Akışı
1. Uygulama açıldığında oturumdaki kullanıcı kimliği ile RevenueCat başlatılır.
2. Premium ekranı mağaza tekliflerini RevenueCat üzerinden çeker.
3. Kullanıcı bir paketi seçtiğinde mağaza satın alma diyaloğu açılır.
4. Satın alma başarılıysa aktif entitlement okunur ve uygulama reklamları kapatır.
5. Kullanıcı cihaz değiştirdiğinde `Satın Alımları Geri Yükle` ile entitlement tekrar eşitlenir.

## Yayın Öncesi Yapılacaklar
1. App Store Connect içinde aylık ve yıllık abonelik ürünlerini aç.
2. Play Console içinde abonelik ürünlerini aç.
3. RevenueCat dashboard üzerinde ürün eşleştirmelerini ve `premium` entitlement'ını tanımla.
4. Premium ekranı için ürün başlıklarını ve açıklamalarını RevenueCat/store tarafında doğrula.
5. iOS üzerinde sandbox satın alma testi yap.
6. Android üzerinde lisans test hesabıyla satın alma testi yap.
7. `AllowUnsafeDirectSubscriptionActivation` ayarının production ortamında `false` kaldığını doğrula.

## Kabul Kriterleri
- Premium ekranı en az bir mağaza paketini fiyatıyla birlikte gösterir.
- Satın alma iptal edildiğinde uygulama hata durumuna düşmez.
- Başarılı satın alma sonrası reklam durumu aynı oturumda reklamsız olur.
- `Satın Alımları Geri Yükle` mevcut entitlement'ı geri getirir.
- Store doğrulaması yapılmadan backend kullanıcıyı `vip` rolüne yükseltmez.
- Bağış ekranı çalışmaya devam eder ve premium ekranından bağımsızdır.
