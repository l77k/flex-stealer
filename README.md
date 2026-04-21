niye bu kadar dosyaya ayırdın ki kingo

1. Katman: Function Sarmalayıcısının Aşılması
Yazılımın neredeyse tüm modülleri new Function("kod...")() şeklinde bir sarmalayıcı içindeydi. Bu, statik analiz araçlarının (kod okuyucuların) içindeki kodu görmesini engeller.

Ne yaptık? scratch/extract_v2.js ile Node.js'in Function yapıcısını (constructor) "hook"ladık (ele geçirdik). Kod kendi kendini çalıştırmaya çalıştığı anda, çalışmasına izin vermeden içindeki ham JavaScript gövdesini yakalayıp dosyalara çıkardık.
2. Katman: Sabit Havuzu (Constant Pool) ve Rotasyon
Kodun içindeki tüm kritik veriler (dosya yolları, URL'ler, regexler) devasa bir dizi (array) içine gizlenmişti. Üstelik bu dizi, kod başlar başlamaz karmaşık bir döngüyle (örneğin 16 kez) döndürülüyordu (Array Rotation).

Ne yaptık? Dizinin ham halini yakaladık ve kodun içindeki rotasyon algoritmasını birebir taklit ederek diziyi "çalışma anındaki" (runtime) doğru dizilimine getirdik.
3. Katman: Dizgi (String) Çözümleme
Kod içinde hiçbir yerde "discord" veya "C:\\Users..." gibi açık metinler yoktu. Bunun yerine sQc20J(0x1db) gibi fonksiyon çağrıları vardı. Bu fonksiyonlar XOR, Base64 ve özel bir karakter haritası (charset mapping) kullanarak havuzdan veri çekiyordu.

Ne yaptık? Bir "Universal Resolver" (Evrensel Çözücü) yazdık. Tüm bu 0x... değerlerini tek tek havuzdaki karşılıklarıyla eşleştirdik ve koddaki bu fonksiyon çağrılarını gerçek metinlerle yer değiştirdik.
4. Katman: Kontrol Akışı Düzleştirme (Control Flow Flattening)
En zorlayıcı kısımdı. Bazı modüller (özellikle serviceConfig ve authProvider), while döngüleri ve switch blokları içine gizlenmiş "State Machine"ler (durum makineleri) kullanıyordu. Yani kod 1-2-3 diye gitmek yerine, bir jeneratör içinde sürekli sıçrayarak çalışıyordu.

Ne yaptık? Behavioral Tracing (Davranışı İzleme) yöntemini kullandık. Kodu kontrollü bir ortamda (sandbox) çalışırken izledik; hangi yollara girdiğini, hangi dosyaları okuduğunu Proxy nesneleriyle (ajan moleküller gibi düşünebilirsin) saniye saniye kaydettik.
5. Katman: Refaktör ve Temizleme
Tüm bu işlemlerden sonra elimizde çalışan ama hala çok karmaşık görünen devasa bir kod yığını vardı.

Ne yaptık? Bu yığını parçalara ayırdık. Belirlediğimiz dosya yollarını, şifreleme anahtarı çözme mantığını ve Discord API çağrılarını modern, okunabilir ve yorum satırlarıyla açıklanmış bir yapıya dönüştürdük.
