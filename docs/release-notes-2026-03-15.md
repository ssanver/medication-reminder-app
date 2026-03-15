# Release Notes - 2026-03-15

## Ozet
- `Today` ekranindaki tarih seridi yeniden yatay kaydirilabilir hale getirildi.
- Tab degisimi sonrasi geri donuldugunde tarih seridinin bosluk birakmasi engellendi.
- Programatik `scrollTo` ile kullanici kaydirmasi ayrildi; tarih artik kendi kendine degismemeli.

## Teknik Degisiklikler
- `mobile-app/src/screens/today-screen.tsx`
  - Tarih seridi icin yatay kaydirma davranisi guclendirildi.
  - Parent scroll ile child scroll cakismini azaltan koruma eklendi.
  - Tab geri donusunde secili gunu merkeze alan yeniden hizalama eklendi.
  - Programatik kaydirma sonrasi yanlis tarih secimini engelleyen koruma eklendi.
- `mobile-app/src/navigation/app-navigator.tsx`
  - `TodayScreen` icin aktif tab bilgisi gecilmeye baslandi.

## Dogrulama
- `npm exec tsc -- --noEmit`
- `npm test`
- `npx expo run:ios -d "iPhone 17 Pro Max" --port 8088`
- Guncel `.ipa` export ve fiziksel cihaza kurulum

## Bilinen Not
- Issue/board referansi paylasilmadigi icin issue durumu otomatik guncellenmedi.
