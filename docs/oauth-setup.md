# OAuth Kurulum Rehberi (Google + Apple)

## Amaç
Bu doküman, mobil uygulamada gerçek `Continue with Google` ve `Continue with Apple` akışını çalıştırmak için gerekli minimum konfigürasyonu tanımlar.

## Önkoşullar
- Xcode ve iOS Simulator kurulu.
- Uygulama `mobile-app` klasöründen çalıştırılıyor.
- API ayakta (`http://127.0.0.1:5047`).

## 1. Ortam Değişkenleri
`mobile-app/.env` dosyası oluşturun (şablon: `mobile-app/.env.example`):

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:5047
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_GOOGLE_IOS_CLIENT_ID
```

## 2. Google OAuth İstemcisi
Google Cloud Console üzerinde OAuth Client oluşturun:
- Tür: `iOS`
- Bundle ID: `com.anonymous.medication-reminder`
- Üretilen Client ID değerini `.env` içine `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` olarak yazın.

## 3. Apple Sign In
- iOS simulator’da Apple ID ile giriş yapılmış olmalı.
- Uygulama iOS development build olarak açılmalı (`npm run ios`).

## 4. Çalıştırma
```bash
cd /Users/k.ss200061/Documents/medication-reminder-app/mobile-app
npx expo start -c
npm run ios
```

## Kabul Kriterleri
- `Continue with Google` tıklanınca Google hesap seçimi ekranı açılır.
- Google akışı tamamlandığında uygulama hata vermeden oturum açar.
- `Continue with Apple` tıklanınca Apple giriş modalı açılır.
- Apple akışı tamamlandığında uygulama hata vermeden oturum açar.
