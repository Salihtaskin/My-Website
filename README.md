# Salih Taşkın — Cyber Security Portfolio

TR/EN dil destekli, siber güvenlik temalı kişisel portfolyo sitesi. Gerçek kullanıcı kaydı, admin onayı ve rol yönetimi içerir. GitHub üzerinden Cloudflare Pages'e deploy edilmek üzere tasarlanmıştır (Cloudflare Pages Functions + D1 veritabanı kullanır).

## v2 Güncellemeleri — zaten deploy ettiysen ÖNCE burayı oku

Sitenin `salihtaskin.pages.dev` üzerinde çalışan önceki halini bu paket ile güncelliyorsan:

1. **"Ana sayfaya dönünce tekrar giriş istiyor" sorunu düzeltildi.** Aslında oturumun düşmüyordu; sadece ana sayfa/login/register sayfaları senin zaten giriş yapmış olduğunu bilmiyordu, bu yüzden tekrar login formuyla karşılaşıyordun. Artık `index.html` gerçekten giriş yapmış mısın diye kontrol edip navbar'da "Giriş Yap / Kayıt Ol" yerine "Panele Git / Çıkış Yap" gösteriyor; `login.html` / `register.html`'e zaten girişliyken gidersen otomatik olarak `dashboard.html`'e yönlendiriliyorsun.
2. **Yeni admin özellikleri:** IP takibi, giriş logları, brute-force/kimlik bilgisi saldırısı anomali tespiti, kullanıcı bazlı "tüm oturumları sonlandır" butonu. Detaylar aşağıda "Yeni Admin Özellikleri" bölümünde.
3. **Bunun için veritabanında yeni tablo/sütunlar gerekiyor.** Mevcut D1 veritabanını SİLMEDEN, sadece `migration_v2.sql` dosyasını D1 Console'da çalıştırman yeterli — mevcut kullanıcıların ve adminliğin korunur. Adımlar aşağıda "D1 Migration (mevcut kurulum için)" bölümünde.
4. Dosyaları GitHub reponda güncelle (`git add . && git commit -m "v2: IP/güvenlik takibi + oturum UX düzeltmesi" && git push`), Cloudflare Pages otomatik yeniden deploy eder.

## İçerik

- `index.html` — Ana sayfa (Hakkımda, Yetenekler, Deneyim, Eğitim, Projeler, Sertifikalar, İletişim)
- `register.html` — Kayıt sayfası (ad soyad, e-posta, telefon, şifre)
- `login.html` — Giriş sayfası
- `dashboard.html` — Giriş sonrası kontrol paneli (kullanıcılar için) + admin kullanıcı yönetimi & güvenlik paneli (yöneticiler için)
- `css/style.css` — Tüm stiller (dark/terminal/matrix tema)
- `js/translations.js` — TR/EN çeviri sözlüğü
- `js/main.js` — Matrix animasyonu, dil değiştirme, mobil menü, yazı efekti
- `js/session-ui.js` — Ortak oturum durumu kontrolü (navbar, otomatik yönlendirme)
- `js/register.js`, `js/login.js`, `js/dashboard.js` — Form ve panel mantığı
- `functions/api/*` — Cloudflare Pages Functions (gerçek backend: kayıt, giriş, oturum, admin işlemleri, güvenlik/anomali tespiti)
- `schema.sql` — D1 veritabanı şeması (sıfırdan kurulum için)
- `migration_v2.sql` — Mevcut kuruluma IP/log takibi eklemek için (veri kaybı yok)
- `assets/profile.jpg` — Profil fotoğrafı

## Bu sistem nasıl çalışıyor?

Artık site **gerçek bir kullanıcı sistemi** içeriyor:

1. Herhangi biri `register.html` üzerinden ad soyad, e-posta, telefon ve şifre girerek hesap talebinde bulunabilir. Hesap `pending` (onay bekliyor) durumunda oluşturulur.
2. Sen (admin), `dashboard.html` üzerindeki **Kullanıcı Yönetimi** panelinden bekleyen hesapları görür, **Onayla**, **Reddet**, **Admin Yap**, **Yetkiyi Al** veya **Sil** işlemlerini yapabilirsin.
3. Sadece `approved` (onaylı) durumundaki kullanıcılar `login.html` ile giriş yapabilir.
4. Şifreler asla düz metin olarak saklanmaz — PBKDF2-SHA256 (100.000 iterasyon) ile hashlenip veritabanına öyle yazılır.
5. Oturumlar HttpOnly + Secure çerezlerle yönetilir (7 gün geçerli), tarayıcı konsolundan okunamaz.

Bu, statik bir demo değil — Cloudflare Pages Functions (sunucusuz fonksiyonlar) ve Cloudflare D1 (SQL veritabanı) kullanan gerçek bir backend'dir.

## GitHub'a Yükleme

1. GitHub'da yeni bir repo oluştur (örn. `salih-cybersec-portfolio`).
2. Bu klasördeki tüm dosyaları o reponun içine kopyala.
3. Terminalde (bu klasörün içindeyken):

```bash
git init
git add .
git commit -m "İlk yükleme: siber güvenlik portfolyo sitesi + kullanıcı sistemi"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/REPO_ADIN.git
git push -u origin main
```

## Cloudflare Pages'e Bağlama

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. GitHub reponu seç.
3. Build ayarları:
   - **Framework preset:** None
   - **Build command:** (boş bırak)
   - **Build output directory:** `/`
4. **Save and Deploy**'a bas. Site `xxxx.pages.dev` adresinde yayına girer (henüz veritabanı bağlı olmadığı için kayıt/giriş bu aşamada çalışmaz — aşağıdaki D1 adımlarını tamamla).

## D1 Veritabanı Kurulumu (kayıt/giriş sisteminin çalışması için ZORUNLU)

### 1) D1 veritabanını oluştur

Cloudflare Dashboard → **Workers & Pages** → **D1 SQL Database** → **Create database**. İsim ver, örn. `cybersec-portfolio-db`.

(Alternatif olarak `wrangler` CLI kuruluysa: `npx wrangler d1 create cybersec-portfolio-db`)

### 2) Şemayı çalıştır

D1 veritabanının **Console** sekmesine gir, `schema.sql` dosyasının içeriğini kopyala-yapıştır ve çalıştır. Bu, `users` ve `sessions` tablolarını oluşturur.

(Alternatif: `npx wrangler d1 execute cybersec-portfolio-db --file=./schema.sql --remote`)

### 3) Veritabanını Pages projesine bağla

Pages projen → **Settings** → **Functions** → **D1 database bindings** → **Add binding**:
- **Variable name:** `DB`  *(kod bu isimle çağırıyor, değiştirme)*
- **D1 database:** az önce oluşturduğun veritabanı

Kaydettikten sonra Pages projesini yeniden deploy et (Settings sayfasında "Retry deployment" ya da yeni bir `git push` ile).

### 4) Kendi hesabını oluştur ve admin yap

1. Siteye git → `register.html` (veya "Kayıt Ol" linki) → kendi bilgilerinle (ad soyad, `salihtaskin282282@gmail.com`, telefon, güçlü bir şifre) kayıt ol.
2. D1 veritabanının **Console** sekmesinde şu SQL komutunu çalıştır:

```sql
UPDATE users SET role = 'admin', status = 'approved' WHERE email = 'salihtaskin282282@gmail.com';
```

3. `login.html` üzerinden giriş yap. Artık `dashboard.html`'de **Kullanıcı Yönetimi** panelini göreceksin ve diğer kullanıcıları onaylayabilirsin.

Not: Şifren hiçbir zaman düz metin olarak veritabanına ya da koda yazılmaz — bu yüzden yukarıdaki adımı SQL ile "admin yap" şeklinde yapman gerekiyor, hazır bir şifre sana veremem.

## D1 Migration (mevcut kurulum için — v2 güncellemesi)

Zaten `schema.sql`'i çalıştırıp siteyi kurmuşsan (yani `salihtaskin.pages.dev` zaten çalışıyorsa), veritabanını SIFIRLAMANA gerek yok. Sadece:

1. Cloudflare Dashboard → D1 veritabanın → **Console** sekmesi.
2. `migration_v2.sql` dosyasının tüm içeriğini yapıştır → çalıştır.
3. Bu, `users` tablosuna `last_login_at`, `last_login_ip`, `registered_ip`; `sessions` tablosuna `ip`, `user_agent` sütunlarını ekler ve yeni bir `login_events` (giriş logu) tablosu oluşturur. Mevcut kullanıcıların, adminliğinin ve onay durumlarının hiçbiri silinmez/değişmez.
4. Migration'ı çalıştırmadan da site normal çalışmaya devam eder (kod, sütunlar/tablo yoksa sessizce eski davranışa döner) — ama admin panelindeki **Güvenlik** sekmesi boş görünür ve bir uyarı gösterir.

## Yeni Admin Özellikleri (v2)

`dashboard.html` içindeki admin paneli artık iki sekmeden oluşuyor:

**Kullanıcılar sekmesi:**
- Durum filtresi (Tümü / Onay Bekliyor / Onaylı / Reddedildi) + isim/e-posta arama.
- Her kullanıcı için son giriş tarihi ve son giriş IP'si.
- **Oturumları Sonlandır** butonu — bir kullanıcının tüm aktif oturumlarını (tüm cihazlardaki girişlerini) anında sonlandırır. Şüpheli bir hesap gördüğünde kullanışlı.
- Onayla / Reddet / Admin Yap / Yetkiyi Al / Sil işlemleri (öncekiyle aynı).

**Güvenlik sekmesi:**
- Son 24 saatteki toplam/başarılı/başarısız giriş denemesi ve benzersiz IP sayısı.
- **Anomali tespiti** (basit kural tabanlı, D1 üzerinde SQL ile hesaplanır):
  - *Brute-force şüphesi:* aynı IP'den son 15 dakikada 5+ başarısız giriş denemesi.
  - *Kimlik bilgisi (credential stuffing) şüphesi:* aynı e-postaya son 30 dakikada 3+ farklı IP'den başarısız deneme.
- Son 150 giriş denemesinin listesi: zaman, e-posta, IP adresi, tarayıcı/cihaz bilgisi, başarılı/başarısız durumu.

Bu bir kurumsal SIEM/IDS sistemi değil — küçük ölçekli kişisel bir site için basit ama gerçek bir görünürlük katmanı. IP adresleri Cloudflare'in `CF-Connecting-IP` başlığından okunur (gerçek ziyaretçi IP'si, sahtesi kolay değildir).

## Her `git push` sonrası

Cloudflare Pages otomatik olarak yeniden deploy eder, D1 bağlantısı ayarlandıktan sonra tekrar ayarlamana gerek yok.

## Yerelde Test Etme (backend olmadan, sadece görünüm)

```bash
python3 -m http.server 8080
```

`http://localhost:8080` — bu modda kayıt/giriş çalışmaz (Functions ve D1 yalnızca Cloudflare'de çalışır). Backend'i yerelde test etmek istersen `npx wrangler pages dev . --d1=DB=cybersec-portfolio-db` komutunu kullanabilirsin (wrangler CLI gerekir).

## Güvenlik Notları

- Şifreler PBKDF2-SHA256 (100.000 iterasyon) ile hashlenir, asla düz metin saklanmaz.
- Oturum çerezleri `HttpOnly; Secure; SameSite=Lax` ile işaretlidir.
- Admin uç noktaları (`/api/admin/*`) her istekte oturumun `role = 'admin'` olduğunu kontrol eder.
- IP adresi ve tarayıcı bilgisi gibi kişisel sayılabilecek veriler yalnızca güvenlik/anomali tespiti amacıyla `login_events` tablosunda tutulur. İstersen zaman zaman `DELETE FROM login_events WHERE created_at < datetime('now','-30 days');` gibi bir sorguyla eski kayıtları temizleyebilirsin.
- Sitedeki "sızma testi / saldırı" temalı metinler ve terminal/matrix görselleri **temsili**dir, gerçek exploit kodu içermez. Kendi sitene karşı test yapman kendi mülkiyetinde olduğu için sorun değildir; izniniz olmayan üçüncü taraf sistemlere karşı test/saldırı yapmak birçok ülkede suçtur.
