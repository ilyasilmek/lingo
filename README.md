# 🟩 Lingo — Türkçe Kelime Oyunu

**Bir kelime daha.** İlk harf bizden, gerisi senden.

Tamamen Türkçe, mobil ve masaüstü tarayıcılarda çalışan bir kelime oyunu.

## Özellikler

- **38.910 kelime**, 4–10 harf seçenekleri.
- Her kelime için altı tahmin.
- Doğru yerdeki harfler yeşil, farklı yerdeki harfler turuncu.
- Tekrarlanan harfleri kelimedeki adetlerine göre değerlendirme.
- Seçilen uzunluktaki havuz bitmeden tekrarlanmayan hedefler.
- İsteğe bağlı süreli mod: her tahmin için 30 saniye.
- Türkçe ekran klavyesi ve fiziksel klavye desteği.
- Harf animasyonları, kutlama efektleri ve isteğe bağlı ses.
- Cihazda saklanan puan, bulunan kelime ve galibiyet serisi.
- Hareket azaltma tercihine uyum.

## GitHub Pages üzerinde yayınlama

1. **Settings → Pages** bölümünü aç.
2. **Source:** `Deploy from a branch` seç.
3. **Branch:** `main`, klasör: `/ (root)` seç ve **Save** düğmesine bas.
4. GitHub yayını tamamladığında oyun adresi: https://ilyasilmek.github.io/lingo/

Bu adres yayın etkinleştirildikten sonra çalışır. Sonraki `main` değişiklikleri otomatik yayınlanır.

## Yerel çalıştırma

Kurulum veya API anahtarı gerekmez. `index.html` dosyasını bir tarayıcıda açabilirsin. Alternatif olarak:

```sh
python -m http.server 8080
```

Ardından `http://localhost:8080` adresini aç.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Türkçe oyun arayüzü |
| `style.css` | Duyarlı tasarım ve animasyonlar |
| `app.js` | Oyun mantığı, süre, puan ve klavye |
| `words.js` | Uygulamayla birlikte gelen kelime havuzu |

## Kelime kaynağı

[VikiSözlük tabanlı Türkçe kelime listesi](https://github.com/mertemin/turkish-word-list) kullanılmıştır. Büyük harfle başlayan girdiler, birden fazla sözcüklü ifadeler ve 4–10 harf aralığı dışındaki kelimeler elenmiş; Türkçe büyük harf dönüşümü ve şapkalı harf normalleştirmesi uygulanmıştır. Az kullanılan ve eski sözcükler de bulunabilir.

Havuz sonludur; seçilen uzunluktaki havuz bittiğinde tekrar karıştırılır. Kelime kontrolü için harici API kullanılmaz. Yazı tipleri Google Fonts üzerinden yüklenir; erişilemediğinde sistem yazı tipi kullanılır.

## Oyun sonunda kelime anlamı

Kazanıldığında, altı tahmin bittiğinde veya süre dolduğunda doğru kelimenin en fazla üç sözlük anlamı gösterilir. 38.457 anlamı bulunan kelime hedef olarak seçilir; 38.910 kelimenin tamamı tahminlerde kabul edilir. Yeni oyunda eski anlam kartı kapanır. Bağlantı hatasında tekrar deneme sunulur. Anlamlar aynı sitedeki `meanings/4.json`–`meanings/10.json` dosyalarından yüklenir; harici API gerekmez. Yerel kullanımda anlam dosyaları için yukarıdaki HTTP sunucusunu kullanın.

Anlam verisi: [Bilal Özdemir / tr-word-list](https://github.com/bilalozdemir/tr-word-list), `files/words.json`, TDK sözlük derlemesi. Kaynakta belirtilen [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) lisansı kapsamında, türetilmiş `meanings/*.json` verileri de aynı lisansla sunulur. Yapılan değişiklikler: oyun kelimelerine filtreleme, Türkçe büyük harf ve şapkalı harf normalleştirmesi, yinelenen anlamları birleştirme, ilk üç anlamı koruma ve uzunluğa göre bölme. Bu derleme resmî bir TDK ürünü değildir.
