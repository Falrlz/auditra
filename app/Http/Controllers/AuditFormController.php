<?php

namespace App\Http\Controllers;

use App\Models\AuditForm;
use App\Models\Client;
use App\Models\User;
use App\Models\EngagementTeam;
use App\Services\OdsParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AuditFormController extends Controller
{
    /**
     * Display forms list or render dashboard.
     */
    public function index()
    {
        $user = Auth::user();
        $clientsQuery = Client::query();

        // Admin and Partner can see all clients. Staff & Manager only see their assigned clients.
        if (!$user->isAdmin() && !$user->isPartner()) {
            $clientsQuery->whereHas('users', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            });
        }

        $clients = $clientsQuery->with(['users', 'auditForms.preparer', 'auditForms.reviewer', 'auditForms.approver'])->latest()->get();

        // Format clients for frontend
        $formattedClients = $clients->map(function ($client) use ($user) {
            $pivot = $client->users->where('id', $user->id)->first();
            $teamRole = $pivot ? $pivot->pivot->role : null;

            return [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
                'team' => $client->users->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'role' => $u->pivot->role,
                        'inisial' => $u->inisial,
                        'email' => $u->email,
                    ];
                }),
                'team_role' => $teamRole,
                'forms' => $client->auditForms,
            ];
        });

        // Fetch users list for Admin (user management) and Partner (team assignment)
        $allUsers = [];
        if ($user->isAdmin() || $user->isPartner()) {
            $allUsers = User::select('id', 'name', 'role', 'email', 'inisial')->get();
        }

        return Inertia::render('Dashboard', [
            'clients' => $formattedClients,
            'allUsers' => $allUsers,
            'auth' => [
                'user' => $user
            ]
        ]);
    }

    /**
     * Show form for creating a new A10 audit form.
     */
    public function createA10(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        $user = Auth::user();
        $client = Client::findOrFail($request->client_id);
        
        $teamRole = $user->roleInClient($client->id);
        if ($teamRole !== 'anggota') {
            abort(403, 'Hanya Anggota tim perikatan yang dapat mengisi form.');
        }

        $d10Form = AuditForm::where('client_id', $client->id)
            ->where('form_type', 'D10')
            ->first();
        $materiality = [
            'overall_materiality' => $d10Form?->section_data['overall_materiality'] ?? null,
            'performance_materiality' => $d10Form?->section_data['performance_materiality'] ?? null,
            'tolerable_error' => $d10Form?->section_data['tolerable_error'] ?? null,
        ];

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
                'materiality' => $materiality,
            ],
            'formType' => 'A10',
            'formToEdit' => null,
        ]);
    }

    /**
     * Show form for editing an existing A10 audit form.
     */
    public function editA10(AuditForm $auditForm)
    {
        $user = Auth::user();
        $client = Client::findOrFail($auditForm->client_id);

        $teamRole = $user->roleInClient($auditForm->client_id);
        if ($teamRole !== 'anggota' || $auditForm->preparer_id !== $user->id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->form_type !== 'A10') {
            abort(400, 'Tipe laporan tidak sesuai.');
        }

        if (!in_array($auditForm->status, ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'])) {
            abort(400, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        $d10Form = AuditForm::where('client_id', $client->id)
            ->where('form_type', 'D10')
            ->first();
        $materiality = [
            'overall_materiality' => $d10Form?->section_data['overall_materiality'] ?? null,
            'performance_materiality' => $d10Form?->section_data['performance_materiality'] ?? null,
            'tolerable_error' => $d10Form?->section_data['tolerable_error'] ?? null,
        ];

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
                'materiality' => $materiality,
            ],
            'formType' => 'A10',
            'formToEdit' => $auditForm,
        ]);
    }

    /**
     * Show form for creating a new D10 audit form.
     */
    public function createD10(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        $user = Auth::user();
        $client = Client::findOrFail($request->client_id);
        
        $teamRole = $user->roleInClient($client->id);
        if ($teamRole !== 'anggota') {
            abort(403, 'Hanya Anggota tim perikatan yang dapat mengisi form.');
        }

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
            ],
            'formType' => 'D10',
            'formToEdit' => null,
        ]);
    }

    /**
     * Show form for editing an existing D10 audit form.
     */
    public function editD10(AuditForm $auditForm)
    {
        $user = Auth::user();
        $client = Client::findOrFail($auditForm->client_id);

        $teamRole = $user->roleInClient($auditForm->client_id);
        if ($teamRole !== 'anggota' || $auditForm->preparer_id !== $user->id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->form_type !== 'D10') {
            abort(400, 'Tipe laporan tidak sesuai.');
        }

        if (!in_array($auditForm->status, ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'])) {
            abort(400, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
            ],
            'formType' => 'D10',
            'formToEdit' => $auditForm,
        ]);
    }

    /**
     * Show form for creating a new C10 audit form.
     */
    public function createC10(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        $user = Auth::user();
        $client = Client::findOrFail($request->client_id);
        
        $teamRole = $user->roleInClient($client->id);
        if ($teamRole !== 'anggota') {
            abort(403, 'Hanya Anggota tim perikatan yang dapat mengisi form.');
        }

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
            ],
            'formType' => 'C10',
            'formToEdit' => null,
        ]);
    }

    /**
     * Show form for editing an existing C10 audit form.
     */
    public function editC10(AuditForm $auditForm)
    {
        $user = Auth::user();
        $client = Client::findOrFail($auditForm->client_id);

        $teamRole = $user->roleInClient($auditForm->client_id);
        if ($teamRole !== 'anggota' || $auditForm->preparer_id !== $user->id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->form_type !== 'C10') {
            abort(400, 'Tipe laporan tidak sesuai.');
        }

        if (!in_array($auditForm->status, ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'])) {
            abort(400, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
            ],
            'formType' => 'C10',
            'formToEdit' => $auditForm,
        ]);
    }

    /**
     * Show a single audit form.
     */
    public function show(AuditForm $auditForm)
    {
        $user = Auth::user();

        // Check if user is part of the client team (or admin)
        if (!$user->isAdmin()) {
            $teamRole = $user->roleInClient($auditForm->client_id);
            if (!$teamRole) {
                abort(403, 'Unauthorized.');
            }
        }

        $auditForm->load(['preparer', 'reviewer', 'approver']);

        return response()->json($auditForm);
    }

    /**
     * Store a new audit form.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'form_type' => 'required|string|in:A10,D10,C10',
            'section_data' => 'required|array',
        ]);

        // Validate team role is 'anggota'
        $teamRole = $user->roleInClient($validated['client_id']);
        if ($teamRole !== 'anggota') {
            abort(403, 'Hanya Anggota tim perikatan yang dapat mengisi form.');
        }

        $form = AuditForm::create([
            'client_id' => $validated['client_id'],
            'form_type' => $validated['form_type'],
            'status' => 'draft',
            'section_data' => $validated['section_data'],
            'preparer_id' => $user->id,
        ]);

        return redirect()->route('dashboard')->with('success', 'Draft form berhasil disimpan.');
    }

    /**
     * Update an existing audit form.
     */
    public function update(Request $request, AuditForm $auditForm)
    {
        $user = Auth::user();
        
        $teamRole = $user->roleInClient($auditForm->client_id);
        if ($teamRole !== 'anggota' || $auditForm->preparer_id !== $user->id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if (!in_array($auditForm->status, ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'])) {
            abort(400, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        $validated = $request->validate([
            'section_data' => 'required|array',
        ]);

        $auditForm->update([
            'section_data' => $validated['section_data'],
        ]);

        return redirect()->route('dashboard')->with('success', 'Form berhasil diperbarui.');
    }

    /**
     * Submit form for review.
     */
    public function submit(AuditForm $auditForm)
    {
        $user = Auth::user();

        $teamRole = $user->roleInClient($auditForm->client_id);
        if ($teamRole !== 'anggota' || $auditForm->preparer_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }

        if (!in_array($auditForm->status, ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'])) {
            abort(400, 'Laporan sudah disubmit sebelumnya.');
        }

        // Determine next status based on previous status
        $nextStatus = 'pending_ketua_tim';
        if ($auditForm->status === 'rejected_supervisor') {
            $nextStatus = 'pending_supervisor';
        } elseif ($auditForm->status === 'rejected_partner') {
            $nextStatus = 'pending_partner';
        }

        $auditForm->update([
            'status' => $nextStatus,
            'reject_reason' => null,
        ]);

        return redirect()->route('dashboard')->with('success', 'Laporan berhasil diajukan ke Ketua Tim.');
    }

    /**
     * Review form (Approve or Reject).
     */
    public function review(Request $request, AuditForm $auditForm)
    {
        $user = Auth::user();
        $teamRole = $user->roleInClient($auditForm->client_id);

        if (!in_array($teamRole, ['ketua_tim', 'supervisor', 'partner'])) {
            abort(403, 'Hanya Ketua Tim, Supervisor, atau Partner yang dapat melakukan review.');
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'reject_reason' => 'required_if:action,reject|nullable|string',
        ]);

        if ($validated['action'] === 'reject') {
            // Determine rejection status based on reviewer role
            $rejectStatus = 'rejected';
            if ($teamRole === 'ketua_tim') {
                $rejectStatus = 'rejected_ketua_tim';
            } elseif ($teamRole === 'supervisor') {
                $rejectStatus = 'rejected_supervisor';
            } elseif ($teamRole === 'partner') {
                $rejectStatus = 'rejected_partner';
            }

            $auditForm->update([
                'status' => $rejectStatus,
                'reject_reason' => $validated['reject_reason'],
                'reviewer_id' => $user->id,
            ]);

            $roleLabel = $teamRole === 'ketua_tim' ? 'Ketua Tim' : ($teamRole === 'supervisor' ? 'Supervisor' : 'Partner');
            return redirect()->route('dashboard')->with('success', "Laporan ditolak oleh {$roleLabel} dan dikembalikan ke Anggota.");
        }

        // Approval flow
        if ($teamRole === 'ketua_tim') {
            if ($auditForm->status !== 'pending_ketua_tim') {
                abort(400, 'Status laporan tidak valid untuk disetujui Ketua Tim.');
            }
            $auditForm->update([
                'status' => 'pending_supervisor',
                'reviewer_id' => $user->id,
            ]);
            return redirect()->route('dashboard')->with('success', 'Laporan disetujui Ketua Tim. Menunggu review Supervisor.');
        } elseif ($teamRole === 'supervisor') {
            if ($auditForm->status !== 'pending_supervisor') {
                abort(400, 'Status laporan tidak valid untuk disetujui Supervisor.');
            }
            $auditForm->update([
                'status' => 'pending_partner',
                'reviewer_id' => $user->id,
            ]);
            return redirect()->route('dashboard')->with('success', 'Laporan disetujui Supervisor. Menunggu review Partner.');
        } elseif ($teamRole === 'partner') {
            if ($auditForm->status !== 'pending_partner') {
                abort(400, 'Status laporan tidak valid untuk disetujui Partner.');
            }
            $auditForm->update([
                'status' => 'final_approved',
                'approver_id' => $user->id,
            ]);
            return redirect()->route('dashboard')->with('success', 'Laporan berhasil disetujui Final oleh Partner.');
        }

        abort(403, 'Unauthorized action.');
    }

    /**
     * Admin: Store Client.
     */
    public function storeClient(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'book_year' => 'required|string|max:255',
            'schedule' => 'required|string|max:255',
        ]);

        Client::create([
            'name' => strtoupper($request->name),
            'book_year' => $request->book_year,
            'schedule' => $request->schedule,
        ]);

        return redirect()->route('dashboard')->with('success', 'Perikatan Klien baru berhasil dibuat.');
    }

    /**
     * Admin: Update Client.
     */
    public function updateClient(Request $request, Client $client)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'book_year' => 'required|string|max:255',
            'schedule' => 'required|string|max:255',
        ]);

        $client->update([
            'name' => strtoupper($request->name),
            'book_year' => $request->book_year,
            'schedule' => $request->schedule,
        ]);

        return redirect()->route('dashboard')->with('success', 'Perikatan Klien berhasil diperbarui.');
    }

    /**
     * Admin: Destroy Client.
     */
    public function destroyClient(Client $client)
    {
        $client->delete();
        return redirect()->route('dashboard')->with('success', 'Perikatan Klien berhasil dihapus.');
    }

    /**
     * Partner: Update Team.
     */
    public function updateTeam(Request $request, Client $client)
    {
        $request->validate([
            'team' => 'required|array',
            'team.*.user_id' => 'required|exists:users,id',
            'team.*.role' => 'required|string|in:anggota,ketua_tim,supervisor,partner',
        ]);

        // Detach old team and attach new assignments
        $client->users()->detach();

        foreach ($request->team as $member) {
            $client->users()->attach($member['user_id'], ['role' => $member['role']]);
        }

        return redirect()->route('dashboard')->with('success', 'Tim Perikatan berhasil disave/diperbarui.');
    }

    /**
     * Parse uploaded ODS file.
     */
    public function parseOds(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
        ]);

        $file = $request->file('file');
        $parser = new OdsParser();
        
        try {
            $sheets = $parser->parse($file->getRealPath());
            $sheet0 = isset($sheets['A10']) ? $sheets['A10'] : array_values($sheets)[0];
            
            // Map the ODS data to the structured format
            // We use the same mapper as in the seeder
            $seeder = new \Database\Seeders\DatabaseSeeder();
            $reflector = new \ReflectionClass($seeder);
            $method = $reflector->getMethod('buildStructuredData');
            $method->setAccessible(true);
            $structuredData = $method->invoke($seeder, $sheet0);

            return response()->json([
                'section_data' => $structuredData
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
