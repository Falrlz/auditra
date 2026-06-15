<?php

use App\Models\User;

test('non-admin user cannot edit users', function () {
    $user = User::factory()->create(['role' => 'staff']);
    $otherUser = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('users.update', $otherUser->id), [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'inisial' => 'UPD',
            'role' => 'manager',
        ]);

    $response->assertStatus(403);
});

test('admin can edit user details', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $userToEdit = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
        'inisial' => 'ORG',
        'role' => 'staff',
    ]);

    $response = $this
        ->actingAs($admin)
        ->post(route('users.update', $userToEdit->id), [
            'name' => 'New Name',
            'email' => 'new@example.com',
            'inisial' => 'NEW',
            'role' => 'manager',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $userToEdit->refresh();
    $this->assertSame('New Name', $userToEdit->name);
    $this->assertSame('new@example.com', $userToEdit->email);
    $this->assertSame('NEW', $userToEdit->inisial);
    $this->assertSame('manager', $userToEdit->role);
});

test('admin can optionally change user password', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $userToEdit = User::factory()->create([
        'password' => Hash::make('oldpassword'),
        'role' => 'staff',
    ]);

    $response = $this
        ->actingAs($admin)
        ->post(route('users.update', $userToEdit->id), [
            'name' => $userToEdit->name,
            'email' => $userToEdit->email,
            'inisial' => $userToEdit->inisial,
            'role' => $userToEdit->role,
            'password' => 'newsecretpassword',
        ]);

    $response->assertSessionHasNoErrors();
    $userToEdit->refresh();

    $this->assertTrue(Hash::check('newsecretpassword', $userToEdit->password));
});
