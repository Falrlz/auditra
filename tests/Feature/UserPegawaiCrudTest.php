<?php

use App\Models\User;
use App\Models\Pegawai;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('admin can create pegawai', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin', 'inisial' => 'ADM']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $response = $this->actingAs($admin)->post('/pegawai', [
        'name' => 'Budi Staff',
        'inisial' => 'BUD',
        'jabatan' => 'staff',
        'status' => 'aktif',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('pegawai', [
        'name' => 'Budi Staff',
        'inisial' => 'BUD',
        'jabatan' => 'staff',
        'status' => 'pending',
    ]);
});

test('admin can create user linked to existing pegawai', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin', 'inisial' => 'ADM']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $pegawai = Pegawai::factory()->create(['jabatan' => 'staff', 'inisial' => 'AND']);

    $response = $this->actingAs($admin)->post('/users', [
        'email' => 'andi@example.com',
        'password' => 'password123',
        'pegawai_id' => $pegawai->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'email' => 'andi@example.com',
        'pegawai_id' => $pegawai->id,
        'is_active' => true,
    ]);
});

test('admin can deactivate and activate user login status', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin', 'inisial' => 'ADM']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $pegawai = Pegawai::factory()->create(['jabatan' => 'staff', 'inisial' => 'AND']);
    $user = User::factory()->create(['pegawai_id' => $pegawai->id, 'email' => 'andi@example.com', 'is_active' => true]);

    // Deactivate
    $response = $this->actingAs($admin)->post("/users/{$user->id}/toggle-status");
    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'is_active' => false,
    ]);

    // Activate again
    $response = $this->actingAs($admin)->post("/users/{$user->id}/toggle-status");
    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'is_active' => true,
    ]);
});

test('inactive user is blocked from logging in', function () {
    $pegawai = Pegawai::factory()->create(['jabatan' => 'staff', 'inisial' => 'AND']);
    $user = User::factory()->create([
        'pegawai_id' => $pegawai->id,
        'email' => 'andi@example.com',
        'password' => Hash::make('password123'),
        'is_active' => false,
    ]);

    $response = $this->post('/login', [
        'email' => 'andi@example.com',
        'password' => 'password123',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('soft deleting user account does not delete pegawai', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin', 'inisial' => 'ADM']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $pegawai = Pegawai::factory()->create(['jabatan' => 'staff', 'inisial' => 'AND']);
    $user = User::factory()->create(['pegawai_id' => $pegawai->id]);

    $response = $this->actingAs($admin)->delete("/users/{$user->id}");
    $response->assertRedirect();

    // User is soft deleted
    $this->assertSoftDeleted('users', ['id' => $user->id]);

    // Pegawai is NOT deleted
    $this->assertDatabaseHas('pegawai', [
        'id' => $pegawai->id,
        'deleted_at' => null,
    ]);
});

test('admin can create user inline with new pegawai', function () {
    $adminPegawai = Pegawai::factory()->create(['jabatan' => 'admin', 'inisial' => 'ADM']);
    $admin = User::factory()->create(['pegawai_id' => $adminPegawai->id]);

    $response = $this->actingAs($admin)->post('/users', [
        'name' => 'Candra Staff',
        'email' => 'candra@example.com',
        'password' => 'password123',
        'role' => 'staff',
        'inisial' => 'CAN',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('pegawai', [
        'name' => 'Candra Staff',
        'inisial' => 'CAN',
        'jabatan' => 'staff',
        'status' => 'pending',
    ]);

    $pegawai = Pegawai::where('inisial', 'CAN')->first();

    $this->assertDatabaseHas('users', [
        'email' => 'candra@example.com',
        'pegawai_id' => $pegawai->id,
        'is_active' => false,
    ]);
});

test('partner can approve pending pegawai', function () {
    $partnerPegawai = Pegawai::factory()->create(['jabatan' => 'partner', 'inisial' => 'PRT']);
    $partner = User::factory()->create(['pegawai_id' => $partnerPegawai->id]);

    $pegawai = Pegawai::factory()->create(['name' => 'Pending Pegawai', 'status' => 'pending']);
    $user = User::factory()->create(['pegawai_id' => $pegawai->id, 'is_active' => false]);

    $response = $this->actingAs($partner)->post("/pegawai/{$pegawai->id}/approve");

    $response->assertRedirect();
    $this->assertDatabaseHas('pegawai', [
        'id' => $pegawai->id,
        'status' => 'aktif',
    ]);
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'is_active' => true,
    ]);
});

test('partner can reject pending pegawai', function () {
    $partnerPegawai = Pegawai::factory()->create(['jabatan' => 'partner', 'inisial' => 'PRT']);
    $partner = User::factory()->create(['pegawai_id' => $partnerPegawai->id]);

    $pegawai = Pegawai::factory()->create(['name' => 'Pending Pegawai', 'status' => 'pending']);
    $user = User::factory()->create(['pegawai_id' => $pegawai->id, 'is_active' => false]);

    $response = $this->actingAs($partner)->post("/pegawai/{$pegawai->id}/reject");

    $response->assertRedirect();
    $this->assertDatabaseMissing('pegawai', [
        'id' => $pegawai->id,
    ]);
    $this->assertDatabaseMissing('users', [
        'id' => $user->id,
    ]);
});

test('non partner cannot approve or reject pending pegawai', function () {
    $staffPegawai = Pegawai::factory()->create(['jabatan' => 'staff', 'inisial' => 'STF']);
    $staff = User::factory()->create(['pegawai_id' => $staffPegawai->id]);

    $pegawai = Pegawai::factory()->create(['name' => 'Pending Pegawai', 'status' => 'pending']);

    $responseApprove = $this->actingAs($staff)->post("/pegawai/{$pegawai->id}/approve");
    $responseApprove->assertStatus(403);

    $responseReject = $this->actingAs($staff)->post("/pegawai/{$pegawai->id}/reject");
    $responseReject->assertStatus(403);
});

