# Splash Davranis Kurallari

## Kurallar
1. Ilk kurulumdan sonraki ilk acilista splash ekrani 1600ms gorunur.
2. Sonraki acilislarda splash ekrani 500ms gorunur.
3. Oturum aciksa uygulama dogrudan `app` fazina gecer.
4. Oturum kapali ve onboarding tamamlandiysa `signin` fazina gecer.
5. Oturum kapali ve onboarding tamamlanmadiysa `onboarding` fazina gecer.

## Kabul Kriterleri
- [ ] Fresh install: ilk acilista splash suresi 1600ms civari.
- [ ] Uygulama kapat-ac: ikinci acilista splash suresi 500ms civari.
- [ ] Login olmus kullanici acilisinda onboarding gosterilmez.
- [ ] Login olmayan ama onboarding tamamlamis kullanici sign-in ekranina gider.
