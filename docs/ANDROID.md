# Lingo Android

Android 8.0 ve üzeri için Türkçe, çevrimdışı Lingo. Uygulama kimliği `com.stitchilyas.lingo`; test sürümü `com.stitchilyas.lingo.debug`.

## Paketler

- **lingo-1.54.02-debug.apk**: Android cihazına yüklenebilen, test anahtarıyla imzalı sürüm. Telefon indirme kaynağı için izin isterse “Bu kaynaktan yüklemeye izin ver” seçeneğini açın.
- **lingo-1.54.02-unsigned.aab**: Derlenmiş, imzasız release Android App Bundle. Doğrudan telefona kurulmaz. Google Play'e göndermeden önce kendi yükleme anahtarınızla imzalanmalıdır.
- İmzalama sırları yapılandırıldığında otomatik olarak **release.apk** ve **signed.aab** üretilir.

Debug APK geliştirme/test amaçlıdır. GitHub'ın geçici derleme makinelerinde debug anahtarı değişebilir; farklı çalıştırmalardan APK'ları üst üste yükleyebilmek için kalıcı release anahtarı kullanın. Aksi durumda eski test sürümünü kaldırmak gerekebilir; kaldırma oyun kayıtlarını siler. Debug ve release sürümleri farklı uygulama kimliğine sahiptir.

## Derleme

Gerekenler: JDK 17, Android SDK platform 36, Build Tools 35.0.0, Node.js 22. Gradle 8.13 wrapper projeye dahildir.

```sh
npm ci
npm test
npx playwright install chromium
npm run test:ui
cd android
./gradlew assembleDebug bundleRelease lintRelease
```

Windows: `gradlew.bat assembleDebug bundleRelease lintRelease`. SDK yolunu `ANDROID_HOME` ile veya git'e eklenmeyen `android/local.properties` dosyasında `sdk.dir=...` ile belirtin.

Çıktılar:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/reports/lint-results-release.html`

Derleme, ortak `words.js` ve `meanings/` dosyalarıyla `mobile/` arayüzünü uygulamaya kopyalar. Android paketi ilk açılıştan itibaren internet gerektirmez. Ağ izni yoktur. Dış kaynak bağlantıları sistem tarayıcısında açılır. Yüksek kontrast modu harflere şekil işaretleri de ekler; sistemin hareket azaltma tercihi desteklenir.

## GitHub Actions

**Actions → Android APK & AAB → Run workflow**. `main` üzerindeki ilgili değişiklikler otomatik derlenir. Testler, mobil tarayıcı kontrolleri ve Android lint başarılı olduğunda APK/AAB hem çalışma çıktısı hem GitHub ön sürümü olarak yüklenir. Paketler için SHA-256 listesi de üretilir.

## Google Play imzası

Kendi özel yükleme anahtarınızı kullanın; `.jks` dosyasını git'e koymayın. Depoda **Settings → Secrets and variables → Actions** bölümüne ekleyin:

| Secret | Değer |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | JKS dosyasının base64 kodlaması |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore parolası |
| `ANDROID_KEY_ALIAS` | Anahtar adı |
| `ANDROID_KEY_PASSWORD` | Anahtar parolası |

Yerel imzalama için aynı parola/alias ortam değişkenleri ve `ANDROID_KEYSTORE_PATH` (JKS dosyasının mutlak yolu) kullanılır. `versionCode`, 1540200 tabanı + `ANDROID_VERSION_CODE` değeridir; CI bu ek değere çalışma numarasını verir. Android sürüm adı `1.54.02`; npm paket sürümü SemVer biçimi gereği `1.54.2` olarak saklanır. Anahtar verilmezse bundle bilerek imzasız kalır; test imzası Google Play yayını olarak sunulmaz.

Google Play hesabı, mağaza kaydı ve yükleme anahtarı bu kod deposundan ayrıdır. Uygulama hiçbir hesabı veya sunucuyu gerektirmez; oyun verileri yalnızca cihazda tutulur.

## Doğrulama kapsamı

Oyun motoru, 1.000 kelime çiftiyle tekrar eden harf dağılımı, 44.056 kelime ve 43.603 anlamlı hedef, İstanbul gün sınırı, puan ve tekrar önleme test edilir. Mobil tarayıcı testleri 320/390/768 pikselde düzeni, sonuçları, kalıcılığı, tema, süre, günün kelimesi ve hata durumlarını kontrol eder. Android derlemesi ve lint ayrıca çalışır. Tarayıcı testleri fiziksel Android cihaz testi yerine geçmez.

1.54.02 açılış ve animasyon kontrolleri: atlama, otomatik kapanış, yeniden yüklemede tekrar etmeme, sistem hareket azaltma tercihi, harf girişi, tahmin sırasında kilit ve zafer dalgası.
