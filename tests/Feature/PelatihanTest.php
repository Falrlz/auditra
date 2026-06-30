<?php

use App\Models\User;
use App\Models\Pegawai;
use App\Models\Pelatihan;
use App\Models\PresensiPelatihan;
use Carbon\Carbon;

test('admin can create training draft successfully', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $response = $this->actingAs($admin)->post(route('pelatihan.store'), [
        'kegiatan' => 'Pelatihan Audit Lanjutan',
        'deskripsi' => 'Belajar audit laporan keuangan terkomputerisasi',
        'skp' => 4,
        'mulai' => Carbon::now()->addDays(2)->format('Y-m-d H:i:s'),
        'akhir' => Carbon::now()->addDays(2)->addHours(4)->format('Y-m-d H:i:s'),
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('pelatihan.index'));

    $this->assertDatabaseHas('pelatihan', [
        'kegiatan' => 'Pelatihan Audit Lanjutan',
        'skp' => 4,
        'status' => 'draft',
        'created_by' => $adminPegawai->id,
    ]);
});

test('admin can update training draft', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $pelatihan = Pelatihan::create([
        'kegiatan' => 'Pelatihan Pajak Awal',
        'skp' => 2,
        'mulai' => Carbon::now()->addDays(1),
        'akhir' => Carbon::now()->addDays(1)->addHours(2),
        'status' => 'draft',
        'created_by' => $adminPegawai->id,
    ]);

    $response = $this->actingAs($admin)->put(route('pelatihan.update', $pelatihan->id), [
        'kegiatan' => 'Pelatihan Pajak Intermediate',
        'deskripsi' => 'Pajak lanjutan PPh Pasal 21',
        'skp' => 3,
        'mulai' => Carbon::now()->addDays(1)->format('Y-m-d H:i:s'),
        'akhir' => Carbon::now()->addDays(1)->addHours(3)->format('Y-m-d H:i:s'),
    ]);

    $response->assertSessionHasNoErrors();
    $this->assertDatabaseHas('pelatihan', [
        'id' => $pelatihan->id,
        'kegiatan' => 'Pelatihan Pajak Intermediate',
        'skp' => 3,
    ]);
});

test('admin cannot edit training when submitted or approved', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $pelatihan = Pelatihan::create([
        'kegiatan' => 'Pelatihan Pajak Awal',
        'skp' => 2,
        'mulai' => Carbon::now()->addDays(1),
        'akhir' => Carbon::now()->addDays(1)->addHours(2),
        'status' => 'menunggu_persetujuan',
        'created_by' => $adminPegawai->id,
    ]);

    $response = $this->actingAs($admin)->put(route('pelatihan.update', $pelatihan->id), [
        'kegiatan' => 'Pelatihan Pajak Gagal',
        'skp' => 4,
        'mulai' => Carbon::now()->addDays(1)->format('Y-m-d H:i:s'),
        'akhir' => Carbon::now()->addDays(1)->addHours(3)->format('Y-m-d H:i:s'),
    ]);

    $response->assertStatus(403);
});

test('partner can approve training successfully', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $partnerPegawai = Pegawai::factory()->create(['jabatan' => 'partner']);
    $partner = User::factory()->create(['pegawai_id' => $partnerPegawai->id]);

    $pelatihan = Pelatihan::create([
        'kegiatan' => 'Pelatihan Audit',
        'skp' => 3,
        'mulai' => Carbon::now()->addDays(1),
        'akhir' => Carbon::now()->addDays(1)->addHours(2),
        'status' => 'menunggu_persetujuan',
        'created_by' => $adminPegawai->id,
    ]);

    $response = $this->actingAs($partner)->post(route('pelatihan.approve', $pelatihan->id));

    $response->assertSessionHasNoErrors();
    $pelatihan->refresh();
    expect($pelatihan->status)->toBe('disetujui');
    expect($pelatihan->approved_by)->toBe($partnerPegawai->id);
});

test('partner can reject training with reason', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $partnerPegawai = Pegawai::factory()->create(['jabatan' => 'partner']);
    $partner = User::factory()->create(['pegawai_id' => $partnerPegawai->id]);

    $pelatihan = Pelatihan::create([
        'kegiatan' => 'Pelatihan Audit',
        'skp' => 3,
        'mulai' => Carbon::now()->addDays(1),
        'akhir' => Carbon::now()->addDays(1)->addHours(2),
        'status' => 'menunggu_persetujuan',
        'created_by' => $adminPegawai->id,
    ]);

    $response = $this->actingAs($partner)->post(route('pelatihan.reject', $pelatihan->id), [
        'reject_reason' => 'SKP terlalu tinggi, kurangi menjadi 2.',
    ]);

    $response->assertSessionHasNoErrors();
    $pelatihan->refresh();
    expect($pelatihan->status)->toBe('ditolak');
    expect($pelatihan->reject_reason)->toBe('SKP terlalu tinggi, kurangi menjadi 2.');
});

test('employee can record presence within training time window', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $staffPegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    $staff = User::factory()->create(['pegawai_id' => $staffPegawai->id]);

    $start = Carbon::parse('2026-06-30 09:00:00', 'Asia/Jakarta');
    $end = Carbon::parse('2026-06-30 12:00:00', 'Asia/Jakarta');

    $pelatihan = Pelatihan::create([
        'kegiatan' => 'Pelatihan Dasar Audit',
        'skp' => 2,
        'mulai' => $start,
        'akhir' => $end,
        'status' => 'disetujui',
        'created_by' => $adminPegawai->id,
    ]);

    // Test during training hours
    Carbon::setTestNow(Carbon::parse('2026-06-30 10:00:00', 'Asia/Jakarta'));

    $response = $this->actingAs($staff)->post(route('pelatihan.record-presensi', $pelatihan->presence_token));

    $response->assertSessionHasNoErrors();
    
    $this->assertDatabaseHas('presensi_pelatihan', [
        'pegawai_id' => $staffPegawai->id,
        'pelatihan_id' => $pelatihan->id,
        'status' => 'hadir',
    ]);
});

test('employee cannot record presence outside training time window', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $staffPegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    $staff = User::factory()->create(['pegawai_id' => $staffPegawai->id]);

    $start = Carbon::parse('2026-06-30 09:00:00', 'Asia/Jakarta');
    $end = Carbon::parse('2026-06-30 12:00:00', 'Asia/Jakarta');

    $pelatihan = Pelatihan::create([
        'kegiatan' => 'Pelatihan Dasar Audit',
        'skp' => 2,
        'mulai' => $start,
        'akhir' => $end,
        'status' => 'disetujui',
        'created_by' => $adminPegawai->id,
    ]);

    // Test before starting time
    Carbon::setTestNow(Carbon::parse('2026-06-30 08:30:00', 'Asia/Jakarta'));
    $response = $this->actingAs($staff)->post(route('pelatihan.record-presensi', $pelatihan->presence_token));
    $response->assertSessionHasErrors(['error']);

    // Test after ending time
    Carbon::setTestNow(Carbon::parse('2026-06-30 12:30:00', 'Asia/Jakarta'));
    $response = $this->actingAs($staff)->post(route('pelatihan.record-presensi', $pelatihan->presence_token));
    $response->assertSessionHasErrors(['error']);
});

test('admin can finish training and auto generate alpha status for non-attendee active employees', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    // Create staff 1 and staff 2
    $staff1 = Pegawai::factory()->create(['jabatan' => 'staff', 'status' => 'aktif']);
    $staff2 = Pegawai::factory()->create(['jabatan' => 'staff', 'status' => 'aktif']);

    $pelatihan = Pelatihan::create([
        'kegiatan' => 'Pelatihan Pajak',
        'skp' => 2,
        'mulai' => Carbon::now()->subHours(4),
        'akhir' => Carbon::now()->subHours(1),
        'status' => 'disetujui',
        'created_by' => $adminPegawai->id,
    ]);

    // Staff 1 records presence
    PresensiPelatihan::create([
        'pegawai_id' => $staff1->id,
        'pelatihan_id' => $pelatihan->id,
        'tanggal' => Carbon::now()->toDateString(),
        'checkin_at' => Carbon::now()->subHours(3),
        'status' => 'hadir',
    ]);

    // Admin finishes the training
    $response = $this->actingAs($admin)->post(route('pelatihan.finish', $pelatihan->id));

    $response->assertSessionHasNoErrors();
    $pelatihan->refresh();
    expect($pelatihan->status)->toBe('selesai');

    // Staff 1 remains present
    $this->assertDatabaseHas('presensi_pelatihan', [
        'pegawai_id' => $staff1->id,
        'pelatihan_id' => $pelatihan->id,
        'status' => 'hadir',
    ]);

    // Staff 2 (who did not check in) is marked as alpha
    $this->assertDatabaseHas('presensi_pelatihan', [
        'pegawai_id' => $staff2->id,
        'pelatihan_id' => $pelatihan->id,
        'status' => 'alpha',
    ]);
});

test('employee can render scan page successfully', function () {
    $staffPegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    $staff = User::factory()->create(['pegawai_id' => $staffPegawai->id]);

    $response = $this->actingAs($staff)->get(route('pelatihan.scan'));

    $response->assertStatus(200);
});
