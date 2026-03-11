# IPA QR Dağıtımı

- `MedicationReminder.ipa`: Son iOS build dosyası.
- `medication-reminder-ipa-qr.png`: GitHub üzerindeki IPA dosya sayfasına yönlendiren QR.

IPA üretim komutu:
1. `./mobile-app/scripts/build-ios-ipa.sh`
2. Script tamamlandığında `qr/MedicationReminder.ipa` otomatik güncellenir.
3. Script, IPA içinde `main.jsbundle` doğrulaması yapar; doğrulama geçmezse hata verip durur.

Kurulum:
1. QR kodu telefonla aç.
2. GitHub'da giriş yap.
3. `MedicationReminder.ipa` dosyasını indirip kurulum adımlarını tamamla.
