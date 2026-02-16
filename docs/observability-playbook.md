# Gözlemlenebilirlik Oyun Kitabı

## Amaç
Mobil istemci ile API arasındaki kritik akışları tek bir `correlation id` ile uçtan uca izlemek ve store sonrası hata yönetimini standartlaştırmak.

## Correlation ID Standardı
- Header adı: `X-Correlation-ID`
- Üretim: mobil istemci tarafı (`social-login-<timestamp>-<random>`)
- API davranışı:
  - Header gelirse aynen kullanılır.
  - Header yoksa `TraceIdentifier` kullanılır.
  - Response header'a geri yazılır.

## Kritik Eventler
- `reminder-scheduled`
- `action-received`
- `delivery-list-requested`
- `action-list-requested`

## Log Güvenliği
- Kullanıcı referansı ve hassas payload alanları `LogMasker` ile maskelenir.
- PII düz metin loglanmaz.

## Arıza İnceleme Akışı
1. İstemciden `X-Correlation-ID` alınır.
2. API JSON loglarında aynı `correlationId` ile filtrelenir.
3. `notification-deliveries` ve `notification-actions` kayıtları eşlenir.
4. Root cause sınıflandırılır (`client`, `api`, `data`, `infra`).

## Release Geri Besleme Kuralı
1. Kritik hata görülür.
2. GitHub issue açılır (`bug` + `observability`).
3. Fix branch + test/build kanıtı hazırlanır.
4. Hotfix veya planlı sürüm notuna eklenir.
