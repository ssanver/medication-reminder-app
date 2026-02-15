# Icon Pack Entegrasyon Notu

## Kaynak
- Dosya: `mobile-app/src/assets/icons/01-general.svg`
- Orijinal konum: `/Users/k.ss200061/Downloads/Icon Pack/01-General.svg`

## Durum
- Icon pack projeye kopyalandi ve versiyonlandi.
- Uygulamada merkezi icon katmani eklendi:
- `mobile-app/src/components/ui/app-icon.tsx`
- `mobile-app/src/components/ui/bottom-nav.tsx` iconlari bu katmani kullanir.

## Teknik Not
- Mevcut `01-general.svg` tek bir sprite/artboard dosyasi oldugu icin iconlar tek tek isimlendirilebilir durumda degil.
- Bu nedenle gecici olarak `app-icon` icinde ad->glyph map kullanilmistir.

## Sonraki Adim (Tam Esleme)
- `01-general.svg` dosyasindan ihtiyac duyulan iconlar tekil SVG dosyalara ayrilacak.
- Her icon icin adlandirma yapilacak (`home`, `pill`, `add`, `settings`, vb.).
- `app-icon` bileşeni `react-native-svg` tabanli olarak bu tekil varliklari render edecek.

## Kabul Kriterleri
- `mobile-app/src/assets/icons/01-general.svg` repo icinde bulunmali.
- `bottom-nav` icon renderi `app-icon` uzerinden gecmeli.
- `app-icon` tek noktadan icon adi ile kullanilabilir olmalı.
