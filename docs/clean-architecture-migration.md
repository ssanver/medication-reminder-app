# Clean Architecture Geçiş Planı

## Hedef
- Backend: Domain ve Application kuralları API sunum katmanından ayrılmış olmalı.
- Frontend: UI ekranları business kararlarını içermemeli; sadece view model/handler çağırmalı.
- Platform bağımsızlık: React Native yerine farklı istemciye geçişte iş kuralı kaybı olmamalı.

## Backend Katmanları
1. `api-domain`
   - Saf iş kuralları, status/action sabitleri, domain policy.
2. `api-application`
   - Use case servisleri, input doğrulama, repository interface’leri.
3. `api` (presentation + infrastructure)
   - Controller (presentation)
   - EF repository implementasyonları (infrastructure)

## Frontend Katmanları
1. `screens/`
   - Sadece render + event forwarding
2. `features/*/`
   - Orkestrasyon servisleri (`notification-center-service` gibi)
3. `features/network/`
   - API istemci sorumluluğu (header/correlation, retry, timeout)

## Mevcut Durum
- Notification Delivery/Action akışı backendde clean katmanlarla taşındı.
- Reminder modal aksiyonları `notification-center-service` katmanına taşındı.

## Sonraki Adımlar
1. Medication oluşturma/frekans kurallarını `api-application` use case katmanına taşı.
2. Mobilde frequency/doz kararlarını API’den alınan kurallarla yönet.
3. UI’da kalan date/frequency business kararlarını feature service katmanına çek.
4. Web/native gibi farklı client’ların aynı API contract ile çalıştığını doğrula.
