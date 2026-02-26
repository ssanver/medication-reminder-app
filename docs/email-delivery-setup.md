# Email Delivery Setup

## Amac
Email verification kodu uretildiginde gercek SMTP uzerinden e-posta gondermek.

## Konfigurasyon
Production ortaminda asagidaki degiskenler secret olarak verilmelidir:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_ADDRESS`
- `SMTP_FROM_NAME` (opsiyonel)
- `SMTP_ENABLE_SSL` (opsiyonel, varsayilan `true`)

Alternatif olarak `appsettings` icindeki `Email:*` anahtarlari kullanilabilir.

## Beklenen Davranis
1. `/api/auth/email/request-verification` cagrisi basariliysa `sent=true` doner.
2. SMTP gonderimi basarisizsa API `502` doner ve `sent=true` donmez.
3. `resend-verification` ayni dispatch akisina girer ve cooldown kuralini korur.
