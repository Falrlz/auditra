<?php

use App\Models\User;
use App\Models\Client;
use App\Models\EngagementTeam;
use App\Models\AuditForm;

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

    EngagementTeam::create([
        'client_id' => $client->id,
        'user_id' => $user->id,
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

    EngagementTeam::create([
        'client_id' => $client->id,
        'user_id' => $user->id,
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

    EngagementTeam::create([
        'client_id' => $client->id,
        'user_id' => $user->id,
        'role' => 'anggota',
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('audit-forms.store'), [
            'client_id' => $client->id,
            'form_type' => 'C10',
            'section_data' => [
                'notes' => 'Testing C10 worksheets saving',
                'items' => []
            ],
        ]);

    $response->assertRedirect(route('dashboard'));
    $response->assertSessionHas('success', 'Draft form berhasil disimpan.');

    $this->assertDatabaseHas('audit_forms', [
        'client_id' => $client->id,
        'form_type' => 'C10',
        'status' => 'draft',
        'preparer_id' => $user->id,
    ]);
});

test('preparer can access C10 edit', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $client = Client::create([
        'name' => 'PT Test Client',
        'book_year' => '2024',
        'schedule' => 'Test Schedule',
    ]);

    EngagementTeam::create([
        'client_id' => $client->id,
        'user_id' => $user->id,
        'role' => 'anggota',
    ]);

    $form = AuditForm::create([
        'client_id' => $client->id,
        'form_type' => 'C10',
        'status' => 'draft',
        'section_data' => ['notes' => 'Old content'],
        'preparer_id' => $user->id,
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

    EngagementTeam::create([
        'client_id' => $client->id,
        'user_id' => $user1->id,
        'role' => 'anggota',
    ]);

    EngagementTeam::create([
        'client_id' => $client->id,
        'user_id' => $user2->id,
        'role' => 'anggota',
    ]);

    $form = AuditForm::create([
        'client_id' => $client->id,
        'form_type' => 'C10',
        'status' => 'draft',
        'section_data' => ['notes' => 'Old content'],
        'preparer_id' => $user1->id,
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

    EngagementTeam::create([
        'client_id' => $client->id,
        'user_id' => $user->id,
        'role' => 'anggota',
    ]);

    $form = AuditForm::create([
        'client_id' => $client->id,
        'form_type' => 'C10',
        'status' => 'draft',
        'section_data' => ['notes' => 'Old content'],
        'preparer_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('audit-forms.update', $form->id), [
            'section_data' => [
                'notes' => 'Updated worksheets content',
                'items' => [
                    ['id' => 1, 'name' => 'Worksheet Item A']
                ]
            ]
        ]);

    $response->assertRedirect(route('dashboard'));
    $form->refresh();
    $this->assertEquals('Updated worksheets content', $form->section_data['notes']);
});
