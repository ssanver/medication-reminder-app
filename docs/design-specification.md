# Tasarım Spesifikasyonu

## 1. Doküman Bilgisi
- Proje Adı: İlaç Hatırlatma Uygulaması
- Doküman Tipi: Tasarım Spesifikasyonu
- Versiyon: 1.0
- Tarih: 2026-02-15
- Kaynaklar:
  - `docs/business-requirements-document.md`
  - `docs/business-analysis.md`
  - `docs/technical-analysis.md`
  - Paylaşılan style guide görselleri

## 2. Amaç
Bu doküman, paylaşılan Figma style guide'ını React Native uygulamasında doğrudan uygulanabilir tasarım tokenlarına dönüştürür ve ekran implementasyonu için handoff standardını tanımlar.

## 3. Tasarım Kararları (Style Guide -> React Native)
- Font ailesi `Roboto` olarak sabitlenmiştir.
- Renk sistemi, temel (`primary-blue`, `neutral`) ve durum (`success`, `error`, `warning`, `info`) katmanlarıyla kullanılır.
- 4 kolon mobil grid standardı baz alınır.
- Spacing ölçeği 4 tabanlıdır.
- Radius ölçeği: `4, 8, 16, 24, 32`.
- Dokümanda belirtilmeyen değerler (gölge, border kalınlığı varyantları vb.) varsayılanlaştırılmıştır ve Figma ekran bazında doğrulanacaktır.

## 4. Design Tokens

### 4.1 Color Tokens

#### Primary Blue
- `primary-blue-50`: `#eaeffb`
- `primary-blue-100`: `#d3dff6`
- `primary-blue-200`: `#a4bdee`
- `primary-blue-300`: `#6897f3`
- `primary-blue-400`: `#3674ee`
- `primary-blue-500`: `#1256db`
- `primary-blue-600`: `#0e45b0`
- `primary-blue-700`: `#0b3484`
- `primary-blue-800`: `#0b2455`
- `primary-blue-900`: `#06122b`

#### Neutral
- `neutral-50`: `#f2f2f2`
- `neutral-100`: `#e6e6e6`
- `neutral-200`: `#cecece`
- `neutral-300`: `#b6b6b6`
- `neutral-400`: `#9e9e9e`
- `neutral-500`: `#868686`
- `neutral-600`: `#6b6b6b`
- `neutral-700`: `#505050`
- `neutral-800`: `#353535`
- `neutral-900`: `#151515`

#### Status Colors
- `success-50`: `#e6f5e6`
- `success-200`: `#b0e1b0`
- `success-500`: `#009e00`
- `success-800`: `#0d3616`
- `error-50`: `#fce6e6`
- `error-200`: `#f4b0b0`
- `error-500`: `#dc0000`
- `error-800`: `#4d0000`
- `warning-200`: `#ffebb2`
- `warning-500`: `#f6b500`
- `warning-800`: `#805e00`
- `info-200`: `#82c3df`
- `info-500`: `#007baf`
- `info-800`: `#003146`

### 4.2 Semantic Color Mapping
- `background-default`: `#ffffff`
- `background-subtle`: `neutral-50`
- `surface-default`: `#ffffff`
- `surface-muted`: `neutral-100`
- `text-primary`: `neutral-900`
- `text-secondary`: `neutral-700`
- `text-tertiary`: `neutral-500`
- `text-inverse`: `#ffffff`
- `border-default`: `neutral-200`
- `border-strong`: `neutral-400`
- `brand-primary`: `primary-blue-500`
- `brand-primary-pressed`: `primary-blue-600`
- `brand-primary-disabled`: `primary-blue-200`
- `state-success`: `success-500`
- `state-error`: `error-500`
- `state-warning`: `warning-500`
- `state-info`: `info-500`

### 4.3 Typography Tokens

#### Display
- `display-1-semibold`: `font-size 46`, `line-height 55`, `font-weight 600`
- `display-2-semibold`: `font-size 42`, `line-height 50`, `font-weight 600`
- `display-3-semibold`: `font-size 36`, `line-height 43`, `font-weight 600`

#### Heading
- `heading-1-bold`: `font-size 32`, `line-height 38`, `font-weight 700`
- `heading-2-semibold`: `font-size 30`, `line-height 36`, `font-weight 600`
- `heading-3-regular`: `font-size 24`, `line-height 29`, `font-weight 400`
- `heading-4-medium`: `font-size 20`, `line-height 24`, `font-weight 500`
- `heading-5-semibold`: `font-size 18`, `line-height 22`, `font-weight 600`
- `heading-6-medium`: `font-size 18`, `line-height 22`, `font-weight 500`
- `heading-7-medium`: `font-size 16`, `line-height 19`, `font-weight 500`
- `heading-8-semibold`: `font-size 14`, `line-height 17`, `font-weight 600`

#### Body
- `body-xl-regular`: `font-size 20`, `line-height 24`, `font-weight 400`
- `body-xl-medium`: `font-size 16`, `line-height 24`, `font-weight 500`
- `body-l-bold`: `font-size 14`, `line-height 17`, `font-weight 700`
- `body-l-medium`: `font-size 14`, `line-height 17`, `font-weight 500`
- `body-m-regular`: `font-size 14`, `line-height 17`, `font-weight 400`
- `body-xm-medium`: `font-size 12`, `line-height 14`, `font-weight 500`
- `body-xm-regular`: `font-size 12`, `line-height 14`, `font-weight 400`

#### Button
- `button-xl-regular`: `font-size 24`, `line-height 29`, `font-weight 400`
- `button-xl-medium`: `font-size 20`, `line-height 24`, `font-weight 500`
- `button-l-medium`: `font-size 18`, `line-height 22`, `font-weight 500`
- `button-l-regular`: `font-size 18`, `line-height 22`, `font-weight 400`
- `button-m-medium`: `font-size 16`, `line-height 19`, `font-weight 500`
- `button-m-regular`: `font-size 16`, `line-height 19`, `font-weight 400`
- `button-s-medium`: `font-size 14`, `line-height 17`, `font-weight 500`
- `button-s-regular`: `font-size 14`, `line-height 17`, `font-weight 400`
- `button-xs-medium`: `font-size 12`, `line-height 14`, `font-weight 500`
- `button-xs-regular`: `font-size 12`, `line-height 14`, `font-weight 400`

#### Caption
- `caption-l-regular`: `font-size 12`, `line-height 14`, `font-weight 400`
- `caption-m-regular`: `font-size 10`, `line-height 12`, `font-weight 400`

### 4.4 Spacing Tokens
- `space-4`: `4`
- `space-8`: `8`
- `space-16`: `16`
- `space-24`: `24`
- `space-32`: `32`
- `space-40`: `40`
- `space-48`: `48`
- `space-56`: `56`
- `space-64`: `64`
- `space-72`: `72`
- `space-80`: `80`
- `space-88`: `88`
- `space-96`: `96`

### 4.5 Radius Tokens
- `radius-4`: `4`
- `radius-8`: `8`
- `radius-16`: `16`
- `radius-24`: `24`
- `radius-32`: `32`

### 4.6 Grid Tokens (Mobile)
- `grid-columns`: `4`
- `grid-gutter`: `16`
- `grid-margin`: `20`
- `grid-type`: `stretch`
- Referans frame: `440x956`

### 4.7 Size Tokens
- Nokta örneğinden türetilen temel boyut adımları: `4`, `8`, `16`, `24`.
- İkon ve dokunma alanı standardı (erişilebilirlik için):
  - `icon-sm`: `16`
  - `icon-md`: `20`
  - `icon-lg`: `24`
  - `touch-target-min`: `44`

## 5. React Native Theme Sözleşmesi

### 5.1 Önerilen Dosya Yapısı
- `mobile-app/src/theme/colors.ts`
- `mobile-app/src/theme/typography.ts`
- `mobile-app/src/theme/spacing.ts`
- `mobile-app/src/theme/radius.ts`
- `mobile-app/src/theme/grid.ts`
- `mobile-app/src/theme/index.ts`

### 5.2 Örnek Token Çıkışı
```ts
export const colors = {
  primaryBlue: {
    50: '#EAEFFB',
    100: '#D3DFF6',
    200: '#A4BDEE',
    300: '#6897F3',
    400: '#3674EE',
    500: '#1256DB',
    600: '#0E45B0',
    700: '#0B3484',
    800: '#0B2455',
    900: '#06122B',
  },
  neutral: {
    50: '#F2F2F2',
    100: '#E6E6E6',
    200: '#CECECE',
    300: '#B6B6B6',
    400: '#9E9E9E',
    500: '#868686',
    600: '#6B6B6B',
    700: '#505050',
    800: '#353535',
    900: '#151515',
  },
};

export const spacing = {
  4: 4,
  8: 8,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  56: 56,
  64: 64,
  72: 72,
  80: 80,
  88: 88,
  96: 96,
} as const;
```

## 6. Erişilebilirlik Kuralları
- Kritik metin kontrastı en az `4.5:1` olmalıdır.
- Büyük metin (>= 18pt veya >= 14pt bold) için kontrast en az `3:1` olmalıdır.
- Tıklanabilir elemanlar için minimum dokunma alanı `44x44` px olmalıdır.
- Font ölçekleme (`fontScale`) kapatılmayacaktır.
- Durum renkleri (`success/error/warning/info`) sadece renkle değil, metin/ikon desteği ile verilecektir.

## 7. Durum Bazlı Bileşen İlkeleri
- Buton durumları: `default`, `pressed`, `disabled`, `loading`.
- Form alanları: `default`, `focused`, `filled`, `error`, `disabled`.
- Bilgilendirme kartları: `info`, `success`, `warning`, `error` tonlarıyla semantic renklerden türetilir.
- Boş durumlarda ikon + başlık + kısa açıklama + birincil CTA birlikte bulunmalıdır.
- Hata durumlarında kullanıcıya düzeltme aksiyonu sunulmalıdır.

## 8. Geliştirici Handoff Checklist (Ekran Bazlı)

### 8.1 Ortak Kontroller (Tüm Ekranlar)
- Grid: 4 kolon, `16` gutter, `20` yatay margin uygulanmış.
- Tipografi sadece tanımlı token'lardan seçilmiş.
- Spacing/radius değerleri sadece token listesinden seçilmiş.
- TR/EN içeriklerde satır taşması ve kırılım kontrol edilmiş.
- VoiceOver/TalkBack etiketleri kritik aksiyonlarda tanımlanmış.

### 8.2 Onboarding
- Maksimum 5 adım.
- Her adımda tek ana aksiyon.
- Bildirim izni reddi için alternatif yönlendirme ekranı mevcut.
- Dil seçimi ekranı TR/EN anlık önizleme sunuyor.

### 8.3 İlaç Ekleme / Düzenleme
- Zorunlu alan işaretleri açık.
- En az 1 saat eklenmeden kaydet aktif olmuyor.
- Hata metinleri `caption` tokenlarıyla ve `error-500` ile gösteriliyor.

### 8.4 Hatırlatma ve Doz Aksiyonları
- `Aldım / Almadım / Ertele` aksiyonları görsel hiyerarşiyle ayrılmış.
- Ertele seçenekleri tek dokunuşla erişilebilir.
- Durum geri bildirimi 3 saniye içinde ekranda görünür.

### 8.5 Geçmiş / Stok / Reçete
- Filtreler erişilebilir etiketli.
- Stok eşik uyarısı `warning` ve kritik durumda `error` stiliyle ayrışır.
- Tarih/saat formatı seçili dile göre değişir.

## 9. İzlenebilirlik (Design -> Requirement)
- D-01 (Token standardizasyonu) -> NFR-05, US-15
- D-02 (TR/EN tipografik uyum) -> FR-14, US-12
- D-03 (Onboarding sadeleştirme) -> FR-15, US-13
- D-04 (Bildirim aksiyon hiyerarşisi) -> FR-05, US-03
- D-05 (Stok ve durum renkleri) -> FR-07, US-05

## 10. Kabul Kriterleri (Test Edilebilir)
1. Uygulamadaki tüm renk kullanımları yalnızca bu dokümandaki tokenlardan referans almalıdır.
2. Uygulamadaki tipografi stillerinin en az %95'i tanımlı tipografi tokenlarıyla eşleşmelidir.
3. `spacing` ve `radius` değerlerinde token dışı hard-coded değer oranı `%0` olmalıdır (lint veya static check ile).
4. Tüm kritik akış ekranlarında minimum dokunma alanı `44x44` doğrulanmalıdır.
5. TR/EN dil değişiminde heading ve body metinlerinde clipping oluşmamalıdır.
6. Durum bileşenleri (`success/error/warning/info`) ikon+metin kombinasyonuyla doğrulanmalıdır.

## 11. Açık Noktalar
- Shadow/elevation tokenları style guide görselinde belirtilmediği için ekran bazında netleştirilecektir.
- Border kalınlığı token seti net verilmediği için varsayılan `1` kullanılacaktır.
- Dark mode kapsamı verilmediği için bu sürümde kapsam dışıdır.

## 12. UI Dönüşüm Referansı
- Ekran bazlı React Native dönüşüm sözleşmesi için: `docs/react-native-screen-specification.md`
- Bu referans, style guide tokenlarının gerçek ekran akışına uygulanmış halini içerir.
- Icon standardı ve RN kullanım sözleşmesi için: `docs/icon-specification.md`
