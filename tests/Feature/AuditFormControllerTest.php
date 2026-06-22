<?php

use App\Models\User;
use App\Models\Client;
use App\Models\EngagementTeam;
use App\Models\C10D10;

test('non-team members cannot access createC10', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('c10.create', ['client_id' => $client->id]));

    $response->assertStatus(403);
});

test('anggota team member can access createC10', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user->id,
        'peran' => 'anggota',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('c10.create', ['client_id' => $client->id]));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('AuditForm/Edit')
        ->where('formType', 'C10')
        ->where('client.id', $client->id)
    );
});

test('non-anggota team member cannot access createC10', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user->id,
        'peran' => 'ketua_tim',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('c10.create', ['client_id' => $client->id]));

    $response->assertStatus(403);
});

test('anggota can store C10 form as draft', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user->id,
        'peran' => 'anggota',
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('audit-forms.store'), [
            'client_id' => $client->id,
            'form_type' => 'C10',
            'section_data' => [
                'notes' => 'Testing C10 worksheets saving',
                'groups' => []
            ],
        ]);

    $response->assertRedirect(route('dashboard'));
    $response->assertSessionHas('success', 'Draft form berhasil disimpan.');

    $this->assertDatabaseHas('c10_d10', [
        'klien_id' => $client->id,
        'status' => 'draft',
        'pembuat_id' => $user->id,
    ]);
});

test('preparer can access C10 edit', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user->id,
        'peran' => 'anggota',
    ]);

    $form = C10D10::create([
        'klien_id' => $client->id,
        'status' => 'draft',
        'data_bagian' => ['notes' => 'Old content'],
        'pembuat_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('c10.edit', $form->id));

    $response->assertStatus(200);
});

test('non-preparer cannot access C10 edit', function () {
    $user1 = User::factory()->create(['role' => 'staff']);
    $user2 = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user1->id,
        'peran' => 'anggota',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user2->id,
        'peran' => 'anggota',
    ]);

    $form = C10D10::create([
        'klien_id' => $client->id,
        'status' => 'draft',
        'data_bagian' => ['notes' => 'Old content'],
        'pembuat_id' => $user1->id,
    ]);

    $response = $this
        ->actingAs($user2)
        ->get(route('c10.edit', $form->id));

    $response->assertStatus(403);
});

test('preparer can update C10 form draft', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user->id,
        'peran' => 'anggota',
    ]);

    $form = C10D10::create([
        'klien_id' => $client->id,
        'status' => 'draft',
        'data_bagian' => ['notes' => 'Old content'],
        'pembuat_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('audit-forms.update', $form->id), [
            'form_type' => 'C10',
            'section_data' => [
                'notes' => 'Updated worksheets content',
                'groups' => []
            ]
        ]);

    $response->assertRedirect(route('dashboard'));
    $form->refresh();
    $this->assertEquals('Updated worksheets content', $form->data_bagian['notes']);
});

test('D10 creation retrieves existing C10D10 accounts', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client D10',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user->id,
        'peran' => 'anggota',
    ]);

    $form = C10D10::create([
        'klien_id' => $client->id,
        'status' => 'draft',
        'data_bagian' => ['notes' => 'Some notes'],
        'pembuat_id' => $user->id,
        'materialitas_keseluruhan' => 1000000,
    ]);

    $account = \App\Models\C10D10Account::create([
        'c10_d10_id' => $form->id,
        'kode_induk' => '1000',
        'nama_induk' => 'Aset',
        'saldo_normal' => 'debit',
        'sufiks' => '01',
        'kode_lengkap' => '1001',
        'nama' => 'Kas Besar',
        'saldo_unaudited' => 500000,
        'saldo_audited' => 500000,
        'saldo_audited_sebelumnya' => 500000,
        'persen_materialitas' => 60,
        'status_materialitas' => 'Tidak',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('d10.create', ['client_id' => $client->id]));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('AuditForm/Edit')
        ->where('formType', 'D10')
        ->where('client.id', $client->id)
        ->where('formToEdit.section_data.accounts.0.id', $account->id)
        ->where('formToEdit.section_data.accounts.0.nama', '1001 - Kas Besar')
        ->where('formToEdit.section_data.accounts.0.inhouse', 500000)
        ->where('formToEdit.section_data.accounts.0.persen', 60)
        ->where('formToEdit.section_data.accounts.0.status', 'Tidak')
    );
});

test('D10 store syncs accounts to database', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'nama' => 'PT Test Client D10 Sync',
        'tahun_buku' => '2024',
        'jadwal' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'klien_id' => $client->id,
        'user_id' => $user->id,
        'peran' => 'anggota',
    ]);

    $form = C10D10::create([
        'klien_id' => $client->id,
        'status' => 'draft',
        'data_bagian' => ['notes' => 'Notes'],
        'pembuat_id' => $user->id,
        'materialitas_keseluruhan' => 1000000,
    ]);

    $account = \App\Models\C10D10Account::create([
        'c10_d10_id' => $form->id,
        'kode_induk' => '1000',
        'nama_induk' => 'Aset',
        'saldo_normal' => 'debit',
        'sufiks' => '01',
        'kode_lengkap' => '1001',
        'nama' => 'Kas Besar',
        'saldo_unaudited' => 500000,
        'saldo_audited' => 500000,
        'saldo_audited_sebelumnya' => 500000,
        'persen_materialitas' => 50,
        'status_materialitas' => 'Tidak',
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('audit-forms.store'), [
            'client_id' => $client->id,
            'form_type' => 'D10',
            'section_data' => [
                'overall_materiality' => 1000000,
                'performance_materiality' => 800000,
                'tolerable_error' => 50000,
                'accounts' => [
                    [
                        'id' => $account->id,
                        'nama' => '1001 - Kas Besar',
                        'inhouse' => 500000,
                        'persen' => 70,
                        'status' => 'Material',
                    ],
                    [
                        'nama' => '2001 - Utang Usaha',
                        'inhouse' => 200000,
                        'persen' => 40,
                        'status' => 'Tidak',
                    ],
                ]
            ],
        ]);

    $response->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('c10_d10', [
        'klien_id' => $client->id,
        'materialitas_keseluruhan' => 1000000,
        'materialitas_kinerja' => 800000,
        'kesalahan_ditoleransi' => 50000,
    ]);

    $this->assertDatabaseHas('c10_d10_accounts', [
        'id' => $account->id,
        'kode_lengkap' => '1001',
        'nama' => 'Kas Besar',
        'persen_materialitas' => 70,
        'status_materialitas' => 'Material',
    ]);

    $this->assertDatabaseHas('c10_d10_accounts', [
        'c10_d10_id' => $form->id,
        'kode_lengkap' => '2001',
        'nama' => 'Utang Usaha',
        'persen_materialitas' => 40,
        'status_materialitas' => 'Tidak',
        'kode_induk' => '2000',
    ]);
});

