# Canli Oncesi Checklist

## Amac
- Canliya cikisi engelleyebilecek eksik ayar ve operasyonel riskleri tek yerde toplamak.
- Cikis oncesi "tamam / eksik / bloke" takibini test edilebilir hale getirmek.

## Kritik Blokerler
1. Feedback akisi sadece `POST /api/feedback` uzerinden veritabanindaki `feedback` tablosuna kayit atiyor.
   Kabul kriteri: Gonderilen kayitlarin kim tarafindan nasil takip edilecegi net olmali.
   Eksik durum: Admin panel, e-posta yonlendirmesi, ticket entegrasyonu veya operasyonel takip akisi tanimli degil.
2. `Submit` butonu mesaj `10` karaktere ulasmadan aktif olmuyor.
   Kabul kriteri: Kullanici ekranda neden pasif oldugunu gorebilmeli.
   Durum: Ekranda yardim metni eklendi; yine de minimum metin kurali urun notlarinda belirtilmeli.
3. Production API adresi dogrulanmali.
   Dosya: `mobile-app/src/features/network/api-client.ts`
   Kabul kriteri: `EXPO_PUBLIC_API_BASE_URL` production ortaminda dogru domaine ayarlanmis olmali.
   Risk: Varsayilan fallback URL ile yanlis ortama cikilabilir.
4. Backend CORS politikasi sadece local origin'leri kabul ediyor.
   Dosya: `api/Program.cs`
   Kabul kriteri: Production domain ve gerekli web origin'leri CORS listesine eklenmis olmali.
   Risk: Web istemcileri veya panel entegrasyonlari production'da API'ye erisemeyebilir.
5. Premium store entegrasyonu henuz canli anahtarlarla tamamlanmadi.
   Kabul kriteri: RevenueCat entitlement, App Store Connect urunleri ve Google Play subscription urunleri eslenmis olmali.
   Risk: Premium kartlari preview davranisinda kalir.

## Mobil Ortam Ayarlari
- `EXPO_PUBLIC_API_BASE_URL`
  Kabul kriteri: Production API base URL ile set edilmeli.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  Kabul kriteri: iOS Google login gercek client id ile dogrulanmali.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
  Kabul kriteri: Android build alinacaksa zorunlu olarak tanimlanmali.
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`
- `EXPO_PUBLIC_DONATION_URL`
  Kabul kriteri: Gercek ve ulasilabilir bagis sayfasina gitmeli.
- `EXPO_PUBLIC_SUPPORT_EMAIL`
  Kabul kriteri: Destek ekibinin aktif kullandigi e-posta olmali.
- `EXPO_PUBLIC_APP_STORE_URL`
  Kabul kriteri: Paylasim akisinda gercek App Store linkine gitmeli.
- `EXPO_PUBLIC_PLAY_STORE_URL`
  Kabul kriteri: Android yayininda gercek Play Store linkine gitmeli.
- `EXPO_PUBLIC_ALLOW_DIRECT_SUBSCRIPTION_ACTIVATION`
  Kabul kriteri: Production'da `false` olmali.

## Backend Ortam Ayarlari
- `DB_CONNECTION_STRING`
  Kabul kriteri: Production veritabani baglantisi canli sorgu ile dogrulanmali.
- `Authentication__Jwt__Issuer`
- `Authentication__Jwt__Audience`
- `Authentication__Jwt__SecretKey`
  Kabul kriteri: Production sir degerleri ile ayarli olmali.
- `AllowUnsafeDirectSubscriptionActivation`
  Kabul kriteri: Production'da `false` olmali.
- `Swagger__Enabled`
  Kabul kriteri: Production politikana gore kapali veya erisim kontrollu olmali.

## Feedback Akisi
- Gonderim hedefi:
  - Mobil: `mobile-app/src/features/feedback/feedback-service.ts`
  - API: `api/Controllers/feedback-controller.cs`
  - Veritabani tablo adi: `feedback`
- Su anki davranis:
  - Mesaj en az `10` karakter olmadan gonderilmez.
  - Kayit API'ye gider ve veritabanina `open` status'u ile yazilir.
  - E-posta bildirimi veya harici ticket sistemi entegrasyonu yok.
- Canli oncesi karar:
  1. Veritabani kaydi yeterli mi?
  2. Yoksa support inbox, helpdesk veya Slack/Teams bildirimine yonlendirme eklenecek mi?
  Kabul kriteri: Her feedback kaydinin operasyonel sahibi belli olmali.

## Store ve Monetization Kontrolleri
- App Store Connect subscription urunleri olusturuldu.
- Google Play subscription urunleri olusturuldu.
- RevenueCat entitlement `premium` tanimli.
- RevenueCat offering `default` tanimli.
- `premium-monthly` ve `premium-yearly` urunleri RevenueCat paketlerine eslendi.
- Restore purchases iOS ve Android test hesaplariyla calisti.
- Bagis linki dis tarayicida acildi.
- Destek e-postasi cihazdan acildi.

## Auth ve Guvenlik Kontrolleri
- Google iOS login production client id ile test edildi.
- Google Android login production client id ile test edildi.
- Guest session yenileme production API ile test edildi.
- Email verification akisi gercek SMTP/env ile test edildi.
- Silinen hesap ve logout sonrasi token temizligi dogrulandi.

## Operasyonel Kontroller
- Feedback kayitlarini kim takip edecek netlestirildi.
- Production log izleme yontemi netlestirildi.
- Crash ve hata izleme araci tanimli.
- Destek e-postasi ve bagis linki manuel tiklama testi yapildi.
- Privacy policy ve terms linkleri store metadata ile uyumlu.

## Cikis Gunu Son Kontrol
1. Production env dosyalari / CI secrets guncel.
2. Production API ayakta ve `SELECT 1` veya uygulama baslangic logu ile DB baglantisi dogrulandi.
3. iOS archive / Android release build alindi.
4. Premium preview degil, gercek store urunlerini listeliyor.
5. Feedback gonderimi production API'ye yaziyor ve operasyon ekibi bu kaydi gorebiliyor.
6. Paylasim linkleri gercek store sayfalarina gidiyor.
7. Bagis ve destek aksiyonlari canli adresleri aciyor.

## Notlar
- Bu liste release'e yakin her seferinde tekrar gozden gecirilmeli.
- Yayin tarihi belli oldugunda bu checklist uzerinden son bir "go / no-go" gecisi yapilmali.
