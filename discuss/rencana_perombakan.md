# Rencana Perombakan Aplikasi Auditra (A10 & D10)

Berdasarkan analisis terhadap dokumen `schemas/1.md` dan isi laporan A10 serta D10 pada folder `laporan`, berikut adalah rangkuman analisis perbedaan/penyesuaian serta rencana tindakan implementasi yang akan dilakukan.

---

## 1. Analisis Perombakan Sistem (Berdasarkan `schemas/1.md`)

Terdapat perbedaan mendasar antara implementasi saat ini dengan spesifikasi baru:

### A. Restrukturisasi Autentikasi & Role
* **Role Sistem (User)**:
  * **Saat ini**: Pengguna langsung memiliki role tim (`anggota`, `ketua_tim`, `supervisor`).
  * **Perombakan**: Role sistem akan diubah menjadi role organisasi/jabatan asli:
    * `admin` (Linda)
    * `partner` (Sandra)
    * `manager` (Joko)
    * `staff` (Andi, Saipul)
  * **Fitur Register**: Halaman registrasi publik akan dinonaktifkan. Hanya `admin` yang dapat mendaftarkan user baru dan melihat daftar user.
  * **Kolom Baru**: Menambahkan kolom `inisial` pada tabel `users` (contoh: Andi -> AND, Joko -> JOK).

### B. Pengenalan Tabel Perikatan (Client) & Tim Perikatan
* **Tabel Perikatan (Clients)**:
  * Menambahkan tabel `clients` (atau `perikatans`) untuk mengelola data klien: `id`, `name`, `book_year`, `schedule`.
  * Hanya `admin` yang memiliki akses CRUD untuk mengelola daftar perikatan ini.
* **Tabel Tim Perikatan (Engagement Teams)**:
  * Menambahkan tabel relasi/pivot `tim_perikatans` yang menghubungkan `clients` dan `users` dengan role spesifik di tim perikatan tersebut:
    * `anggota` (Hanya untuk user dengan role sistem `staff`)
    * `ketua_tim` (Hanya untuk user dengan role sistem `staff`)
    * `supervisor` (Hanya untuk user dengan role sistem `manager`)
    * `partner` (Hanya untuk user dengan role sistem `partner`)
  * Hanya `partner` yang dapat menentukan dan membuat susunan tim perikatan untuk setiap client.

### C. Alur Kerja Akses & Approval Berdasarkan Role Tim Perikatan
Akses halaman detail perikatan dan pengerjaan laporan disesuaikan dengan role anggota di dalam tim perikatan tersebut, bukan role sistem globalnya. Alur approval linear baru adalah sebagai berikut:
1. **Draft**: Laporan diisi dan diubah oleh **Anggota**.
2. **Review Ketua Tim**: Anggota melakukan submit $\rightarrow$ status berubah menjadi `pending_ketua_tim`.
   * **Ketua Tim** meninjau. Jika **Approve**, status berubah menjadi `pending_supervisor`. Jika **Reject**, status kembali ke draft dengan catatan perbaikan (`rejected`).
3. **Review Supervisor**:
   * **Supervisor** meninjau. Jika **Approve**, status berubah menjadi `pending_partner`. Jika **Reject**, status kembali ke draft dengan catatan perbaikan (`rejected`).
4. **Review Partner**:
   * **Partner** meninjau secara final. Jika **Approve**, status menjadi `final_approved`. Jika **Reject**, status kembali ke draft dengan catatan perbaikan (`rejected`).

---

## 2. Analisis Isi Laporan A10 & D10 (Berdasarkan `laporan/`)

### A. Laporan A10 (Survei Penerimaan Klien)
Laporan A10 yang diimplementasikan di `AuditFormWizard.jsx` secara umum sudah sesuai dengan isi gambar `1.png` hingga `10.png` di folder `laporan/a10`, yang meliputi:
* SA 210 (Pemahaman Awal)
* Latar Belakang & Bisnis Klien (termasuk pemilik, dewan komisaris, direksi, alamat, pendapatan, pembiayaan)
* Hubungan Istimewa & Anak Usaha
* Evaluasi Risiko Penugasan & Going Concern
* Akuntansi & Pelaporan Keuangan (Auditabilitas)
* Prakiraan Kontrak & Jadwal Pelunasan Fee
* Penilaian Integritas Manajemen & Independensi KAP
* Penentuan Kategori Bisnis Kecil
* Kesimpulan Evaluasi Penerimaan & Tingkat Risiko

**Penyesuaian**: Menghubungkan form A10 ini ke entitas `Client` yang dipilih di dashboard.

### B. Laporan D10 (Materialitas) $\rightarrow$ *Perubahan Mayor*
* **Isu Saat Ini**: Komponen D10 saat ini (`AuditFormD10Wizard.jsx`) hanya berupa kuesioner checklist independensi sederhana (placeholder).
* **Perombakan**: Mengubah D10 menjadi **Kalkulator Materialitas** sesuai dengan gambar `1.png` dan `2.png` pada `laporan/d10`:
  1. **Bagian A: Materialitas Keseluruhan (Overall Materiality)**:
     * Pilihan kondisi keuangan klien (dropdown: "Kondisi keuangan perusahaan stabil", dll).
     * Input angka untuk faktor benchmark:
       * Pendapatan
       * Laba Bersih Sebelum Pajak
       * Total Aset
       * Total Ekuitas
     * Setiap baris menghitung: `Nominal * Persentase (%) = Hasil`.
     * Input hasil pembulatan (`Dibulatkan`) sebagai nilai **Overall Materiality**.
  2. **Bagian B: Materialitas Pelaksanaan (Performance Materiality)**:
     * Evaluasi kualitatif berupa 4 pertanyaan risiko (Y/T, Catatan).
     * Dropdown persentase (kisaran 25% - 80%).
     * Perhitungan otomatis: `Persentase (%) * Overall Materiality = Performance Materiality`.
  3. **Bagian C: Batas Salah Saji Tidak Dikoreksi (Tolerable Error)**:
     * Input persentase (default 5%).
     * Perhitungan otomatis: `Persentase (%) * Overall Materiality = Tolerable Error`.
  4. **Bagian D: Materialitas Pelaksanaan Tingkat Saldo Akun**:
     * Tabel daftar akun laporan keuangan klien dengan kolom:
       * Nama Akun
       * Nilai Inhouse (Balance)
       * Dropdown Persentase Materialitas Pelaksanaan (0%, 25%, 50%, 80%)
       * Nominal (Perhitungan otomatis: `Persentase (%) * Overall Materiality`)
       * Status Materil (Otomatis "Material" jika `Nilai Inhouse > Nominal`, jika tidak "Tidak")

---

## 3. Rencana Tindakan Implementasi

Berikut langkah-langkah konkret yang akan diambil untuk melakukan perombakan ini:

### Tahap 1: Migrasi Database & Model (Backend)
1. **User Schema (`users`)**:
   * Menambahkan kolom `inisial` (string).
   * Menyesuaikan role sistem default ke: `admin`, `partner`, `manager`, `staff`.
2. **Client Schema (`clients`)**:
   * Membuat tabel `clients` baru: `id`, `name`, `book_year`, `schedule`, `timestamps`.
3. **Engagement Team Schema (`tim_perikatans`)**:
   * Membuat tabel pivot `tim_perikatans` baru: `id`, `client_id`, `user_id`, `role` (`anggota`, `supervisor`, `ketua_tim`, `partner`).
4. **Audit Form Schema (`audit_forms`)**:
   * Mengubah relasi dari string `client_name` menjadi foreign key `client_id` merujuk ke tabel `clients`.
   * Menyesuaikan enum/status approval flow: `draft`, `pending_ketua_tim`, `pending_supervisor`, `pending_partner`, `final_approved`, `rejected`.
5. **Database Seeder**:
   * Menyesuaikan seeder untuk membuat user bawaan: Linda (admin), Sandra (partner), Joko (manager), Andi & Saipul (staff).
   * Membuat data perikatan awal untuk klien PT EASTPARC HOTEL TBK.
   * Membuat tim perikatan untuk PT EASTPARC HOTEL TBK sesuai contoh (Andi $\rightarrow$ anggota, Joko $\rightarrow$ supervisor, Saipul $\rightarrow$ ketua_tim, Sandra $\rightarrow$ partner).
   * Memasukkan data awal laporan A10 dan kalkulasi D10 dari proses parsing ODS.

### Tahap 2: Middleware & Controller (Backend API)
1. **Hak Akses & Middleware**:
   * Membuat middleware untuk validasi akses perikatan berdasarkan keanggotaan tim perikatan klien.
2. **AuditFormController**:
   * Mengupdate query `index()` untuk mengembalikan perikatan/klien yang relevan dengan user yang login.
   * Menyesuaikan endpoint CRUD klien untuk Admin.
   * Menambahkan endpoint pengaturan tim perikatan untuk Partner.
   * Menyesuaikan alur approval (approve/reject dengan reject_reason) untuk setiap role tim perikatan.

### Tahap 3: Pembuatan Antarmuka Pengguna (Frontend React + Inertia)
1. **Sidebar & Layout**:
   * Menampilkan menu "Kelola Perikatan" dan "Kelola User" hanya untuk role `admin`.
   * Menampilkan menu penyusunan tim perikatan pada detail klien hanya untuk role `partner`.
2. **Dashboard Utama**:
   * Menampilkan list perikatan/klien yang dapat diakses oleh user.
   * Menampilkan tombol tambah/edit perikatan jika login sebagai `admin`.
   * Menampilkan panel tim perikatan jika login sebagai `partner`.
3. **Form Wizard Laporan A10**:
   * Menyesuaikan data masukan A10 agar terikat langsung dengan client ID.
4. **Form Wizard Laporan D10 (Materialitas Baru)**:
   * Mengganti wizard D10 lama dengan kalkulator materialitas interaktif.
   * Mengintegrasikan tabel saldo akun (akun inhouse) dengan kalkulasi persentase dan penentuan otomatis status materialitas akun.
