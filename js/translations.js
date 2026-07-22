/* ======================================================
   Translations dictionary - TR / EN
   Her key için textContent değiştirilir.
====================================================== */
const translations = {
  // NAVBAR
  "nav.home":        { tr: "Ana Sayfa",  en: "Home" },
  "nav.about":       { tr: "Hakkımda",   en: "About" },
  "nav.skills":      { tr: "Yetenekler", en: "Skills" },
  "nav.experience":  { tr: "Deneyim",    en: "Experience" },
  "nav.education":   { tr: "Eğitim",     en: "Education" },
  "nav.projects":    { tr: "Projeler",   en: "Projects" },
  "nav.certificates":{ tr: "Sertifikalar", en: "Certificates" },
  "nav.contact":     { tr: "İletişim",   en: "Contact" },
  "nav.register":    { tr: "Kayıt Ol",   en: "Register" },
  "nav.login":       { tr: "Giriş Yap",  en: "Login" },

  // HERO
  "hero.tag":   { tr: "root@salih:~# whoami", en: "root@salih:~# whoami" },
  "hero.role":  { tr: "Siber Güvenlik Öğrencisi & Sızma Testi Meraklısı",
                  en: "Cyber Security Student & Penetration Testing Enthusiast" },
  "hero.desc":  { tr: "İstinye Üniversitesi Bilgi Güvenliği Teknolojisi öğrencisiyim. Linux tabanlı sistemler, ağ güvenliği, sızma testi ve Python ile güvenlik otomasyonu üzerine çalışıyorum.",
                  en: "Information Security Technology student at Istinye University. I work on Linux-based systems, network security, penetration testing and Python-based security automation." },
  "hero.btn_projects": { tr: "Projelerimi Gör", en: "View Projects" },
  "hero.btn_contact":  { tr: "İletişime Geç", en: "Contact Me" },
  "hero.btn_login":    { tr: "Panele Giriş", en: "Access Panel" },
  "hero.alert": { tr: "<b>UYARI:</b> Bu site, sahibi tarafından yürütülen yetkilendirilmiş sızma testi (pentest) ve güvenlik denemeleri için bir laboratuvar ortamıdır. Yalnızca site sahibinin izin verdiği testler yapılmaktadır.",
                  en: "<b>WARNING:</b> This site is a lab environment used for authorized penetration testing and security experiments conducted by its owner. Only tests approved by the site owner are performed here." },

  // TERMINAL TYPED LINES (pipe separated)
  "terminal.lines": {
    tr: "nmap -sV target.com|Sızma testi ortamı başlatılıyor...|Sistem: Kali Linux|Durum: Aktif olarak öğreniyor ve saldırıyor",
    en: "nmap -sV target.com|Initializing penetration testing lab...|System: Kali Linux|Status: Actively learning and attacking"
  },

  // ABOUT
  "about.title": { tr: "Hakkımda", en: "About Me" },
  "about.sub":   { tr: "profil.txt", en: "profile.txt" },
  "about.text":  { tr: "İstinye Üniversitesi'nde Bilgi Güvenliği Teknolojisi (Ön Lisans) okuyorum ve mesleki lise geçmişim Siber Güvenlik alanında. Linux tabanlı sistemler, ağ güvenliği temelleri, sızma testi ve Python tabanlı güvenlik otomasyonu konularında deneyimliyim. BAYKAR Technology bünyesinde iki dönem bilgi güvenliği stajı tamamladım, T3 Vakfı'nda öğrenci mentörlüğü yaptım ve İstinye Üniversitesi Siber Güvenlik Kulübü'nde (IsüSiber) başkan yardımcılığı görevini yürütüyorum.",
                  en: "I'm studying Information Security Technology (Associate Degree) at Istinye University, with a vocational high school background in Cybersecurity. I have experience in Linux-based systems, network security fundamentals, penetration testing, and Python-based security automation. I completed two information security internships at BAYKAR Technology, mentored students at the T3 Foundation, and currently serve as Vice President of the Istinye University Cyber Security Club (IsüSiber)." },
  "about.role_label":   { tr: "Ünvan", en: "Role" },
  "about.role_value":   { tr: "Siber Güvenlik Öğrencisi / Pentester", en: "Cyber Security Student / Pentester" },
  "about.status_label": { tr: "Durum", en: "Status" },
  "about.status_value": { tr: "Türkiye Siber Vatan Programı - Devam Ediyor", en: "Türkiye Siber Vatan Program - Ongoing" },
  "about.lang_label":   { tr: "Diller", en: "Languages" },
  "about.lang_value":   { tr: "Türkçe (Anadil), İngilizce", en: "Turkish (Native), English" },
  "about.loc_label":    { tr: "Konum", en: "Location" },
  "about.loc_value":    { tr: "İstanbul, Türkiye", en: "Istanbul, Türkiye" },

  // SKILLS
  "skills.title": { tr: "Yetenekler", en: "Skills" },
  "skills.sub":   { tr: "cat skills.json", en: "cat skills.json" },
  "skill.pentest":  { tr: "Sızma Testi (Pentest)", en: "Penetration Testing" },
  "skill.network":  { tr: "Ağ Güvenliği Temelleri", en: "Network Security Fundamentals" },
  "skill.subnet":   { tr: "IP Adresleme & Subnetting", en: "IP Addressing & Subnetting" },
  "skill.python":   { tr: "Python", en: "Python" },
  "skill.kali":     { tr: "Kali Linux", en: "Kali Linux" },
  "skill.team":     { tr: "Takım Çalışması", en: "Teamwork" },
  "skill.scan":     { tr: "Ağ Tarama (Network Scanning)", en: "Network Scanning" },

  // EXPERIENCE
  "experience.title": { tr: "Deneyim", en: "Experience" },
  "experience.sub":   { tr: "tail -f experience.log", en: "tail -f experience.log" },

  "exp1.date": { tr: "2023", en: "2023" },
  "exp1.title": { tr: "Bilgi Güvenliği Stajyeri", en: "Information Security Intern" },
  "exp1.org":  { tr: "BAYKAR Technology", en: "BAYKAR Technology" },
  "exp1.li1":  { tr: "Bilgi güvenliği alanında zorunlu 2 aylık stajımı tamamladım.", en: "Completed a mandatory 2-month internship in the field of information security." },

  "exp2.date": { tr: "2024", en: "2024" },
  "exp2.title": { tr: "Bilgi Güvenliği Stajyeri", en: "Information Security Intern" },
  "exp2.org":  { tr: "BAYKAR Technology", en: "BAYKAR Technology" },
  "exp2.li1":  { tr: "Bilgi güvenliği alanında 3 aylık gönüllü stajımı tamamladım.", en: "Completed a 3-month volunteer internship in the field of information security." },

  "exp3.date": { tr: "2024 - 2025", en: "2024 - 2025" },
  "exp3.title": { tr: "Öğrenci Mentörü", en: "Student Mentor" },
  "exp3.org":  { tr: "T3 Vakfı - Türkiye Teknoloji Takımı", en: "T3 Foundation - Turkish Technology Team" },
  "exp3.li1":  { tr: "Teknoloji ve inovasyon alanlarında öğrencilerle bilgi ve deneyim paylaşımında bulundum.", en: "Shared knowledge and hands-on experience with students in the fields of technology and innovation." },
  "exp3.li2":  { tr: "Atölye çalışmalarına ve eğitim etkinliklerine aktif olarak katkıda bulundum.", en: "Actively contributed to workshops and educational events, supporting learning processes." },
  "exp3.li3":  { tr: "TEKNOFEST için proje geliştiren öğrencilere teknik mentorluk sağladım.", en: "Provided technical mentorship to students developing projects for TEKNOFEST." },

  "exp4.date": { tr: "2024 - 2025", en: "2024 - 2025" },
  "exp4.title": { tr: "Başkan Yardımcısı", en: "Vice President" },
  "exp4.org":  { tr: "İstinye Üniversitesi Siber Güvenlik Kulübü (IsüSiber)", en: "İstinye University Cyber Security Club (IsüSiber)" },
  "exp4.li1":  { tr: "Kulüp etkinlik ve faaliyetlerinin planlanması ve organizasyonundan sorumlu oldum.", en: "Responsible for planning and organizing club events and activities." },
  "exp4.li2":  { tr: "Etkinlikler ve eğitim oturumları sırasında takımlar arası koordinasyonu yönettim.", en: "Led coordination efforts across teams during events and educational sessions." },

  "exp5.date": { tr: "Devam Ediyor", en: "Ongoing" },
  "exp5.title": { tr: "Katılımcı", en: "Participant" },
  "exp5.org":  { tr: "Türkiye Siber Vatan Programı", en: "Türkiye Siber Vatan Program" },
  "exp5.li1":  { tr: "Sızma testi, ağ güvenliği ve gerçek dünya saldırı/savunma senaryolarına odaklanan ulusal bir program kapsamında yapılandırılmış siber güvenlik eğitimi alıyorum.", en: "Undergoing structured cybersecurity training within a national program, focusing on penetration testing, network security, and real-world attack and defense scenarios." },

  // EDUCATION
  "education.title": { tr: "Eğitim", en: "Education" },
  "education.sub":   { tr: "ls -la education/", en: "ls -la education/" },

  "edu1.date": { tr: "2024 - Devam Ediyor", en: "2024 - Present" },
  "edu1.title": { tr: "Bilgi Güvenliği Teknolojisi (Ön Lisans)", en: "Information Security Technology (Associate Degree)" },
  "edu1.org":  { tr: "İstinye Üniversitesi", en: "İstinye University" },

  "edu2.date": { tr: "2025 - Devam Ediyor", en: "2025 - Present" },
  "edu2.title": { tr: "Web Tasarımı ve Kodlama (Ön Lisans)", en: "Web Design and Coding (Associate Degree)" },
  "edu2.org":  { tr: "İstanbul Üniversitesi", en: "İstanbul University" },

  "edu3.date": { tr: "2020 - 2024", en: "2020 - 2024" },
  "edu3.title": { tr: "Siber Güvenlik Bölümü - Lise", en: "Cyber Security Department - High School" },
  "edu3.org":  { tr: "Nevşehir MTAL", en: "Nevşehir MTAL" },

  // PROJECTS
  "projects.title": { tr: "Projeler", en: "Projects" },
  "projects.sub":   { tr: "git log --oneline", en: "git log --oneline" },

  "proj1.tag":   { tr: "Web · Python · Pentest", en: "Web · Python · Pentest" },
  "proj1.title": { tr: "Pentest Kontrol Paneli", en: "Pentest Control Panel" },
  "proj1.desc":  { tr: "Birden fazla sızma testi aracını tek bir arayüzde birleştiren, web tabanlı bir kontrol paneli.", en: "A web-based control panel integrating multiple penetration testing tools into a unified interface." },
  "proj1.li1":   { tr: "Python ve modern web teknolojileri kullanılarak geliştirildi.", en: "Developed using Python and modern web technologies." },
  "proj1.li2":   { tr: "Farklı güvenlik test araçlarını destekleyecek modüler mimari tasarlandı.", en: "Designed modular architecture to support different security testing tools in a unified interface." },
  "proj1.li3":   { tr: "Güvenlik değerlendirme iş akışlarını hızlandırmak için AI destekli analiz ve otomatik raporlama eklendi.", en: "Implemented AI-assisted analysis and automated reporting to streamline security assessment workflows." },

  "proj2.tag":   { tr: "Ulusal Program · Devam Ediyor", en: "National Program · Ongoing" },
  "proj2.title": { tr: "Türkiye Siber Vatan Programı", en: "Türkiye Siber Vatan Program" },
  "proj2.desc":  { tr: "Sızma testi, ağ güvenliği ve gerçek dünya saldırı/savunma senaryolarına odaklanan ulusal siber güvenlik eğitim programı.", en: "National cybersecurity training program focused on penetration testing, network security, and real-world attack/defense scenarios." },

  "proj3.tag":   { tr: "Gönüllülük", en: "Volunteering" },
  "proj3.title": { tr: "Türkiye Teknoloji Takımı Vakfı (Gönüllü)", en: "Türkiye Technology Team Foundation (Volunteer)" },
  "proj3.desc":  { tr: "T3 Vakfı bünyesinde çeşitli projelerde gönüllü olarak yer aldım. TEKNOFEST İstanbul'da görev alarak öğrencilere teknoloji tanıtımı ve mentorluk desteği sağladım.", en: "Actively participated in various projects as a volunteer at T3 Foundation. Served at TEKNOFEST Istanbul, introducing technology to students and supporting mentorship activities." },

  // CERTIFICATES
  "certificates.title": { tr: "Sertifikalar & Başarılar", en: "Achievements & Certificates" },
  "certificates.sub":   { tr: "cat certificates.txt", en: "cat certificates.txt" },
  "cert1": { tr: "Versiyon Kontrolü: Git ve GitHub — BTK Akademi", en: "Version Control: Git and GitHub — BTK Academy" },
  "cert2": { tr: "Siber Kulüpler Birliği 2025 Kış Kampı: Dijital Adli Bilişim", en: "Cyber Clubs Union 2025 Winter Camp: Digital Forensics" },
  "cert3": { tr: "Cyber Anadolu Toplulukları 2025 Siber Güvenlik Kış Kampı: Ağ Güvenliği", en: "Cyber Anadolu Communities 2025 Cybersecurity Winter Camp: Network Security" },
  "cert4": { tr: "Siber Güvenliğe Giriş — Cisco", en: "Introduction to Cybersecurity — Cisco" },
  "cert5": { tr: "Siber Güvenliğe Giriş — TryHackMe", en: "Introduction to Cyber Security — TryHackMe" },
  "cert6": { tr: "Cisco CCNA: Ağlara Giriş — Cisco", en: "Cisco CCNA: Introduction to Networks — Cisco" },
  "cert7": { tr: "Cisco CCNA 2: Anahtarlama, Yönlendirme ve Kablosuz Ağ Temelleri — Cisco", en: "Cisco CCNA 2: Switching, Routing, and Wireless Essentials — Cisco" },

  // CONTACT
  "contact.title": { tr: "İletişim", en: "Contact" },
  "contact.sub":   { tr: "ping salih --start-connection", en: "ping salih --start-connection" },
  "contact.email_label": { tr: "E-posta", en: "Email" },
  "contact.github_label": { tr: "GitHub", en: "GitHub" },
  "contact.linkedin_label": { tr: "LinkedIn", en: "LinkedIn" },

  // FOOTER
  "footer.text": { tr: "Tüm hakları saklıdır.", en: "All rights reserved." },
  "footer.made": { tr: "Cloudflare Pages üzerinde barındırılıyor.", en: "Hosted on Cloudflare Pages." },

  // LOGIN PAGE
  "login.title": { tr: "Güvenli Erişim", en: "Secure Access" },
  "login.sub":   { tr: "Devam etmek için kimlik bilgilerinizi girin", en: "Enter your credentials to continue" },
  "login.email_label": { tr: "E-posta", en: "Email" },
  "login.pass_label":  { tr: "Şifre", en: "Password" },
  "login.btn":   { tr: "Giriş Yap", en: "Login" },
  "login.back":  { tr: "← Ana sayfaya dön", en: "← Back to home" },
  "login.no_account": { tr: "Hesabın yok mu?", en: "Don't have an account?" },
  "login.register_link": { tr: "Kayıt ol", en: "Register" },
  "login.err_empty": { tr: "Lütfen tüm alanları doldurun.", en: "Please fill in all fields." },
  "login.err_invalid": { tr: "Geçersiz e-posta veya şifre.", en: "Invalid email or password." },
  "login.err_not_approved": { tr: "Hesabın henüz onaylanmadı. Yönetici onayı bekleniyor.", en: "Your account has not been approved yet. Waiting for admin approval." },
  "login.err_rejected": { tr: "Hesap başvurun reddedildi. Detay için iletişime geç.", en: "Your account request was rejected. Please get in touch for details." },
  "login.err_server": { tr: "Sunucu hatası, lütfen daha sonra tekrar deneyin.", en: "Server error, please try again later." },
  "login.ok_msg": { tr: "Erişim onaylandı. Yönlendiriliyor...", en: "Access granted. Redirecting..." },

  // REGISTER PAGE
  "register.title": { tr: "Hesap Oluştur", en: "Create Account" },
  "register.sub":   { tr: "Erişim talebi göndermek için bilgilerini gir", en: "Fill in your details to request access" },
  "register.name_label":    { tr: "Ad Soyad", en: "Full Name" },
  "register.email_label":  { tr: "E-posta", en: "Email" },
  "register.phone_label":  { tr: "Telefon", en: "Phone" },
  "register.pass_label":   { tr: "Şifre", en: "Password" },
  "register.confirm_label":{ tr: "Şifre (Tekrar)", en: "Confirm Password" },
  "register.btn":   { tr: "Kayıt Ol", en: "Register" },
  "register.have_account": { tr: "Zaten hesabın var mı?", en: "Already have an account?" },
  "register.login_link":   { tr: "Giriş yap", en: "Login" },
  "register.back":  { tr: "← Ana sayfaya dön", en: "← Back to home" },
  "register.note":  { tr: "Kayıt sonrası hesabın <b>onay bekliyor</b> durumuna geçer. Site yöneticisi onaylayana kadar giriş yapamazsın.", en: "After registering, your account status becomes <b>pending approval</b>. You can't log in until the site admin approves it." },
  "register.err_missing": { tr: "Lütfen tüm zorunlu alanları doldur.", en: "Please fill in all required fields." },
  "register.err_email_invalid": { tr: "Geçerli bir e-posta adresi gir.", en: "Please enter a valid email address." },
  "register.err_password_weak": { tr: "Şifre en az 8 karakter olmalı.", en: "Password must be at least 8 characters." },
  "register.err_password_mismatch": { tr: "Şifreler eşleşmiyor.", en: "Passwords do not match." },
  "register.err_email_exists": { tr: "Bu e-posta ile zaten bir hesap var.", en: "An account with this email already exists." },
  "register.err_server": { tr: "Sunucu hatası, lütfen daha sonra tekrar deneyin.", en: "Server error, please try again later." },
  "register.success": { tr: "Kayıt başarılı! Hesabın onay bekliyor. Yönetici onayladıktan sonra giriş yapabilirsin.", en: "Registration successful! Your account is pending approval. You can log in once the admin approves it." },
  "register.strength_weak": { tr: "Zayıf", en: "Weak" },
  "register.strength_medium": { tr: "Orta", en: "Medium" },
  "register.strength_strong": { tr: "Güçlü", en: "Strong" },

  // DASHBOARD PAGE
  "dash.title": { tr: "Kontrol Paneli", en: "Control Panel" },
  "dash.welcome_user": { tr: "Hoş geldin! Hesabın onaylı ve aktif.", en: "Welcome! Your account is approved and active." },
  "dash.welcome_admin": { tr: "Hoş geldin, Yönetici. Kullanıcıları buradan yönetebilirsin.", en: "Welcome, Admin. You can manage users from here." },
  "dash.logout": { tr: "Çıkış Yap", en: "Logout" },
  "dash.loading": { tr: "Yükleniyor...", en: "Loading..." },
  "dash.card1": { tr: "Sistem Durumu", en: "System Status" },
  "dash.card2": { tr: "Aktif Modüller", en: "Active Modules" },
  "dash.card3": { tr: "Hesap Bilgileri", en: "Account Info" },
  "dash.note": { tr: "Not: \"Sistem Durumu\" ve \"Aktif Modüller\" kartları temsili/gösterim amaçlıdır.", en: "Note: the \"System Status\" and \"Active Modules\" cards are illustrative/for display purposes." },

  "dash.admin_title": { tr: "Kullanıcı Yönetimi", en: "User Management" },
  "dash.stats_total": { tr: "Toplam Kullanıcı", en: "Total Users" },
  "dash.stats_pending": { tr: "Onay Bekleyen", en: "Pending Approval" },
  "dash.stats_approved": { tr: "Onaylı", en: "Approved" },
  "dash.stats_admins": { tr: "Yönetici", en: "Admins" },
  "dash.search_placeholder": { tr: "İsim veya e-posta ile ara...", en: "Search by name or email..." },
  "dash.table_name": { tr: "Ad Soyad", en: "Name" },
  "dash.table_email": { tr: "E-posta", en: "Email" },
  "dash.table_phone": { tr: "Telefon", en: "Phone" },
  "dash.table_role": { tr: "Rol", en: "Role" },
  "dash.table_status": { tr: "Durum", en: "Status" },
  "dash.table_date": { tr: "Kayıt Tarihi", en: "Registered" },
  "dash.table_actions": { tr: "İşlemler", en: "Actions" },
  "dash.btn_approve": { tr: "Onayla", en: "Approve" },
  "dash.btn_reject": { tr: "Reddet", en: "Reject" },
  "dash.btn_promote": { tr: "Admin Yap", en: "Make Admin" },
  "dash.btn_demote": { tr: "Yetkiyi Al", en: "Remove Admin" },
  "dash.btn_delete": { tr: "Sil", en: "Delete" },
  "dash.no_users": { tr: "Kullanıcı bulunamadı.", en: "No users found." },
  "dash.status_pending": { tr: "Onay Bekliyor", en: "Pending" },
  "dash.status_approved": { tr: "Onaylı", en: "Approved" },
  "dash.status_rejected": { tr: "Reddedildi", en: "Rejected" },
  "dash.role_admin": { tr: "Yönetici", en: "Admin" },
  "dash.role_user": { tr: "Kullanıcı", en: "User" },
  "dash.confirm_delete": { tr: "Bu kullanıcıyı silmek istediğine emin misin?", en: "Are you sure you want to delete this user?" },

  // TOAST MESSAGES
  "toast.approved": { tr: "Kullanıcı onaylandı.", en: "User approved." },
  "toast.rejected": { tr: "Kullanıcı reddedildi.", en: "User rejected." },
  "toast.promoted": { tr: "Kullanıcı yönetici yapıldı.", en: "User promoted to admin." },
  "toast.demoted": { tr: "Yönetici yetkisi alındı.", en: "Admin role removed." },
  "toast.deleted": { tr: "Kullanıcı silindi.", en: "User deleted." },
  "toast.error": { tr: "Bir hata oluştu.", en: "Something went wrong." }
};
