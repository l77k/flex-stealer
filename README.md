niye bu kadar dosyaya ayırdın ki kingo

---

# Flex Stealer - Deobfuscation & Security Analysis Report

Bu repository, gelişmiş bir "Stealer" zararlı yazılımı olan **Flex Stealer** üzerinde gerçekleştirilen deobfuskasyon ve tersine mühendislik çalışmalarını içermektedir. Yazılımın karmaşık JS gizleme katmanları aşılarak, veri sızıntısı (exfiltration) ve veri çalma (credential harvesting) mantığı tamamen deşifre edilmiştir.

## 🛠️ İncelenen Obfuskasyon Katmanları

Zararlı yazılımın analizini zorlaştırmak için kullanılan temel teknikler şunlardır:

1.  **Dynamic Function Construction:** Kodun tamamı `new Function()` sarmalayıcıları içine alınarak statik analiz araçlarından (kod okuyuculardan) gizlenmiştir.
2.  **Encapsulated Constant Pool:** Tüm dosya yolları, API URL'leri ve regex desenleri tek bir merkezi dizide (`string array`) toplanmış ve bu dizi çalışma anında (runtime) **N-adımlı rotasyona** tabi tutulmuştur.
3.  **Multilayered String Encoding:** Dizgi (string) değerleri; XOR, Base64 ve özel karakter haritalama (charset mapping) yöntemleri kullanılarak çok katmanlı şekilde şifrelenmiştir.
4.  **Control Flow Flattening:** Kodun mantıksal akışı, jeneratör fonksiyonları (`function*`) ve karmaşık `switch-case` blokları kullanılarak "düzleştirilmiş", böylece standart debugger takibi imkansız hale getirilmiştir.
   

## 🔬 Uygulanan Deobfuskasyon Metodolojisi

Analiz sürecinde aşağıdaki teknik adımlar uygulanmıştır:

*   **Function Hooking:** Node.js `Function` constructor'ı hooklanarak, çalışma anında oluşturulan ham JavaScript gövdesi dışarı aktarılmıştır.
*   **Behavioral Tracing (Davranış İzleme):** Orijinal kod, kısıtlanmış bir sandbox ortamında çalıştırılmış; dosya sistemi ve ağ istekleri `Proxy` nesneleri kullanılarak anlık olarak izlenmiştir.
*   **Universal String Resolution:** Geliştirilen özel "Resolver" scriptleri ile, kod içerisindeki yüzlerce şifreli çağrı (`decoder call`) gerçek metin karşılıklarıyla yer değiştirilmiştir.
*   **Logic Reconstruction:** Deobfuskasyon sonrası ortaya çıkan ham mantık, okunabilir ve analiz edilebilir modern JavaScript yapısına (clean-code) refaktör edilmiştir.

## 🔑 Önemli Bulgular

Yapılan çalışma sonucunda şu kritik işlevler tespit ve döküme edilmiştir:
*   **Discord Token Extraction:** Chromium (v10 AES-GCM) ve Firefox (storage/default) profilleri üzerinden derinlemesine token tarama protokolü.

*   **App-Bound Encryption Bypass:** Modern Chromium tarayıcılardaki uygulama-bağlı şifrelemeyi aşmak için kullanılan yerel binary (`core-module-bin.js`) entegrasyonu.

*   **Browser Data Harvesting:** Cookies, History ve Login Data verilerinin SQLite veritabanlarından `%TEMP%` dizinine klonlanarak sızdırılması.

## ⚠️ Yasal Uyarı
Bu proje tamamen **eğitim ve güvenlik araştırması** amaçlıdır. Burada paylaşılan bilgiler, güvenlik profesyonellerinin zararlı yazılım tekniklerini anlaması ve savunma mekanizmaları geliştirmesi için döküme edilmiştir. Kötüye kullanım sorumluluğu kullanıcıya aittir.
