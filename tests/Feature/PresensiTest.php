<?php

use App\Models\User;
use App\Models\Pegawai;
use App\Models\Presensi;
use App\Models\PengajuanIzin;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('employee can check in successfully', function () {
    $pegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    $user = User::factory()->create(['pegawai_id' => $pegawai->id]);

    Carbon::setTestNow(Carbon::parse('2026-06-26 08:00:00', 'Asia/Jakarta'));

    $response = $this->actingAs($user)->post(route('presensi.checkin'));

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('presensi', [
        'pegawai_id' => $pegawai->id,
        'tanggal' => '2026-06-26',
        'status' => 'hadir',
    ]);
});

test('employee checkin records late status correctly after 08:35', function () {
    $pegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    $user = User::factory()->create(['pegawai_id' => $pegawai->id]);

    Carbon::setTestNow(Carbon::parse('2026-06-26 08:40:00', 'Asia/Jakarta'));

    $response = $this->actingAs($user)->post(route('presensi.checkin'));

    $response->assertSessionHasNoErrors();

    $presensi = Presensi::where('pegawai_id', $pegawai->id)->first();
    expect(Carbon::parse($presensi->checkin_at)->format('H:i'))->toBe('08:40');
    expect($presensi->status)->toBe('hadir');
});

test('employee can check out successfully after check in', function () {
    $pegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    $user = User::factory()->create(['pegawai_id' => $pegawai->id]);

    Carbon::setTestNow(Carbon::parse('2026-06-26 08:00:00', 'Asia/Jakarta'));
    $this->actingAs($user)->post(route('presensi.checkin'));

    Carbon::setTestNow(Carbon::parse('2026-06-26 17:00:00', 'Asia/Jakarta'));
    $response = $this->actingAs($user)->post(route('presensi.checkout'));

    $response->assertSessionHasNoErrors();
    
    $presensi = Presensi::where('pegawai_id', $pegawai->id)->first();
    expect($presensi->checkout_at)->not->toBeNull();
    expect(Carbon::parse($presensi->checkout_at)->format('H:i'))->toBe('17:00');
});

test('employee can submit permit request (izin/sakit)', function () {
    Storage::fake('public');
    
    $pegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    $user = User::factory()->create(['pegawai_id' => $pegawai->id]);

    $file = UploadedFile::fake()->create('surat_dokter.pdf', 500);

    $response = $this->actingAs($user)->post(route('presensi.izin-sakit'), [
        'tanggal_mulai' => '2026-06-29',
        'tanggal_selesai' => '2026-07-01',
        'tipe' => 'sakit',
        'keterangan' => 'Sakit Demam Berdarah',
        'dokumen' => $file,
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('pengajuan_izin', [
        'pegawai_id' => $pegawai->id,
        'tanggal_mulai' => '2026-06-29',
        'tanggal_selesai' => '2026-07-01',
        'tipe' => 'sakit',
        'keterangan' => 'Sakit Demam Berdarah',
        'status_approval' => 'pending',
    ]);
});

test('partner can approve permit request and generate attendance records', function () {
    $staffPegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    $staff = User::factory()->create(['pegawai_id' => $staffPegawai->id]);
    
    $partnerPegawai = Pegawai::factory()->create(['jabatan' => 'partner']);
    $partner = User::factory()->create(['pegawai_id' => $partnerPegawai->id]);

    $pengajuan = PengajuanIzin::create([
        'pegawai_id' => $staffPegawai->id,
        'tanggal_mulai' => '2026-06-29',
        'tanggal_selesai' => '2026-06-30',
        'tipe' => 'izin',
        'keterangan' => 'Ada acara keluarga',
        'dokumen' => 'izin_sakit_docs/dummy.pdf',
        'status_approval' => 'pending',
    ]);

    $response = $this->actingAs($partner)->post(route('presensi.izin-sakit.approve', $pengajuan->id));

    $response->assertSessionHasNoErrors();
    
    $pengajuan->refresh();
    expect($pengajuan->status_approval)->toBe('approved');
    expect($pengajuan->approved_by)->toBe($partnerPegawai->id);

    // Verify daily presensi records were generated
    $this->assertDatabaseHas('presensi', [
        'pegawai_id' => $staffPegawai->id,
        'tanggal' => '2026-06-29',
        'status' => 'izin',
        'pengajuan_izin_id' => $pengajuan->id,
    ]);
    $this->assertDatabaseHas('presensi', [
        'pegawai_id' => $staffPegawai->id,
        'tanggal' => '2026-06-30',
        'status' => 'izin',
        'pengajuan_izin_id' => $pengajuan->id,
    ]);
});

test('admin can assign out-of-office (dinas luar) status', function () {
    $staffPegawai = Pegawai::factory()->create(['jabatan' => 'staff']);
    
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $response = $this->actingAs($admin)->post(route('presensi.assign-dinas-luar'), [
        'pegawai_id' => $staffPegawai->id,
        'tanggal' => '2026-06-26',
    ]);

    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('presensi', [
        'pegawai_id' => $staffPegawai->id,
        'tanggal' => '2026-06-26',
        'status' => 'dinas_luar',
        'checkin_at' => null,
    ]);
});
