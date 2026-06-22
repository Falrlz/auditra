<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\A10;
use App\Services\OdsParser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed users
        $admin = User::updateOrCreate(
            ['email' => 'linda@example.com'],
            [
                'name' => 'Linda Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'inisial' => 'LIN',
            ]
        );

        $partner = User::updateOrCreate(
            ['email' => 'sandra@example.com'],
            [
                'name' => 'Sandra Partner',
                'password' => Hash::make('password'),
                'role' => 'partner',
                'inisial' => 'SAN',
            ]
        );

        $manager = User::updateOrCreate(
            ['email' => 'joko@example.com'],
            [
                'name' => 'Joko Manager',
                'password' => Hash::make('password'),
                'role' => 'manager',
                'inisial' => 'JOK',
            ]
        );

        $andi = User::updateOrCreate(
            ['email' => 'andi@example.com'],
            [
                'name' => 'Andi Staff',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'inisial' => 'AND',
            ]
        );

        $saipul = User::updateOrCreate(
            ['email' => 'saipul@example.com'],
            [
                'name' => 'Saipul Staff',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'inisial' => 'SAI',
            ]
        );

        // 2. Seed Client
        $client = \App\Models\Client::updateOrCreate(
            ['nama' => 'PT EASTPARC HOTEL TBK'],
            [
                'tahun_buku' => '31 Desember 2024',
                'jadwal' => 'Pre-Engagement (Analisi Penerimaan Dan Keberlanjutan Hubungan Dengan Klien)',
            ]
        );

        // 3. Seed Tim Perikatan
        \App\Models\EngagementTeam::updateOrCreate(
            ['klien_id' => $client->id, 'user_id' => $andi->id],
            ['peran' => 'anggota']
        );
        \App\Models\EngagementTeam::updateOrCreate(
            ['klien_id' => $client->id, 'user_id' => $saipul->id],
            ['peran' => 'ketua_tim']
        );
        \App\Models\EngagementTeam::updateOrCreate(
            ['klien_id' => $client->id, 'user_id' => $manager->id],
            ['peran' => 'supervisor']
        );
        \App\Models\EngagementTeam::updateOrCreate(
            ['klien_id' => $client->id, 'user_id' => $partner->id],
            ['peran' => 'partner']
        );

        // 4. Parse a10.ods or fallback to a10_db_dump.json
        $odsPath = base_path('a10.ods');
        $jsonDumpPath = base_path('a10_db_dump.json');
        $sectionData = null;

        if (file_exists($odsPath)) {
            $parser = new OdsParser();
            try {
                $sheets = $parser->parse($odsPath);
                $sheet0 = isset($sheets['A10']) ? $sheets['A10'] : array_values($sheets)[0];
                $sectionData = $this->buildStructuredData($sheet0);
            } catch (\Exception $e) {
                $this->command->error("Failed to parse ODS data: " . $e->getMessage());
            }
        } elseif (file_exists($jsonDumpPath)) {
            $sectionData = json_decode(file_get_contents($jsonDumpPath), true);
            $this->command->info("Using fallback a10_db_dump.json for A10 seeding.");
        }

        if ($sectionData) {
            // 5. Create A10 Draft
            A10::create([
                'klien_id' => $client->id,
                'status' => 'draft',
                'form_a10' => $sectionData,
                'pembuat_id' => $andi->id,
            ]);

            $this->command->info("Database seeded successfully with users, client, engagement team, and A10 draft form.");
        } else {
            $this->command->error("Could not seed A10: neither a10.ods nor a10_db_dump.json was found.");
        }
    }

    /**
     * Map raw ODS rows to a clean structured JSON schema for A10.
     */
    private function buildStructuredData(array $rows): array
    {
        $section1 = [];
        $section2_a = [
            'description' => '',
            'pemilik' => [],
            'dewan_komisaris' => [],
            'dewan_direksi' => [],
            'address' => '',
            'revenue_sources' => '',
            'funding_sources' => '',
        ];
        $section2_b = [
            'has_subsidiary' => 'Tidak',
            'subsidiary_detail' => [],
            'related_parties' => [],
        ];
        $section2_c = 'Jasa Audit Laporan keuangan tahun buku 2024';
        $section2_d = [
            'nama_kap' => '',
            'nama_ap' => '',
            'alamat' => '',
            'alasan_penggantian' => '',
            'bantuan_pendahulu' => '',
        ];
        $section2_e = [
            'tujuan_audit' => '',
            'has_internal_audit' => 'Tidak',
            'kedudukan_internal_audit' => '',
            'going_concern' => [],
            'going_concern_conclusion' => '',
        ];
        $section2_f = [
            'buku_pedoman' => '',
            'cara_mengolah_data' => '',
            'auditable' => [],
            'cycles' => '',
        ];
        $section2_g = 'Tidak ada';
        $section2_h = [
            'nilai_kontrak' => '',
            'tahap_pembayaran' => '',
            'jadwal_pelunasan' => [],
        ];
        $section3 = [
            'questions' => [],
            'conclusion' => '',
        ];
        $section4 = [
            'questions' => [],
            'conclusion' => '',
        ];
        $section5 = [
            'staf_introduksi' => '',
            'referensi' => [],
            'prosedur_lain' => [],
            'bantuan_klien' => [],
        ];
        $section6 = [
            'questions' => [],
            'conclusion' => '',
        ];
        $sectionB = [
            'integritas' => '',
            'independensi' => '',
            'auditable' => '',
            'risiko' => '',
            'kesimpulan' => '',
            'level_risiko' => 'Tinggi',
        ];

        // Let's iterate through rows and match values
        // We will match based on row index or cell content patterns
        foreach ($rows as $idx => $row) {
            // Section 1: SA 210 (Rows 45 to 77 are items 1 to 15)
            if (count($row) >= 10 && is_numeric($row[8]) && (int)$row[8] >= 1 && (int)$row[8] <= 15 && $idx < 85) {
                $hasDate = isset($row[11]) && trim($row[11]) !== '';
                $section1[] = [
                    'no' => (int)$row[8],
                    'description' => $row[9],
                    'date' => $hasDate ? $row[10] : '',
                    'initial' => $hasDate ? $row[11] : (isset($row[10]) ? $row[10] : ''),
                ];
            }

            // Section 2.a.1: Latar Belakang
            if ($idx === 85 && count($row) >= 9) {
                $section2_a['description'] = $row[8];
            }
            // Section 2.a.2: Pemilik utama (Rows 107-117)
            if ($idx >= 107 && $idx <= 117 && count($row) >= 13 && is_numeric($row[8])) {
                $section2_a['pemilik'][] = [
                    'no' => (int)$row[8],
                    'nama' => $row[9] === '#NAME?' ? 'Pemegang Saham ' . $row[8] : $row[9],
                    'saham_saham' => $row[10] === '#NAME?' ? '1,000,000' : $row[10],
                    'saham_persen' => $row[11] === '#NAME?' ? '10%' : $row[11],
                    'jabatan' => isset($row[12]) ? $row[12] : '',
                ];
            }
            // Section 2.a: Dewan Komisaris (Rows 121-122)
            if ($idx >= 121 && $idx <= 122 && count($row) >= 37) {
                $section2_a['dewan_komisaris'][] = [
                    'jabatan' => $row[9],
                    'nama_2024' => $row[34] === '#NAME?' ? 'Komisaris ' . ($idx - 120) : $row[34],
                    'nama_2023' => isset($row[36]) && $row[36] !== '#NAME?' ? $row[36] : '',
                ];
            }
            // Section 2.a: Dewan Direksi (Rows 125-128)
            if ($idx >= 125 && $idx <= 128 && count($row) >= 35) {
                $section2_a['dewan_direksi'][] = [
                    'jabatan' => $row[9],
                    'nama_2024' => $row[34] === '#NAME?' ? 'Direktur ' . ($idx - 124) : $row[34],
                    'nama_2023' => isset($row[36]) && $row[36] !== '#NAME?' ? $row[36] : '',
                ];
            }
            // Section 2.a.4: Alamat (Row 133)
            if ($idx === 133 && count($row) >= 9) {
                $section2_a['address'] = $row[8];
            }
            // Section 2.a.5: Sumber Pendapatan (Row 137)
            if ($idx === 137 && count($row) >= 9) {
                $section2_a['revenue_sources'] = $row[8];
            }
            // Section 2.a.7: Pembiayaan (Row 150)
            if ($idx === 150 && count($row) >= 9) {
                $section2_a['funding_sources'] = $row[8];
            }

            // Section 2.b.1: Anak Usaha
            if ($idx === 155 && count($row) >= 14) {
                $section2_b['has_subsidiary'] = $row[11] === '√' ? 'Tidak' : 'Ya';
            }
            // Section 2.b.2: Hubungan Istimewa (Rows 169-179)
            if ($idx >= 169 && $idx <= 179 && count($row) >= 12 && is_numeric($row[8])) {
                $section2_b['related_parties'][] = [
                    'no' => (int)$row[8],
                    'nama' => $row[9] === '#NAME?' ? 'Afiliasi ' . $row[8] : $row[9],
                    'hubungan' => $row[10],
                    'sifat_transaksi' => $row[11],
                ];
            }

            // Section 2.c: Jasa (Row 181)
            if ($idx === 181 && count($row) >= 9) {
                $section2_c = $row[8];
            }

            // Section 2.d: Auditor Pendahulu (Rows 186-198)
            if ($idx === 186 && count($row) >= 35) {
                $section2_d['nama_kap'] = $row[34];
            }
            if ($idx === 188 && count($row) >= 35) {
                $section2_d['nama_ap'] = $row[34];
            }
            if ($idx === 190 && count($row) >= 35) {
                $section2_d['alamat'] = $row[34];
            }
            if ($idx === 193 && count($row) >= 9) {
                $section2_d['alasan_penggantian'] = $row[8];
            }
            if ($idx === 196 && count($row) >= 9) {
                $section2_d['bantuan_pendahulu'] = $row[8];
            }

            // Section 2.e: Risiko Penugasan
            if ($idx === 200 && count($row) >= 9) {
                $section2_e['tujuan_audit'] = $row[8];
            }
            if ($idx === 203 && count($row) >= 9) {
                $section2_e['has_internal_audit'] = $row[8];
            }
            if ($idx === 205 && count($row) >= 9) {
                $section2_e['kedudukan_internal_audit'] = $row[8];
            }
            // Section 2.e.7: Going Concern Questions (Rows 218-228)
            if ($idx >= 218 && $idx <= 228 && count($row) >= 11 && strpos($row[7], ')') !== false) {
                $section2_e['going_concern'][] = [
                    'no' => $row[7],
                    'description' => $row[8],
                    'value' => $row[9],
                    'notes' => isset($row[10]) ? $row[10] : '',
                ];
            }
            if ($idx === 230 && count($row) >= 9) {
                $section2_e['going_concern_conclusion'] = $row[8];
            }

            // Section 2.f: Akuntansi (Rows 233-248)
            if ($idx === 234 && count($row) >= 9) {
                $section2_f['buku_pedoman'] = $row[8];
            }
            if ($idx === 237 && count($row) >= 9) {
                $section2_f['cara_mengolah_data'] = $row[8];
            }
            // Auditable Questions (Rows 241-244)
            if ($idx >= 241 && $idx <= 244 && count($row) >= 10) {
                $section2_f['auditable'][] = [
                    'no' => $row[8],
                    'description' => $row[9],
                    'value' => isset($row[10]) ? $row[10] : '',
                ];
            }
            if ($idx === 248 && count($row) >= 9) {
                $section2_f['cycles'] = $row[8];
            }

            // Section 2.h: Kontrak
            if ($idx === 255 && count($row) >= 9) {
                $section2_h['nilai_kontrak'] = $row[8];
            }
            if ($idx >= 256 && $idx <= 258 && count($row) >= 9 && empty($section2_h['tahap_pembayaran'])) {
                $section2_h['tahap_pembayaran'] .= $row[8] . "\n";
            }
            // Jadwal Pelunasan (Rows 271-272)
            if ($idx >= 271 && $idx <= 272 && count($row) >= 12 && is_numeric($row[9])) {
                $section2_h['jadwal_pelunasan'][] = [
                    'no' => (int)$row[9],
                    'tanggal' => $row[10],
                    'keterangan' => $row[11],
                    'persen' => isset($row[12]) ? $row[12] : '',
                    'nominal' => isset($row[13]) ? $row[13] : '',
                ];
            }

            // Section 3: Integritas (Rows 280-298)
            if ($idx >= 280 && $idx <= 298 && count($row) >= 11 && is_numeric($row[8])) {
                $section3['questions'][] = [
                    'no' => (int)$row[8],
                    'description' => $row[9],
                    'value' => $row[10],
                    'notes' => isset($row[11]) ? $row[11] : '',
                ];
            }
            if ($idx === 300 && count($row) >= 9) {
                $section3['conclusion'] = $row[8];
            }

            // Section 4: Independensi (Rows 306-333)
            if ($idx >= 306 && $idx <= 333 && count($row) >= 10) {
                $noVal = isset($row[8]) ? trim($row[8], ' .') : '';
                if (is_numeric($noVal)) {
                    $section4['questions'][] = [
                        'no' => (int)$noVal,
                        'description' => $row[9],
                        'value' => $row[10],
                        'notes' => isset($row[11]) ? $row[11] : '',
                    ];
                }
            }
            if ($idx === 335 && count($row) >= 9) {
                $section4['conclusion'] = $row[8];
            }

            // Section 5: Bantuan Klien
            if ($idx === 339 && count($row) >= 35) {
                $section5['staf_introduksi'] = $row[34];
            }
            if ($idx === 343 && count($row) >= 35) {
                $section5['referensi'][] = $row[34];
            }
            if ($idx >= 351 && $idx <= 353 && count($row) >= 13) {
                $section5['prosedur_lain'][] = $row[12];
            }
            // Bantuan Klien items (Rows 361-382)
            if ($idx >= 361 && $idx <= 382 && count($row) >= 17) {
                $noVal = isset($row[15]) ? trim($row[15], ' .') : '';
                if (is_numeric($noVal)) {
                    $section5['bantuan_klien'][] = [
                        'no' => (int)$noVal,
                        'description' => isset($row[16]) ? $row[16] : '',
                        'value' => isset($row[17]) ? $row[17] : '',
                        'notes' => isset($row[18]) ? $row[18] : '',
                    ];
                }
            }

            // Section 6: Small Business (Rows 394-407)
            if ($idx >= 394 && $idx <= 407 && count($row) >= 13) {
                $noVal = isset($row[10]) ? trim($row[10], ' .') : '';
                if (is_numeric($noVal)) {
                    $section6['questions'][] = [
                        'no' => (int)$noVal,
                        'description' => isset($row[11]) ? $row[11] : '',
                        'value' => isset($row[12]) ? $row[12] : '',
                        'notes' => isset($row[13]) ? $row[13] : '',
                    ];
                }
            }
            if ($idx === 413 && count($row) >= 11) {
                $section6['conclusion'] = $row[10] === '√' ? 'Tidak termasuk Kategori entitas dengan bisnis kecil untuk tujuan audit' : 'Kategori entitas dengan bisnis kecil untuk tujuan audit';
            }

            // Section B: Evaluasi Penerimaan (Rows 431-461)
            if ($idx === 431 && count($row) >= 10) {
                $sectionB['integritas'] = $row[9];
            }
            if ($idx === 433 && count($row) >= 10) {
                $sectionB['independensi'] = $row[9];
            }
            if ($idx === 436 && count($row) >= 10) {
                $sectionB['auditable'] = $row[9];
            }
            if ($idx === 438 && count($row) >= 10) {
                $sectionB['risiko'] = $row[9];
            }
            if ($idx === 442 && count($row) >= 31) {
                $sectionB['client_name'] = $row[30];
            }
            if ($idx === 448 && count($row) >= 31) {
                $sectionB['kesimpulan'] = $row[30] === '√' ? 'Diterima' : 'Tidak Diterima';
            }
            if ($idx === 455 && count($row) >= 12) {
                $sectionB['level_risiko'] = $row[9] === '√' ? 'Tinggi' : 'Sedang/Rendah';
            }
        }

        return [
            'section_1' => $section1,
            'section_2_a' => $section2_a,
            'section_2_b' => $section2_b,
            'section_2_c' => $section2_c,
            'section_2_d' => $section2_d,
            'section_2_e' => $section2_e,
            'section_2_f' => $section2_f,
            'section_2_g' => $section2_g,
            'section_2_h' => $section2_h,
            'section_3' => $section3,
            'section_4' => $section4,
            'section_5' => $section5,
            'section_6' => $section6,
            'section_b' => $sectionB,
        ];
    }
}
