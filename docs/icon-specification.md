# Icon Spesifikasyonu

## 1. Doküman Bilgisi
- Proje Adı: İlaç Hatırlatma Uygulaması
- Doküman Tipi: Icon Spesifikasyonu
- Versiyon: 1.0
- Tarih: 2026-02-15
- Kaynak:
  - `/Users/k.ss200061/Downloads/Icon Pack/01-General.svg`

## 2. Amaç
Bu doküman, React Native uygulamasında ikonların tek bir standarda göre isimlendirilmesini, boyutlandırılmasını ve durum bazlı renklendirilmesini tanımlar.

## 3. Kullanım İlkeleri
- Tüm ikonlar component bazında merkezi bir `icon-map` ile yönetilmelidir.
- İkon adları İngilizce ve `kebab-case` olmalıdır.
- Aynı anlam için farklı ikon kullanılmamalıdır.
- Etkileşimli ikonlarda minimum dokunma alanı `44x44` olmalıdır.

## 4. Boyut Tokenları
- `icon-xs`: `12`
- `icon-sm`: `16`
- `icon-md`: `20`
- `icon-lg`: `24`
- `icon-xl`: `32`

## 5. Renk Kuralları
- Varsayılan ikon rengi: `neutral-700`
- Aktif durum: `primary-blue-500`
- Pasif/disabled durum: `neutral-300`
- Kritik/hata durumu: `error-500`
- Başarı durumu: `success-500`

## 6. Önerilen İkon Sözlüğü (UI’ye Göre)
- `tab-home`: Today sekmesi
- `tab-pill`: My Meds sekmesi
- `tab-add`: Add Meds sekmesi
- `tab-settings`: Setting sekmesi
- `nav-back`: geri navigasyon
- `search`: arama
- `calendar`: tarih seçimi
- `clock`: saat seçimi
- `notification`: bildirim ayarı
- `volume`: bildirim sesi
- `vibration`: titreşim
- `language`: dil
- `zoom`: display zoom
- `lock`: güvenlik/şifre
- `profile`: profil
- `info`: about
- `close`: modal kapatma
- `check`: başarılı işlem
- `warning`: uyarı
- `error`: hata

## 7. React Native Implementasyon Sözleşmesi
- Önerilen dosyalar:
  - `mobile-app/src/components/icon/icon.tsx`
  - `mobile-app/src/components/icon/icon-map.ts`
- `icon` component props:
  - `name`: ikon adı (`IconName` union type)
  - `size`: boyut tokenı
  - `color`: semantic renk tokenı
  - `accessibilityLabel`: ekran okuyucu etiketi

## 8. Erişilebilirlik
- Salt dekoratif ikonlar için `accessibilityElementsHidden` kullanılmalıdır.
- Aksiyon tetikleyen ikonlar için anlamlı `accessibilityLabel` zorunludur.
- Renk körlüğü senaryolarında anlam sadece ikon rengiyle verilmemelidir; metin/etiket eşlik etmelidir.

## 9. Kabul Kriterleri
1. Üretimde kullanılan tüm ikon adları `icon-map` içinde tanımlı olmalıdır.
2. Tab bar ikonları aktif/pasif durumda farklı renk tokenlarıyla doğrulanmalıdır.
3. Aksiyon ikonlarının dokunma alanı en az `44x44` olmalıdır.
4. Kritik ekranlarda (today, add-meds, settings) ikonlar ekran okuyucu etiketiyle testten geçmelidir.

## 10. Açık Konular
- Yeni ekran eklendikçe ikon sözlüğü genişletilecektir.
- Figma’dan gelecek ek ikon paketleri bu dokümana yeni versiyon olarak işlenecektir.
