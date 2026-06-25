<?php

use App\Models\User;
use App\Models\Client;
use App\Models\TimPerikatan;
use App\Models\A10;

test('workflow: specific rejection and direct resubmission routing bypass', function () {
    // 1. Setup Client
    $client = Client::create([
        'name' => 'PT Workflow Client',
        'book_year' => '2026',
        'schedule' => 'Workflow Schedule',
    ]);

    // 2. Setup Users
    $anggota = User::factory()->create(['role' => 'staff']);
    $ketuaTim = User::factory()->create(['role' => 'staff']);
    $supervisor = User::factory()->create(['role' => 'manager']);
    $partner = User::factory()->create(['role' => 'partner']);

    // 3. Assign Roles in Client Engagement Team
    $timAnggota = TimPerikatan::create(['client_id' => $client->id, 'pegawai_id' => $anggota->pegawai_id, 'role' => 'anggota']);
    $timKetuaTim = TimPerikatan::create(['client_id' => $client->id, 'pegawai_id' => $ketuaTim->pegawai_id, 'role' => 'ketua_tim']);
    $timSupervisor = TimPerikatan::create(['client_id' => $client->id, 'pegawai_id' => $supervisor->pegawai_id, 'role' => 'supervisor']);
    $timPartner = TimPerikatan::create(['client_id' => $client->id, 'pegawai_id' => $partner->pegawai_id, 'role' => 'partner']);

    // 4. Anggota creates form A10 as draft
    $form = A10::create([
        'tim_perikatan_id' => $timAnggota->id,
        'status' => 'draft',
        'form_a10' => ['notes' => 'Initial Draft Content'],
    ]);

    // 5. Anggota submits form -> should go to pending_ketua_tim
    $this->actingAs($anggota)
        ->post(route('audit-forms.submit', $form->id))
        ->assertRedirect(route('dashboard'));
    
    $form->refresh();
    $this->assertEquals('pending_ketua_tim', $form->status);

    // 6. Ketua Tim rejects form -> should set to rejected_ketua_tim
    $this->actingAs($ketuaTim)
        ->post(route('audit-forms.review', $form->id), [
            'action' => 'reject',
            'reject_reason' => 'Need detail clarification by Ketua Tim',
        ])
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('rejected_ketua_tim', $form->status);
    $this->assertEquals('Need detail clarification by Ketua Tim', $form->reject_reason);

    // 7. Anggota can edit when status is rejected_ketua_tim
    $this->actingAs($anggota)
        ->get(route('a10.edit', $form->id))
        ->assertStatus(200);

    // 8. Anggota resubmits -> should go back to pending_ketua_tim
    $this->actingAs($anggota)
        ->post(route('audit-forms.submit', $form->id))
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('pending_ketua_tim', $form->status);

    // 9. Ketua Tim approves form -> should go to pending_supervisor
    $this->actingAs($ketuaTim)
        ->post(route('audit-forms.review', $form->id), [
            'action' => 'approve',
        ])
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('pending_supervisor', $form->status);

    // 10. Supervisor rejects form -> should set to rejected_supervisor
    $this->actingAs($supervisor)
        ->post(route('audit-forms.review', $form->id), [
            'action' => 'reject',
            'reject_reason' => 'Fix materiality calculations',
        ])
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('rejected_supervisor', $form->status);

    // 11. Anggota can edit when status is rejected_supervisor
    $this->actingAs($anggota)
        ->get(route('a10.edit', $form->id))
        ->assertStatus(200);

    // 12. Anggota resubmits -> should go directly back to pending_supervisor (bypassing ketua_tim!)
    $this->actingAs($anggota)
        ->post(route('audit-forms.submit', $form->id))
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('pending_supervisor', $form->status);

    // 13. Supervisor approves form -> should go to pending_partner
    $this->actingAs($supervisor)
        ->post(route('audit-forms.review', $form->id), [
            'action' => 'approve',
        ])
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('pending_partner', $form->status);

    // 14. Partner rejects form -> should set to rejected_partner
    $this->actingAs($partner)
        ->post(route('audit-forms.review', $form->id), [
            'action' => 'reject',
            'reject_reason' => 'Sign-off formatting issues',
        ])
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('rejected_partner', $form->status);

    // 15. Anggota can edit when status is rejected_partner
    $this->actingAs($anggota)
        ->get(route('a10.edit', $form->id))
        ->assertStatus(200);

    // 16. Anggota resubmits -> should go directly back to pending_partner (bypassing ketua_tim & supervisor!)
    $this->actingAs($anggota)
        ->post(route('audit-forms.submit', $form->id))
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('pending_partner', $form->status);

    // 17. Partner approves form -> should go to final_approved
    $this->actingAs($partner)
        ->post(route('audit-forms.review', $form->id), [
            'action' => 'approve',
        ])
        ->assertRedirect(route('dashboard'));

    $form->refresh();
    $this->assertEquals('final_approved', $form->status);
});
