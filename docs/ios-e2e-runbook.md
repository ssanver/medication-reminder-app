# iOS E2E Runbook

## Amaç
Bu doküman iOS simülatörde son kullanıcı E2E akışlarının deterministik şekilde çalıştırılmasını tanımlar.

## Önkoşullar
- iOS simulator boot durumda (`iPhone 16 Pro Max` önerilir).
- Expo development build yüklenmiş olmalı.
- Metro aktif olmalı (`npx expo run:ios -d "iPhone 16 Pro Max"`).
- Maestro kurulu olmalı (`~/.maestro/bin/maestro`).
- Java runtime erişilebilir olmalı (`/opt/homebrew/opt/openjdk/bin/java`).

## Çalıştırma
`mobile-app` dizininde:

```bash
npm run test:e2e:ios
```

Bu komut aşağıdaki akışları **sıralı** çalıştırır:
1. `maestro/end-user-smoke.yaml`
2. `maestro/notification-toggle.yaml`

## Çıktılar
- JUnit raporları: `mobile-app/artifacts/maestro-*.xml`
- Debug klasörleri: `~/.maestro/tests/manual-runs/<flow>-<timestamp>/`

## Kabul Kriterleri
1. `end-user-smoke` raporunda `failures="0"` olmalı.
2. `notification-toggle` raporunda `failures="0"` olmalı.
3. Çalıştırma sonunda `NoSuchFileException` görülmemeli.
4. Akışlar metin yerine `testID` tabanlı seçiciler ile ilerlemeli.
