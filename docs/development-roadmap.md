# Gelistirme Yol Haritasi

## 1. Plan Ozeti
- Plan Baslangic Tarihi: 2026-02-15
- Temel Varsayim: 1 mobil gelistirici + 1 backend gelistirici + 1 QA
- Yontem: PBI sirasina gore asamali teslim
- Durum: Baslatildi (`PBI-001` iskeleti olusturuldu)

## 2. Fazlar ve Takvim

| Faz | Kapsam | Baslangic | Hedef Bitis | Cikti |
|---|---|---|---|---|
| Faz 1 (MVP) | PBI-001, 002, 003, 004, 005, 006, 007, 011, 012 | 2026-02-16 | 2026-04-10 | Calisir MVP + temel guvenlik/erisilebilirlik |
| Faz 2 | PBI-008, 009, 010 | 2026-04-13 | 2026-05-22 | Offline guclendirme + recete/randevu modulleri |
| Faz 3 | PBI-013, 014 | 2026-05-25 | 2026-06-19 | Bakici modeli + acil paylasim |
| Stabilizasyon | Regresyon, performans, release hazirligi | 2026-06-22 | 2026-07-03 | Uretim adayi |

## 3. Bu Tur Tamamlanan Gelistirme (PBI-001 Baslangici)
- `api/` klasoru olusturuldu ve .NET 8 Web API iskeleti baslatildi.
- `/health` endpoint'i eklendi.
- EF Core tabanli temel veri modeli eklendi (`medication`, `medication-schedule`, `app-db-context`).
- `mobile-app/` klasoru olusturuldu.
- Tema tokenlari (`colors`, `spacing`, `typography`, `radius`) eklendi.
- Ilk tab tabanli ekran iskeleti eklendi (`today`, `my-meds`, `add-meds`, `settings`).
- .NET test projesi eklendi (`api.tests`) ve health/config testleri yazildi.
- Ilk EF migration olusturuldu (`InitialCreate`) ve SQL script ciktisi alindi.

## 3.1 PBI Durum Takibi

| PBI | Durum | Kanit |
|---|---|---|
| PBI-001 | Done | `dotnet build medication-reminder-app.slnx`, `dotnet test medication-reminder-app.slnx` (2/2), `api/data/migrations/*InitialCreate*` |
| PBI-002 | Done | `mobile-app/src/screens/auth/onboarding-screen.tsx`, `npm test` (3/3), `npx tsc --noEmit` |
| PBI-003 | Done | `api/Controllers/medications-controller.cs`, `api.tests/medications-controller-tests.cs`, `dotnet test` (6/6) |
| PBI-004 | Done | `api/services/schedule-planner.cs`, `api.tests/schedule-planner-tests.cs`, `dotnet test` (9/9) |
| PBI-005 | Done | `api/Controllers/dose-events-controller.cs`, `api.tests/dose-events-controller-tests.cs`, `dotnet test` (12/12) |
| PBI-006 | Done | `api/Controllers/dose-events-controller.cs` (history/summary), `dotnet test` (14/14) |
| PBI-007 | Done | `api/Controllers/inventory-controller.cs`, `api.tests/inventory-controller-tests.cs`, `dotnet test` (18/18) |
| PBI-008 | Done | `api/Controllers/prescription-reminders-controller.cs`, `api.tests/prescription-reminders-controller-tests.cs`, `dotnet test` (20/20) |
| PBI-009 | Todo | - |
| PBI-010 | Todo | - |
| PBI-011 | Todo | - |
| PBI-012 | Todo | - |
| PBI-013 | Todo | - |
| PBI-014 | Todo | - |

## 4. Faz Bazli Kabul Kriterleri

### 4.1 Faz 1
- [ ] API `/health` endpoint'i 200 donmelidir.
- [ ] Ilac CRUD akisi icin en az 1 reminder saati zorunlulugu test ile dogrulanmalidir.
- [ ] Bildirim aksiyonlari (`taken/missed/snooze`) en gec 3 saniye icinde gecmise yansimalidir.
- [ ] Stok negatif deger alamamalidir.
- [ ] TR/EN dil degisimi kritik ekranlarda anlik yansimalidir.
- [ ] Kritik ekran acilis suresi P95 < 2 saniye olmalidir.

### 4.2 Faz 2
- [ ] Offline planli hatirlatmalar testte >= %95 tetiklenmelidir.
- [ ] Recete yenileme T-7/T-3/T-1 ve custom offset kurallarini desteklemelidir.
- [ ] Randevu/tahlil kayitlari liste ve takvimde tutarli gorunmelidir.

### 4.3 Faz 3
- [ ] Bakici davet ve yetki kisit akisi uc uca calismalidir.
- [ ] Kullanici izni kaldirdiginda bakici erisimi aninda kapanmalidir.
- [ ] Acil paylasim yalnizca izinli alanlari icermelidir.

## 5. Izlenebilirlik
- `docs/business-requirements-document.md`: FR-01..FR-15, NFR-01..NFR-07
- `docs/business-analysis.md`: US-01..US-15
- `docs/technical-analysis.md`: PBI-001..PBI-014
- Bu yol haritasi: Faz/PBI bazli teslim plani ve tarihsel izleme

## 6. Riskler ve Bagimliliklar
- NuGet ve npm paket indirme asamasinda ag erisimi yoksa build dogrulamasi bloklanir.
- SQL Server ortami hazir degilse migration ve entegrasyon testleri ertelenir.
- iOS/Android bildirim farkliliklari icin cihaz matris testi gerekir.

## 7. Sonraki Adimlar (Hemen)
1. `PBI-003` icin medication CRUD endpoint ve mobil form tamamlanacak.
2. `PBI-004` tekrarlayan planlama motoru ile 30 gunluk plan uretimi eklenecek.
3. `PBI-005` bildirim aksiyon servisleri ve event log modeli tamamlanacak.
