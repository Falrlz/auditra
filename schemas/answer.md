# Pembahasan Sistematika & Desain Kertas Kerja C10 (Worksheets)

Berdasarkan gambar potongan tabel [1.png](file:///d:/work/auditra/schemas/1.png) dan detail [2.png](file:///d:/work/auditra/schemas/2.png), serta poin-poin tambahan yang Anda sampaikan, berikut adalah pembahasan lengkap mengenai sistematika dan rancangan implementasi untuk kertas kerja C10:

---

## A. Rancangan Struktur Kolom Tabel C10
Berdasarkan visualisasi pada gambar pendukung, tabel C10 akan memiliki kolom-kolom berikut:

| No | Nama Kolom | Jenis Kolom | Penjelasan & Validasi |
| :--- | :--- | :--- | :--- |
| 1 | **Kode Akun** | Input / Auto-Prefix | Kode unik akun (Induk atau Anak). |
| 2 | **Nama Akun** | Input Text | Deskripsi/nama akun. |
| 3 | **Saldo Normal** | Dropdown | Opsi pilihan **Debit (D)** atau **Kredit (K)** (menentukan formula Saldo Audited). |
| 4 | **Saldo Unaudited <Tahun>** | Input Angka | Diisi manual oleh user/auditor. |
| 5 | **Tc M** | Input Text/Select | Tick Mark pertama (untuk memverifikasi Saldo Unaudited). |
| 6 | **Penyesuaian (Debit)** | Input Angka | Kolom mutasi debit hasil penyesuaian audit. |
| 7 | **Penyesuaian (Kredit)** | Input Angka | Kolom mutasi kredit hasil penyesuaian audit. |
| 8 | **Reff** | Input Text | Referensi kertas kerja penyesuaian (misal: AJP-1). |
| 9 | **Saldo Audited <Tahun>** | **Otomatis (Formula)** | Hasil perhitungan dari Saldo Unaudited + Debit - Kredit (berdasarkan Saldo Normal). |
| 10 | **Tc M** | Input Text/Select | Tick Mark kedua (untuk memverifikasi Saldo Audited tahun berjalan). |
| 11 | **Saldo Audited <Tahun - 1>** | Input Angka | Diisi manual oleh user/auditor (untuk pembanding). |
| 12 | **Tc M** | Input Text/Select | Tick Mark ketiga (untuk memverifikasi Saldo Audited tahun sebelumnya). |
| 13 | **Perubahan (Nominal)** | **Otomatis (Formula)** | Selisih antara Saldo Audited tahun ini dengan tahun sebelumnya. |
| 14 | **Perubahan (%)** | **Otomatis (Formula)** | Persentase kenaikan/penurunan saldo audited. |

---

## B. Pembahasan Detail Sistematika Pengisian

### 1. Saldo Normal & Formula Saldo Audited (Poin 1)
*   **Penambahan Kolom:** Dropdown **Debit/Kredit** akan ditambahkan setelah kolom *Nama Akun* agar pengguna dapat menentukan jenis akun secara spesifik.
*   **Formula Matematis:**
    *   Jika **Saldo Normal = Debit**:
        $$\text{Saldo Audited} = \text{Saldo Unaudited} + \text{Penyesuaian Debit} - \text{Penyesuaian Kredit}$$
    *   Jika **Saldo Normal = Kredit**:
        $$\text{Saldo Audited} = \text{Saldo Unaudited} - \text{Penyesuaian Debit} + \text{Penyesuaian Kredit}$$
*   **Penerapan:** Kolom *Saldo Audited* langsung terkunci (*read-only*) dan diperbarui secara *real-time* menggunakan React state saat input pendukungnya berubah.

### 2. Kolom Perubahan (Poin 2)
*   **Perubahan Nominal:**
    $$\text{Perubahan Nominal} = \text{Saldo Audited Tahun Sekarang} - \text{Saldo Audited Tahun Sebelumnya}$$
*   **Perubahan Persentase (%):**
    $$\text{Perubahan \%} = \left( \frac{\text{Perubahan Nominal}}{\text{Saldo Audited Tahun Sebelumnya}} \right) \times 100\%$$
*   **Antisipasi Pembagian dengan Nol (Division by Zero):**
    Jika *Saldo Audited Tahun Sebelumnya* bernilai `0`:
    *   Jika terjadi kenaikan saldo (Nominal > 0) -> Ditampilkan `100%`.
    *   Jika terjadi penurunan saldo (Nominal < 0) -> Ditampilkan `(100%)` (merepresentasikan -100%).
    *   Jika tidak ada perubahan -> Ditampilkan `0%` atau `-`.
*   **Format Nominal Negatif (Standar Akuntansi):**
    Seluruh kolom nominal (saldo unaudited, penyesuaian, audited, dan perubahan) yang memiliki nilai negatif akan diformat menggunakan kurung `( )` alih-alih tanda minus `-`. Contoh: `-2.000` akan ditampilkan sebagai `(2.000)` atau `Rp (2.000)`.

### 3. Dinamisasi Tahun Buku Pada Header (Poin 3)
*   **Rekomendasi Terbaik:** Tahun ditarik secara **otomatis** dari data `book_year` perikatan klien (misalnya `2024`).
*   **Alasan:**
    *   Mencegah ketidaksesuaian data (misal perikatan tahun 2024 tetapi di tabel tertulis 2025).
    *   Mempercepat proses input bagi user.
    *   Header kolom secara otomatis berubah menjadi `Saldo Unaudited 31 Desember 2024`, `Saldo Audited 31 Desember 2024`, dan `Saldo Audited 31 Desember 2023` (menggunakan `book_year - 1`).

### 4. Opsi Penambahan Perbandingan N-2 (Poin 4)
*   **Rekomendasi:** Untuk menjaga lebar layar agar tidak terlalu padat, perbandingan 3 tahun ($N$, $N-1$, $N-2$) sebaiknya menggunakan **Optional Toggle Checkbox** (misalnya `"Tampilkan Kolom Perbandingan 3 Tahun"`). Jika checkbox aktif, kolom saldo $N-2$ beserta tick mark-nya akan muncul secara adaptif.

### 5. Alur Input Akun Induk & Auto-Prefix Akun Anak (Poin 5 & Poin Baru 1-2)
*   **Langkah 1 (Kelompok Akun / Kepala):**
    User menekan tombol *"Tambah Kelompok Akun"* lalu memasukkan Kode Akun Induk (misal: `101`) dan Nama Akun Induk (misal: `HOUSE BANK`).
*   **Langkah 2 (Akun Anak / Cabang):**
    User menekan tombol *"Tambah Akun Anak"* di bawah kelompok induk tersebut. 
    *   Kolom Kode Akun Anak akan secara otomatis menampilkan prefix `101-` yang terkunci (*read-only*).
    *   User hanya perlu mengetikkan angka belakangnya saja (misal: `00-201`).
    *   Aplikasi secara otomatis menggabungkannya menjadi `101-00-201` untuk disimpan dalam database.

### 6. Fleksibilitas Kelompok & Akun Anak (Poin 6 & Poin Baru 3-8)
*   **Multi-Kelompok Akun:** User dapat menambahkan beberapa kelompok akun (Induk `101` beserta anaknya, Induk `103` beserta anaknya, dst.) secara tidak terbatas.
*   **Baris Subtotal Otomatis:**
    *   Setiap akhir kelompok akun memiliki baris `SUBTOTAL` yang dihitung otomatis dari penjumlahan nilai akun-akun anak di dalam kelompok tersebut (unaudited, debit penyesuaian, kredit penyesuaian, audited sekarang, audited sebelumnya, perubahan nominal).
    *   Persentase perubahan subtotal dihitung ulang dari subtotal nominal dibanding subtotal tahun sebelumnya.
*   **Baris Grand Total:**
    *   Baris paling bawah tabel menjumlahkan seluruh subtotal kelompok untuk memberikan ringkasan total aset/kas secara keseluruhan.
*   **Struktur State JSON untuk Data Kertas Kerja C10:**
    ```json
    {
      "notes": "",
      "groups": [
        {
          "id": "group_101",
          "kode_induk": "101",
          "nama_induk": "HOUSE BANK",
          "saldo_normal": "debit",
          "children": [
            {
              "id": "child_101_1",
              "suffix": "00-201",
              "kode_lengkap": "101-00-201",
              "nama": "Petty Cash Outlet",
              "saldo_unaudited": 23500000,
              "tcm_unaudited": "",
              "penyesuaian_debit": 0,
              "penyesuaian_kredit": 0,
              "reff": "",
              "saldo_audited": 23500000,
              "tcm_audited": "",
              "saldo_audited_prev": 0,
              "tcm_audited_prev": ""
            }
          ]
        }
      ]
    }
    ```

---

## C. Rencana Implementasi di AuditFormC10Wizard.jsx

1.  **State Management:** Menggunakan React hooks untuk memanipulasi list `groups` dan `children` di dalam `data.section_data`.
2.  **Fungsi Kalkulasi Otomatis (`recalculateData`):** Sebuah fungsi helper yang dijalankan setiap kali ada perubahan pada kolom input nominal (unaudited, penyesuaian debit/kredit, saldo audited sebelumnya) untuk memperbarui saldo audited, selisih nominal/persentase, subtotal tiap kelompok, dan grand total.
3.  **UI Interaktif & Premium:**
    *   Menggunakan layout tabel berstruktur yang rapi dengan pembagian visual yang jelas antar kelompok akun (misalnya pembatas border tebal atau warna latar belakang zebra).
    *   Tombol aksi yang estetik untuk menambahkan kelompok akun, menambahkan akun anak, dan menghapus baris.
    *   **Format Akuntansi & Parsing Cerdas:**
        *   **Tampilan (Formatting):** Helper `formatCurrency` akan memformat nilai negatif menjadi format akuntansi menggunakan kurung, misalnya `Rp (5.000.000)` atau `(5.000.000)`.
        *   **Input (Parsing):** Sistem akan memiliki parser cerdas yang menerima input manual dalam format tanda minus `-5000` maupun dengan kurung `(5000)`. Keduanya akan disimpan sebagai nilai numerik negatif `-5000` di dalam database.
