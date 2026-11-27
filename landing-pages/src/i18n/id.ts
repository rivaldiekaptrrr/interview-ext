import type { LandingCopy } from './types';

export const idCopy: LandingCopy = {
  nav: {
    features: 'Fitur',
    howItWorks: 'Cara kerja',
    scenarios: 'Skenario',
    faq: 'FAQ',
    cta: 'Pasang di Chrome',
    langToggleAria: 'Ubah bahasa halaman antara English dan Bahasa Indonesia',
    skipToContent: 'Langsung ke konten utama',
  },
  hero: {
    headline: 'Jawab pertanyaan wawancara Google Meet lebih tenang dengan bekal CV Anda sendiri.',
    subheadline:
      'EasyInterview mendengarkan panggilan secara senyap, membedakan suara Anda dari pewawancara, lalu menyusun saran jawaban STAR sesuai pengalaman di CV Anda. Pasang di Chrome, unggah CV sekali, dan tetap fokus pada percakapan.',
    primaryCta: 'Pasang di Chrome',
    secondaryCta: 'Lihat cara kerjanya',
    postClickNote:
      'Gratis dipasang dari Chrome Web Store. Paket berbayar tersedia di dalam ekstensi saat Anda siap menghadapi wawancara nyata. Mendukung Bahasa Inggris dan Indonesia.',
    placeholderBanner:
      'URL Chrome Web Store dapat diatur di src/config/links.ts setelah ekstensi terbit.',
    placeholderClose: 'Tutup info',
  },
  simulator: {
    callTitle: 'Pratinjau panggilan Google Meet',
    photoAlt: 'Tampilan wawancara panel Google Meet dengan beberapa pewawancara di jendela Chrome',
    promptInstruction: 'Pilih contoh pertanyaan wawancara untuk mencoba simulasi asisten',
    hudTitle: 'EasyInterview',
    statusListening: 'Mendengarkan',
    statusDrafting: 'Menyusun',
    statusHidden: 'Panel disembunyikan dengan Alt+H',
    showHudButton: 'Tampilkan asisten (Alt+H)',
    hideButtonTitle: 'Sembunyikan panel (Alt+H)',
    answerNowButton: 'Jawab Sekarang',
    tabBullets: 'Poin Utama',
    tabScript: 'Skrip Lengkap',
    questionHeading: 'Pertanyaan pewawancara',
    candidateProfileHint: 'Disesuaikan dengan contoh CV (Senior Product Engineer, PDF)',
    shortcutHintHide: 'Sembunyikan cepat',
    shortcutHintAnswer: 'Minta jawaban manual',
    questions: [
      {
        id: 'deadline',
        label: 'Masalah tenggat ketat',
        interviewerName: 'Sarah Jenkins',
        interviewerRole: 'Engineering Lead',
        question:
          'Ceritakan saat Anda menyelesaikan masalah produksi yang kritis dengan tenggat waktu ketat.',
        bullets: [
          'Situasi: Latensi halaman checkout melonjak tiga kali lipat dua hari sebelum peluncuran kampanye.',
          'Tugas: Menemukan sumber pelambatan dan menjaga p95 latency di bawah 250ms tanpa menunda rilis.',
          'Aksi: Memeriksa query database, menemukan pencarian tanpa indeks, lalu menerapkan indeks serta cache fallback.',
          'Hasil: Latensi turun dari 920ms ke 180ms dalam empat jam dan peluncuran berjalan sesuai jadwal.',
        ],
        script: [
          'Dua hari menjelang peluncuran kampanye besar, waktu respons checkout melonjak hampir satu detik saat uji beban.',
          'Tugas saya saat itu memastikan sumber masalahnya ditemukan dan latensi kembali di bawah 250 milidetik tanpa membatalkan jadwal rilis.',
          'Saya menelusuri query pada endpoint checkout, menemukan lookup pelanggan tanpa indeks di dalam loop, lalu menambahkan composite index beserta cache sementara.',
          'Dalam empat jam latensi turun ke 180 milidetik, dan sistem melewati lonjakan trafik hari peluncuran tanpa kendala.',
        ],
      },
      {
        id: 'scaling',
        label: 'Prioritas penskalaan proyek',
        interviewerName: 'Sarah Jenkins',
        interviewerRole: 'Engineering Lead',
        question:
          'Bagaimana cara Anda menentukan prioritas saat menangani peningkatan skala proyek sebelumnya?',
        bullets: [
          'Membandingkan risiko keandalan sistem dengan data dampak ke pengguna sebelum memilih urutan kerja.',
          'Menunda pembaruan antarmuka minor demi membenahi retry queue dan rate limiting lebih dulu.',
          'Merangkum trade-off teknis dalam dokumen singkat agar tim produk dan engineering sepakat.',
          'Menurunkan kegagalan background job sebesar 68% sekaligus menghemat biaya server 19%.',
        ],
        script: [
          'Saat trafik platform kami naik pesat, hampir semua divisi mengajukan permintaan mendesak pada pekan sprint yang sama.',
          'Saya menggabungkan laporan error sistem dengan data drop-off pengguna supaya prioritas ditentukan oleh dampak nyata, bukan sekadar suara terbanyak.',
          'Kami sepakat menunda perbaikan visual minor selama dua sprint untuk memperkuat antrean retry dan batas laju request.',
          'Keputusan itu memangkas kegagalan tugas latar belakang sebesar 68% dan menjaga biaya infrastruktur lebih hemat 19%.',
        ],
      },
      {
        id: 'conflict',
        label: 'Perbedaan pendapat tim',
        interviewerName: 'David Pratama',
        interviewerRole: 'Product Manager',
        question:
          'Ceritakan ketidaksepakatan dengan rekan kerja dan bagaimana Anda mencapai solusi bersama.',
        bullets: [
          'Situasi: Tim desain meminta validasi langsung per ketukan tombol, sedangkan tim backend khawatir beban API.',
          'Tugas: Menjaga stabilitas server tanpa membuat alur pendaftaran terasa lambat bagi pengguna.',
          'Aksi: Membuat prototipe singkat untuk menguji aturan validasi lokal dan jeda pengecekan server.',
          'Hasil: Merilis validasi hybrid dalam satu sprint yang memangkas request berulang hingga 80%.',
        ],
        script: [
          'Ketika merancang ulang halaman pendaftaran, desainer menginginkan validasi instan di setiap ketukan sementara tim backend mengkhawatirkan lonjakan trafik API.',
          'Daripada berdebat panjang di chat, saya membuat prototipe kecil selama tiga puluh menit untuk menguji kecepatan ketik nyata.',
          'Kami memadukan aturan format langsung di browser dengan jeda debounce 350 milidetik untuk memeriksa ketersediaan username ke server.',
          'Solusi hybrid tersebut diterima kedua tim dan berhasil menekan panggilan server yang tidak perlu hingga 80%.',
        ],
      },
    ],
  },
  problemSolution: {
    heading: 'Tetap tenang saat pertanyaan tak terduga datang di tengah wawancara',
    lead: 'Banyak kandidat sebenarnya menguasai pekerjaannya, tetapi kesulitan menyusun contoh cerita secara teratur sambil menjaga kontak mata di kamera.',
    beforeTitle: 'Tanpa panduan terstruktur di layar',
    beforePoints: [
      'Pikiran mendadak buntu begitu pertanyaan studi kasus atau perilaku dimulai.',
      'Cerita melebar terlalu panjang tanpa menekankan langkah nyata dan hasil terukur Anda.',
      'Proyek penting dari CV baru teringat setelah panggilan wawancara selesai.',
    ],
    afterTitle: 'Dengan EasyInterview di samping Google Meet',
    afterPoints: [
      'Pertanyaan pewawancara langsung diringkas menjadi poin Situation, Task, Action, dan Result dalam hitungan detik.',
      'Contoh jawaban mengambil pengalaman asli dari CV PDF atau DOCX serta posisi yang Anda lamar.',
      'Tampilan poin ringkas membantu Anda berbicara alami dengan pandangan tetap mengarah ke kamera.',
    ],
  },
  capabilities: {
    heading: 'Dirancang agar tidak mengganggu konsentrasi Anda saat Google Meet',
    lead: 'Setiap bagian ekstensi dibuat agar bekerja senyap di latar belakang sehingga perhatian Anda tetap penuh pada percakapan.',
    screenshotAlt: 'Tampilan panel melayang EasyInterview saat berjalan di jendela Google Meet',
    screenshotCaption: 'Panel asisten bertema terang di dalam sesi Google Meet.',
    items: [
      {
        id: 'speaker',
        title: 'Pemisah suara pembicara otomatis',
        description:
          'Membedakan suara Anda dari satu pewawancara maupun panel beberapa orang sekaligus, dan mengabaikan suara Anda sendiri agar draf hanya muncul untuk pertanyaan mereka.',
      },
      {
        id: 'resume',
        title: 'Mengutip CV dan posisi tujuan Anda',
        description:
          'Unggah CV berformat PDF atau DOCX sekali di popup ekstensi, tambahkan posisi dan perusahaan tujuan, dan setiap saran jawaban menyesuaikan latar belakang Anda.',
      },
      {
        id: 'modes',
        title: 'Poin cepat dan skrip lengkap siap pilih',
        description:
          'Baca poin STAR ringkas agar penyampaian tetap luwes, atau buka skrip penuh dan pilih gaya jawaban STAR, ringkas, maupun teknis mendalam.',
      },
      {
        id: 'bilingual',
        title: 'Selaras wawancara Bahasa Inggris dan Indonesia',
        description:
          'Sekalipun CV Anda ditulis dalam Bahasa Indonesia, EasyInterview menyesuaikan pengalaman kerja Anda ke Bahasa Inggris secara alami saat pewawancara bertanya dalam Bahasa Inggris.',
      },
      {
        id: 'shortcuts',
        title: 'HUD ringkas dengan tombol pintas cepat',
        description:
          'Geser dan atur ukuran panel di layar Google Meet, tekan Alt+H untuk menyembunyikan panel seketika, atau Alt+J saat ingin memicu saran jawaban secara manual.',
        shortcutKeys: ['Alt+H', 'Alt+J'],
      },
    ],
  },
  howItWorks: {
    heading: 'Siap digunakan dalam tiga langkah sederhana',
    lead: 'Dari proses pasang sampai latihan wawancara pertama hanya membutuhkan beberapa menit.',
    steps: [
      {
        stepNumber: 1,
        title: 'Pasang EasyInterview di Chrome',
        description:
          'Tambahkan ekstensi langsung dari Chrome Web Store ke browser Google Chrome Anda.',
      },
      {
        stepNumber: 2,
        title: 'Unggah CV dan detail posisi',
        description:
          'Pilih file CV PDF atau DOCX di popup ekstensi, isi target peran yang dilamar, lalu tentukan gaya serta bahasa jawaban.',
      },
      {
        stepNumber: 3,
        title: 'Masuk ke panggilan Google Meet',
        description:
          'Buka Google Meet seperti biasa. Panel asisten muncul dengan rapi di sisi layar dan mendengarkan pertanyaan secara otomatis.',
      },
    ],
  },
  scenarios: {
    heading: 'Cara kandidat memanfaatkannya di berbagai tahap wawancara',
    lead: 'Setiap babak wawancara menguji sudut pandang yang berbeda. EasyInterview menyesuaikan susunan poin dengan konteks pertanyaan.',
    items: [
      {
        id: 'engineering',
        audience: 'Software dan Engineering',
        title: 'Diskusi arsitektur sistem dan penanganan insiden',
        description:
          'Jaga alur penjelasan debugging, pertimbangan teknis, dan angka latensi atau reliabilitas tetap runtut ketika membahas proyek teknis.',
      },
      {
        id: 'business',
        audience: 'Produk, Bisnis, dan Operasional',
        title: 'Cerita STAR yang tegas pada dampak kerja',
        description:
          'Ubah pengalaman koordinasi lintas tim, negosiasi prioritas, dan target peluncuran menjadi jawaban singkat yang kaya metrik.',
      },
      {
        id: 'graduate',
        audience: 'Fresh Graduate dan Pelamar Global',
        title: 'Menjawab mantap dalam Bahasa Inggris maupun Indonesia',
        description:
          'Rangkai pengalaman magang, tugas akhir, dan organisasi menjadi jawaban terstruktur yang meyakinkan tanpa gugup berlebih.',
      },
    ],
    trustHeading: 'Dirancang dengan menjaga privasi kandidat',
    trustPillars: [
      {
        title: 'Siap untuk Google Meet',
        description: 'Bekerja senyap di latar belakang tanpa perlu mengaktifkan takarir di layar rapat.',
      },
      {
        title: 'Penyimpanan lokal browser',
        description: 'Teks CV, konteks lamaran, dan transkrip rapat disimpan lokal di browser Anda.',
      },
      {
        title: 'Tanpa pelacak iklan',
        description: 'Bebas skrip pelacak iklan pihak ketiga dan data CV Anda tidak pernah diperjualbelikan.',
      },
      {
        title: 'Dukungan dua bahasa',
        description: 'Memakai Bahasa Inggris sebagai bawaan dan beralih rapi ke Bahasa Indonesia kapan saja.',
      },
    ],
  },
  faq: {
    heading: 'Pertanyaan yang sering diajukan',
    lead: 'Penjelasan singkat seputar pemasangan di Chrome, paket berbayar di dalam ekstensi, privasi CV, dan etika panggilan.',
    items: [
      {
        id: 'pricing',
        question: 'Apakah EasyInterview gratis dipasang, dan bagaimana sistem pembayarannya?',
        answer:
          'Ya, pemasangan EasyInterview dari Chrome Web Store gratis. Setelah terpasang, Anda dapat membuka ekstensi untuk mengatur profil CV dan memilih paket berbayar langsung di dalam ekstensi saat ingin menggunakannya.',
      },
      {
        id: 'captions',
        question: 'Apakah ekstensi bekerja tanpa menyalakan takarir (captions) di layar Google Meet?',
        answer:
          'Ya. EasyInterview menangkap percakapan secara senyap di latar belakang selama sesi Google Meet berlangsung sehingga tata letak layar rapat Anda tetap bersih.',
      },
      {
        id: 'screen-share',
        question: 'Bagaimana jika saya harus membagikan layar atau ingin menutup panel cepat?',
        answer:
          'Tekan Alt+H kapan saja untuk menyembunyikan atau memunculkan kembali panel asisten secara instan. Saat harus presentasi atau live coding, bagikan tab browser atau jendela aplikasi tertentu saja, bukan seluruh layar monitor.',
      },
      {
        id: 'privacy',
        question: 'Bagaimana EasyInterview menjaga data CV dan transkrip wawancara saya?',
        answer:
          'Teks CV, detail posisi tujuan, dan transkrip panggilan disimpan lokal di penyimpanan browser Anda sendiri. Ekstensi tidak memakai pelacak iklan dan tidak menjual data pengguna. Penjelasan lengkap tersedia pada Privacy Policy.',
      },
      {
        id: 'language',
        question: 'Apakah bisa membantu jika CV saya berbahasa Indonesia tetapi wawancaranya Bahasa Inggris?',
        answer:
          'Bisa. Saat pewawancara bertanya dalam Bahasa Inggris, EasyInterview otomatis menyusun draf jawaban dalam Bahasa Inggris yang wajar sambil mengadaptasi pengalaman dari CV berbahasa Indonesia Anda.',
      },
      {
        id: 'panel',
        question: 'Apakah cocok untuk wawancara panel dengan beberapa pewawancara sekaligus?',
        answer:
          'Ya. Asisten mendeteksi suara peserta lain secara otomatis, mengabaikan saat Anda sedang menjawab, lalu merangkum konteks pertanyaan sebelum menyusun poin jawaban.',
      },
      {
        id: 'refunds',
        question: 'Bagaimana bantuan tagihan dan pengajuan refund untuk paket di dalam ekstensi?',
        answer:
          'Seluruh kendala penagihan, pertanyaan langganan, dan permohonan refund ditangani langsung melalui email ke rivaldiekaputr@gmail.com. Cantumkan alamat email paket Anda beserta keterangan singkat agar tim kami dapat segera menindaklanjuti.',
      },
    ],
  },
  finalCta: {
    heading: 'Hadapi wawancara Google Meet berikutnya dengan lebih siap',
    description:
      'Pasang EasyInterview dari Chrome Web Store, unggah CV sekali, dan simpan kerangka jawaban tepat di sisi panggilan Anda.',
    button: 'Pasang di Chrome',
    note: 'Gratis dipasang di Chrome. Peningkatan paket dikelola langsung di dalam ekstensi.',
  },
  footer: {
    tagline: 'Asisten wawancara senyap berbasis CV untuk Google Meet.',
    navHeading: 'Produk',
    legalHeading: 'Legal dan dukungan',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    supportLabel: 'Bantuan',
    copyright: '© 2026 EasyInterview. Hak cipta dilindungi.',
  },
  termsModal: {
    title: 'Ketentuan Layanan (Draf Awal)',
    updated: 'Pembaruan terakhir November 2026',
    intro:
      'Ketentuan Layanan ini mengatur pemasangan dan penggunaan ekstensi Chrome EasyInterview. Mohon baca sebelum mengaktifkan paket berbayar di dalam ekstensi.',
    sections: [
      {
        heading: '1. Lisensi dan Tujuan Penggunaan',
        body: 'EasyInterview membantu merangkai poin jawaban berbasis CV secara real-time saat wawancara online. Pengguna bertanggung jawab meninjau setiap saran jawaban dan menyampaikan pengalaman kerja secara jujur.',
      },
      {
        heading: '2. Langganan dan Pembayaran di Dalam Ekstensi',
        body: 'Pemasangan ekstensi di Chrome Web Store bersifat gratis. Paket langganan atau kuota pemakaian berbayar tersedia langsung di dalam ekstensi setelah terpasang, lengkap dengan informasi harga sebelum pembayaran dikonfirmasi.',
      },
      {
        heading: '3. Pembatalan dan Permohonan Refund',
        body: 'Untuk bantuan pembayaran, perubahan langganan, atau pengajuan refund, silakan kirim email ke rivaldiekaputr@gmail.com dengan menyertakan email akun dan detail transaksi.',
      },
      {
        heading: '4. Penyimpanan Data Lokal dan Privasi',
        body: 'EasyInterview menyimpan konteks CV dan preferensi pengguna secara lokal di browser. Informasi pengolahan data lengkap dapat dibaca pada Privacy Policy resmi.',
      },
      {
        heading: '5. Batasan Layanan',
        body: 'EasyInterview berfungsi sebagai alat bantu kesiapan komunikasi saat wawancara dan tidak menjamin hasil penerimaan kerja tertentu.',
      },
    ],
    closeButton: 'Tutup ketentuan',
  },
};
