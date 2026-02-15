# Mobile Style Guide Uygulama Notlari

## Kapsam
- Bu dokuman, mobil uygulamada uygulanan temel tema tokenlarini ozetler.
- Kaynak: paylasilan style guide gorselleri (renk, tipografi, grid, radius, spacing).

## Renk Tokenlari
- `primary-blue`: `50-900` tam skala (`#EAEFFB` -> `#06122B`)
- `neutral`: `50-900` tam skala (`#F2F2F2` -> `#151515`)
- `success`: `50, 200, 500, 800`
- `error`: `50, 200, 500, 800`
- `warning`: `200, 500, 800`
- `info`: `200, 500, 800`
- Semantik tokenlar:
- `background-default`, `background-subtle`
- `text-primary`, `text-secondary`
- `brand-primary`
- `state-success`, `state-success-soft`
- `state-error`, `state-error-soft`
- `state-warning`, `state-warning-soft`
- `state-info`, `state-info-soft`

## Tipografi Tokenlari
- Font ailesi: `Roboto`
- Agirliklar: `regular(400)`, `medium(500)`, `semibold(600)`, `bold(700)`
- Gruplar:
- `display`: `d1, d2, d3`
- `heading`: `h1-h8`
- `body-scale`: `xl, l, m, xm`
- `button`: `xl, l, m, s, xs`
- `caption-scale`: `l, m`
- Geriye donuk uyumluluk:
- `heading1`, `heading5`, `body`, `caption` aliaslari korunmustur.

## Layout Tokenlari
- Grid:
- `columns: 4`
- `type: stretch`
- `gutter-width: 16`
- `margin-width: 20`
- Referans frame: `440x956`
- Radius: `4, 8, 16, 24, 32`
- Spacing: `4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96`

## Kabul Kriterleri
- `mobile-app/src/theme/colors.ts` dosyasinda yukaridaki renk tokenlari birebir bulunmalidir.
- `mobile-app/src/theme/typography.ts` dosyasinda style guide tipografi setleri ve aliaslar bulunmalidir.
- `mobile-app/src/theme/grid.ts` dosyasinda `4-column`, `gutter 16`, `margin 20` degerleri bulunmalidir.
- `mobile-app/src/navigation/app-navigator.tsx` ekran icerik padding degeri `theme.grid.marginWidth` olmalidir.
- `mobile-app/src/components/ui/primary-button.tsx` buton etiketi `theme.typography.button.sMedium` kullanmalidir.
