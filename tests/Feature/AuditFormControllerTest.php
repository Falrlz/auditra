<?php

use App\Models\User;
use App\Models\Client;
use App\Models\TimPerikatan;
use App\Models\C10D10;
use App\Models\C10D10Account;

test('non-team members cannot access createC10', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'name' => 'PT Test Client',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('c10.create', ['client_id' => $client->id]));

    $response->assertStatus(403);
});

test('anggota team member can access createC10', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'name' => 'PT Test Client',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user->pegawai_id,
        'role' => 'anggota',
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
        'name' => 'PT Test Client',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user->pegawai_id,
        'role' => 'ketua_tim',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('c10.create', ['client_id' => $client->id]));

    $response->assertStatus(403);
});

test('anggota can store C10 form as draft', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'name' => 'PT Test Client',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    $tim = TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user->pegawai_id,
        'role' => 'anggota',
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
        'tim_perikatan_id' => $tim->id,
        'status' => 'draft',
    ]);
});

test('preparer can access C10 edit', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'name' => 'PT Test Client',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    $tim = TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user->pegawai_id,
        'role' => 'anggota',
    ]);

    $form = C10D10::create([
        'tim_perikatan_id' => $tim->id,
        'status' => 'draft',
        'section_data' => ['notes' => 'Old content'],
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
        'name' => 'PT Test Client',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    $tim1 = TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user1->pegawai_id,
        'role' => 'anggota',
    ]);

    $tim2 = TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user2->pegawai_id,
        'role' => 'anggota',
    ]);

    $form = C10D10::create([
        'tim_perikatan_id' => $tim1->id,
        'status' => 'draft',
        'section_data' => ['notes' => 'Old content'],
    ]);

    $response = $this
        ->actingAs($user2)
        ->get(route('c10.edit', $form->id));

    $response->assertStatus(403);
});

test('preparer can update C10 form draft', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'name' => 'PT Test Client',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    $tim = TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user->pegawai_id,
        'role' => 'anggota',
    ]);

    $form = C10D10::create([
        'tim_perikatan_id' => $tim->id,
        'status' => 'draft',
        'section_data' => ['notes' => 'Old content'],
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
    $this->assertEquals('Updated worksheets content', $form->section_data['notes']);
});

test('D10 creation retrieves existing C10D10 accounts', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'name' => 'PT Test Client D10',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    $tim = TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user->pegawai_id,
        'role' => 'anggota',
    ]);

    $form = C10D10::create([
        'tim_perikatan_id' => $tim->id,
        'status' => 'draft',
        'section_data' => ['notes' => 'Some notes'],
        'overall_materiality' => 1000000,
    ]);

    $account = C10D10Account::create([
        'c10_d10_id' => $form->id,
        'kode_induk' => '1000',
        'nama_induk' => 'Aset',
        'saldo_normal' => 'debit',
        'suffix' => '01',
        'kode_lengkap' => '1001',
        'nama' => 'Kas Besar',
        'saldo_unaudited' => 500000,
        'saldo_audited' => 500000,
        'saldo_audited_prev' => 500000,
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
        'name' => 'PT Test Client D10 Sync',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    $tim = TimPerikatan::create([
        'client_id' => $client->id,
        'pegawai_id' => $user->pegawai_id,
        'role' => 'anggota',
    ]);

    $form = C10D10::create([
        'tim_perikatan_id' => $tim->id,
        'status' => 'draft',
        'section_data' => ['notes' => 'Notes'],
        'overall_materiality' => 1000000,
    ]);

    $account = C10D10Account::create([
        'c10_d10_id' => $form->id,
        'kode_induk' => '1000',
        'nama_induk' => 'Aset',
        'saldo_normal' => 'debit',
        'suffix' => '01',
        'kode_lengkap' => '1001',
        'nama' => 'Kas Besar',
        'saldo_unaudited' => 500000,
        'saldo_audited' => 500000,
        'saldo_audited_prev' => 500000,
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
        'tim_perikatan_id' => $tim->id,
        'overall_materiality' => 1000000,
        'performance_materiality' => 800000,
        'tolerable_error' => 50000,
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
