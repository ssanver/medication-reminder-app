# Business Requirements Document (BRD)

## 1. Doküman Bilgisi
- Proje Adı: İlaç Hatırlatma Uygulaması
- Doküman Tipi: İş Gereksinimleri Dokümanı (BRD)
- Doküman Versiyonu: 1.1
- Hazırlayan Birim: İş Birimi
- Tarih: 2026-02-15

## 2. Amaç
Bu BRD'nin amacı, son kullanıcı ihtiyaçlarını iş hedeflerine dönüştürmek, kapsamı netleştirmek ve yazılım ekibine uygulanabilir gereksinimleri aktarmaktır.

## 3. Arka Plan ve Problem Tanımı
Kullanıcılar ilaçlarını zamanında alma, doz takibi, stok yönetimi ve reçete yenileme gibi süreçlerde hatalar yaşamaktadır. Özellikle çoklu ilaç kullanan kullanıcılar, yaşlı bireyler ve bakım desteğine ihtiyaç duyan kullanıcılar için manuel takip sürdürülebilir değildir.

## 4. İş Hedefleri
- İlaç kullanım uyum oranını artırmak.
- Doz kaçırma ve yanlış zamanlama oranını azaltmak.
- Kullanıcıya kolay, güvenilir ve erişilebilir bir takip deneyimi sunmak.
- Yakın destek (aile/bakıcı) ile dolaylı takip olanağını sağlamak.
- Reçete ve stok yönetimini dijitalleştirerek aksama riskini düşürmek.
- Farklı tedavi tiplerini tek ve esnek frekans modeliyle desteklemek.

## 5. Başarı Kriterleri (KPI)
- 3 ay sonunda aktif kullanıcıların en az %70'inin haftalık en az 5 gün uygulamayı kullanması.
- Doz hatırlatmalarında "işaretlendi" oranının en az %80 olması.
- İlk 60 gün içinde "doz kaçırma" olaylarında başlangıca göre en az %25 azalma.
- Bildirim teslim başarısı en az %98.
- Kullanıcı memnuniyeti puanı (CSAT) en az 4.2/5.
- İlaç frekansı tanımlama akışında yarım bırakma oranında 3 ay içinde en az %20 azalma.

## 6. Kapsam
### 6.1 Kapsam Dahili
- İlaç kartı oluşturma, düzenleme, silme.
- Tekrarlayan hatırlatma planlama (günlük/haftalık, çoklu saat).
- Gelişmiş frekans tanımlama (saat aralıklı, döngüsel, PRN, tapering).
- Bildirim gönderimi ve erteleme.
- Doz durumu işaretleme (aldım/almadım).
- Kullanım geçmişi görüntüleme.
- Stok takibi ve düşük stok uyarısı.
- Reçete yenileme hatırlatmaları.
- Doktor randevusu ve tahlil hatırlatmaları.
- Erişilebilirlik ayarları (yazı boyutu, tema).
- Türkçe ve İngilizce çoklu dil desteği.
- Offline temel hatırlatma çalışma desteği.
- Acil durumda ilaç listesi paylaşımı.
- Aile/bakıcı erişim modeli (izinli takip).

### 6.2 Kapsam Dışı
- Eczane ve sigorta sistemleri ile canlı entegrasyon.
- Doktor reçete sistemi ile çift yönlü entegrasyon.
- Tıbbi teşhis veya klinik karar desteği.

## 7. Paydaşlar
- Birincil: Son kullanıcı (hasta)
- İkincil: Aile bireyi/bakıcı
- İş birimi
- Ürün yöneticisi
- Yazılım geliştirme ekibi
- QA ekibi
- Bilgi güvenliği ve hukuk ekipleri

## 8. Varsayımlar
- Kullanıcılar akıllı telefon bildirim izinlerini açacaktır.
- Cihaz saat ayarları doğrudur.
- Offline senaryoda temel hatırlatma için cihaz işletim sistemi servisleri kullanılacaktır.
- Hassas veri saklama altyapısı şirket güvenlik standartlarıyla uyumlu geliştirilecektir.

## 9. İş Kuralları
- Kullanıcı, ilaç için en az bir hatırlatma saati tanımlamadan kaydedemez.
- Kullanıcı, ilaç kaydında en az bir frekans tipi seçmeden kaydı tamamlayamaz.
- Geçmişe dönük doz işaretleme kullanıcı tarafından yapılabilir, ancak kayıt zamanı loglanır.
- Stok seviyesi sıfırın altına düşemez.
- Bakıcı erişimi sadece açık kullanıcı onayı ile aktif olur.
- Acil paylaşım çıktısı sadece kullanıcının seçtiği temel alanları içerir.
- PRN (gerektiğinde) kullanımda minimum tekrar aralığı ve günlük maksimum doz limiti zorunludur.
- Bitiş tarihi geçen frekans planları otomatik pasif duruma çekilir.

## 10. Fonksiyonel Gereksinimler
- FR-01: Kullanıcı ilaç ekleyebilmelidir (isim, doz, kullanım tipi, aç/tok, başlangıç-bitiş tarihi).
- FR-02: Kullanıcı ilaç başına birden fazla hatırlatma saati tanımlayabilmelidir.
- FR-03: Sistem günlük/haftalık tekrar kuralı desteklemelidir.
- FR-04: Hatırlatma anında cihaz bildirimi gönderilmelidir.
- FR-05: Kullanıcı bildirimi "ertele", "aldım", "almadım" seçenekleriyle yönetebilmelidir.
- FR-06: Sistem kullanıcıya günlük/haftalık kullanım geçmişini göstermelidir.
- FR-07: Kullanıcı ilaç stoku tanımlayabilmeli; eşik altına düşünce uyarı almalıdır.
- FR-08: Reçete yenileme tarihi için önceden bildirim kurulabilmelidir.
- FR-09: Doktor randevusu ve tahlil tarihleri takvime benzer şekilde eklenebilmelidir.
- FR-10: Uygulama çevrimdışı durumda planlı yerel hatırlatmaları tetiklemelidir.
- FR-11: Kullanıcı verileri cihazlar arasında senkronize edilebilmelidir.
- FR-12: Kullanıcı bir bakıcıyı davet ederek sınırlı takip erişimi verebilmelidir.
- FR-13: Kullanıcı acil durum ilaç listesini hızlıca paylaşabilmelidir.
- FR-14: Kullanıcı arayüzü Türkçe ve İngilizce dillerini desteklemelidir.
- FR-15: Onboarding süreci en fazla 5 adımda temel kullanım kurulumu sağlamalıdır.
- FR-16: Sistem sabit günlük frekans tipini desteklemelidir (günde 1/2/3/4 doz).
- FR-17: Sistem saat aralıklı frekans tipini desteklemelidir (N saatte bir).
- FR-18: Sistem haftalık gün bazlı frekansı desteklemelidir (seçili günler + saatler).
- FR-19: Sistem aylık gün bazlı frekansı desteklemelidir (ayın belirli günü + saat).
- FR-20: Sistem başlangıç-bitiş tarihli kür planını desteklemelidir.
- FR-21: Sistem döngüsel kullanım planını desteklemelidir (X gün kullan + Y gün ara).
- FR-22: Sistem PRN planını desteklemelidir (minimum aralık + günlük üst limit).
- FR-23: Sistem kademeli azaltım/artırım (tapering) planını desteklemelidir (tarih aralıklarına göre farklı frekans).
- FR-24: Sistem öğün ilişkisi bilgisini frekans planına bağlayabilmelidir (aç/tok/öğün öncesi/sonrası).
- FR-25: Sistem sessiz saat kuralı tanımlanmasına izin vermelidir; kritik olmayan bildirimleri sessiz saat dışına ötelemelidir.
- FR-26: Frekans kayıt ekranında hazır şablonlar (günde 1/2, 8 saatte 1, haftada 1, PRN) ve özel tanım birlikte sunulmalıdır.
- FR-27: Çakışan bildirimler aynı dakika içinde tekilleştirilmelidir.
- FR-28: Kaçırılan doz için tekrar hatırlatma kuralı tanımlanabilmelidir (15/30/60 dk).
- FR-29: Frekans güncellemesi sonrası yeni kurallar bir sonraki planlama döngüsünde uygulanmalıdır.
- FR-30: Frekans planı doğrulama kuralları sağlanmadığında kayıt engellenmeli ve açıklayıcı hata mesajı gösterilmelidir.

## 11. Fonksiyonel Olmayan Gereksinimler
- NFR-01: Bildirim tetikleme gecikmesi ortalama 5 saniyenin altında olmalıdır.
- NFR-02: Kritik ekranların açılış süresi 2 saniyenin altında olmalıdır.
- NFR-03: KVKK uyumlu veri işleme ve açık rıza yönetimi sağlanmalıdır.
- NFR-04: Veri aktarımı ve saklama sürecinde güçlü şifreleme kullanılmalıdır.
- NFR-05: Uygulama erişilebilirlik standartlarını karşılamalıdır (okunabilir metin, kontrast, ölçeklenebilir yazı).
- NFR-06: Sistem en az %99.5 aylık erişilebilirlik hedeflemelidir (senkronizasyon servisleri için).
- NFR-07: Hata kayıtları kişisel sağlık verisini maskeleyecek şekilde tutulmalıdır.
- NFR-08: Frekans kayıt akışı ortalama 60 saniye içinde tamamlanabilmelidir.
- NFR-09: Frekans hesaplama çıktısı kayıt sonrası en geç 2 saniye içinde üretilmelidir.
- NFR-10: Bildirim zamanlama doğruluğu ±1 dakika tolerans içinde olmalıdır.

## 12. Kullanıcı Yolculuğu Özeti
- İlk kurulum: Kullanıcı uygulamayı açar, dil ve bildirim izinlerini ayarlar, ilk ilacını ekler.
- Günlük kullanım: Bildirim gelir, kullanıcı doz durumunu işaretler, gerekirse erteleme yapar.
- Takip: Kullanıcı geçmiş ve stok ekranlarını kontrol eder, yaklaşan yenileme/randevu bildirimlerini görür.
- Destekli kullanım: Kullanıcı bakıcı erişimi tanımlar, bakıcı temel takip ekranlarını görüntüler.

## 13. Kabul Kriterleri
- Kullanıcı 2 dakika içinde ilk ilaç tanımını ve hatırlatma planını tamamlayabilmelidir.
- Hatırlatma aksiyonlarının tamamı (aldım/almadım/ertele) uygulama içinde kayıt altına alınmalıdır.
- Offline durumda önceden kurulmuş hatırlatmaların en az %95'i tetiklenmelidir.
- Stok eşiği aşıldığında kullanıcıya en geç 1 dakika içinde uyarı gösterilmelidir.
- Bakıcı erişimi, kullanıcı onayı kaldırıldığında anında pasifleşmelidir.
- Saat aralıklı (N saatte bir) frekansta 24 saatlik plan doğru üretilmelidir.
- Başlangıç-bitiş tarihli planlarda bitiş tarihinden sonra bildirim üretilmemelidir.
- PRN planında minimum aralık ihlalinde yeni doz kaydı engellenmelidir.
- Döngüsel planda ara günlerde bildirim oluşturulmamalıdır.
- Sessiz saat aktifken kritik olmayan bildirimler sessiz saat dışında gönderilmelidir.
- Frekans güncellemesi yapıldıktan sonra bir sonraki döngüde yeni kural uygulanmalıdır.

## 14. Riskler ve Önlemler
- Risk: Kullanıcıların bildirim izni vermemesi.
  - Önlem: Onboarding sırasında değer odaklı izin açıklaması ve tekrar hatırlatma akışı.
- Risk: Yaşlı kullanıcıların karmaşık ekranlarda zorlanması.
  - Önlem: Basit bilgi mimarisi, büyük tipografi modu, kısa metinler.
- Risk: Sağlık verisi güvenliği ihlali.
  - Önlem: Rol tabanlı erişim, şifreleme, düzenli güvenlik testleri.
- Risk: Cihaz üreticilerine göre bildirim davranışı farklılıkları.
  - Önlem: Platform bazlı test matrisi ve fallback hatırlatma mekanizmaları.

## 15. Bağımlılıklar
- Mobil bildirim servisleri (iOS/Android).
- Kimlik ve hesap altyapısı.
- Senkronizasyon için backend servisleri.
- Güvenlik ve yasal uyum onayları.

## 16. Fazlama Önerisi
- Faz 1 (MVP): İlaç ekleme, hatırlatma, doz işaretleme, geçmiş, Türkçe arayüz.
- Faz 2: Stok, reçete yenileme, randevu/tahlil takibi, offline güçlendirme.
- Faz 3: Bakıcı erişimi, çoklu cihaz senkronizasyonu, acil durum paylaşımı.

## 17. Onay
Bu doküman, iş birimi tarafından ürün ve teknik ekiplerle birlikte gözden geçirilip onaylandığında geliştirme kapsamı için referans belge olacaktır.
