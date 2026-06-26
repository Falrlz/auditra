<?php

namespace App\Http\Controllers;

use App\Models\A10;
use App\Models\C10D10;
use App\Models\C10D10Account;
use App\Models\Client;
use App\Models\User;
use App\Models\TimPerikatan;
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
                $query->where('users.pegawai_id', $user->pegawai_id);
            });
        }

        $clients = $clientsQuery->with([
            'users.pegawai',
            'a10.timPerikatan.pegawai',
            'c10D10.timPerikatan.pegawai',
            'c10D10.accounts'
        ])->latest()->get();

        // Format clients for frontend
        $formattedClients = $clients->map(function ($client) use ($user) {
            $pivot = $client->users->where('id', $user->id)->first();
            $teamRole = $pivot ? $pivot->pivot->role : null;

            $forms = [];

            // A10 Form
            if ($client->a10) {
                $forms[] = [
                    'id' => $client->a10->id,
                    'client_id' => $client->id,
                    'form_type' => 'A10',
                    'status' => $client->a10->status,
                    'reject_reason' => $client->a10->reject_reason,
                    'section_data' => $client->a10->form_a10,
                    'preparer_id' => $client->a10->timPerikatan?->pegawai_id,
                    'preparer' => $client->a10->timPerikatan?->pegawai,
                    'reviewer_id' => null,
                    'reviewer' => null,
                    'approver_id' => null,
                    'approver' => null,
                    'created_at' => $client->a10->created_at,
                    'updated_at' => $client->a10->updated_at,
                ];
            }

            // D10 & C10 Forms from c10D10
            if ($client->c10D10) {
                // C10 Form
                $groups = [];
                foreach ($client->c10D10->accounts as $account) {
                    $groupId = $account->kode_induk;
                    if (!isset($groups[$groupId])) {
                        $groups[$groupId] = [
                            'id' => 'group-' . $groupId,
                            'kode_induk' => $account->kode_induk,
                            'nama_induk' => $account->nama_induk,
                            'saldo_normal' => $account->saldo_normal,
                            'children' => [],
                        ];
                    }
                    $groups[$groupId]['children'][] = [
                        'id' => $account->id,
                        'suffix' => $account->suffix,
                        'kode_lengkap' => $account->kode_lengkap,
                        'nama' => $account->nama,
                        'saldo_unaudited' => (float)$account->saldo_unaudited,
                        'tcm_unaudited' => $account->tcm_unaudited,
                        'penyesuaian_debit' => (float)$account->penyesuaian_debit,
                        'penyesuaian_kredit' => (float)$account->penyesuaian_kredit,
                        'reff' => $account->reff,
                        'saldo_audited' => (float)$account->saldo_audited,
                        'tcm_audited' => $account->tcm_audited,
                        'saldo_audited_prev' => (float)$account->saldo_audited_prev,
                        'saldo_audited_prev2' => $account->saldo_audited_prev2 !== null ? (float)$account->saldo_audited_prev2 : null,
                        'persen_materialitas' => (float)$account->persen_materialitas,
                        'status_materialitas' => $account->status_materialitas,
                    ];
                }

                $forms[] = [
                    'id' => $client->c10D10->id,
                    'client_id' => $client->id,
                    'form_type' => 'C10',
                    'status' => $client->c10D10->status,
                    'reject_reason' => $client->c10D10->reject_reason,
                    'section_data' => [
                        'notes' => $client->c10D10->section_data['notes'] ?? '',
                        'groups' => array_values($groups),
                    ],
                    'preparer_id' => $client->c10D10->timPerikatan?->pegawai_id,
                    'preparer' => $client->c10D10->timPerikatan?->pegawai,
                    'reviewer_id' => null,
                    'reviewer' => null,
                    'approver_id' => null,
                    'approver' => null,
                    'created_at' => $client->c10D10->created_at,
                    'updated_at' => $client->c10D10->updated_at,
                ];

                // D10 Form
                $forms[] = [
                    'id' => $client->c10D10->id,
                    'client_id' => $client->id,
                    'form_type' => 'D10',
                    'status' => $client->c10D10->status,
                    'reject_reason' => $client->c10D10->reject_reason,
                    'section_data' => $this->getD10SectionData($client->c10D10),
                    'preparer_id' => $client->c10D10->timPerikatan?->pegawai_id,
                    'preparer' => $client->c10D10->timPerikatan?->pegawai,
                    'reviewer_id' => null,
                    'reviewer' => null,
                    'approver_id' => null,
                    'approver' => null,
                    'created_at' => $client->c10D10->created_at,
                    'updated_at' => $client->c10D10->updated_at,
                ];
            }

            return [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
                'team' => $client->users->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->pegawai?->name,
                        'role' => $u->pivot->role,
                        'inisial' => $u->pegawai?->inisial,
                        'email' => $u->email,
                    ];
                }),
                'team_role' => $teamRole,
                'forms' => $forms,
            ];
        });

        // Fetch users list for Admin (user management) and Partner (team assignment)
        $allUsers = [];
        $allPegawai = [];
        if ($user->isAdmin() || $user->isPartner()) {
            $allUsers = User::with('pegawai')->get()->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->pegawai?->name,
                    'role' => $u->pegawai?->jabatan,
                    'email' => $u->email,
                    'inisial' => $u->pegawai?->inisial,
                    'is_active' => (bool)$u->is_active,
                ];
            });

            $allPegawai = \App\Models\Pegawai::with('user')->get()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'jabatan' => $p->jabatan,
                    'inisial' => $p->inisial,
                    'telp' => $p->telp,
                    'alamat' => $p->alamat,
                    'cv' => $p->cv,
                    'status' => $p->status,
                    'has_user' => $p->user !== null,
                    'user_email' => $p->user?->email,
                    'user_id' => $p->user?->id,
                ];
            });
        }

        return Inertia::render('Dashboard', [
            'clients' => $formattedClients,
            'allUsers' => $allUsers,
            'allPegawai' => $allPegawai,
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

        $d10Form = $client->c10D10;
        $materiality = [
            'overall_materiality' => $d10Form?->overall_materiality ?? null,
            'performance_materiality' => $d10Form?->performance_materiality ?? null,
            'tolerable_error' => $d10Form?->tolerable_error ?? null,
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
    public function editA10(A10 $auditForm)
    {
        $user = Auth::user();
        $client = $auditForm->timPerikatan?->client;
        if (!$client) {
            abort(404, 'Client tidak ditemukan.');
        }

        $teamRole = $user->roleInClient($client->id);
        if ($teamRole !== 'anggota' || $auditForm->timPerikatan->pegawai_id !== $user->pegawai_id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->status === 'final_approved') {
            abort(400, 'Laporan yang sudah disetujui tidak dapat diubah.');
        }

        $d10Form = $client->c10D10;
        $materiality = [
            'overall_materiality' => $d10Form?->overall_materiality ?? null,
            'performance_materiality' => $d10Form?->performance_materiality ?? null,
            'tolerable_error' => $d10Form?->tolerable_error ?? null,
        ];

        $formattedForm = [
            'id' => $auditForm->id,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'book_year' => $client->book_year,
            'form_type' => 'A10',
            'status' => $auditForm->status,
            'reject_reason' => $auditForm->reject_reason,
            'section_data' => $auditForm->form_a10,
            'preparer_id' => $auditForm->timPerikatan->pegawai_id,
            'reviewer_id' => null,
            'approver_id' => null,
            'created_at' => $auditForm->created_at,
            'updated_at' => $auditForm->updated_at,
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
            'formToEdit' => $formattedForm,
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

        $c10D10 = $client->c10D10;
        $formToEdit = null;

        if ($c10D10) {
            $formToEdit = [
                'id' => $c10D10->id,
                'client_id' => $client->id,
                'client_name' => $client->name,
                'book_year' => $client->book_year,
                'form_type' => 'D10',
                'status' => $c10D10->status,
                'reject_reason' => $c10D10->reject_reason,
                'section_data' => $this->getD10SectionData($c10D10),
                'preparer_id' => $c10D10->timPerikatan?->pegawai_id,
                'preparer' => $c10D10->timPerikatan?->pegawai,
                'reviewer_id' => null,
                'reviewer' => null,
                'approver_id' => null,
                'approver' => null,
                'created_at' => $c10D10->created_at,
                'updated_at' => $c10D10->updated_at,
            ];
        }

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
            ],
            'formType' => 'D10',
            'formToEdit' => $formToEdit,
        ]);
    }

    /**
     * Show form for editing an existing D10 audit form.
     */
    public function editD10(C10D10 $auditForm)
    {
        $user = Auth::user();
        $client = $auditForm->timPerikatan?->client;
        if (!$client) {
            abort(404, 'Client tidak ditemukan.');
        }

        $teamRole = $user->roleInClient($client->id);
        if ($teamRole !== 'anggota' || $auditForm->timPerikatan->pegawai_id !== $user->pegawai_id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->status === 'final_approved') {
            abort(400, 'Laporan yang sudah disetujui tidak dapat diubah.');
        }

        $auditForm->load('accounts');

        $formattedForm = [
            'id' => $auditForm->id,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'book_year' => $client->book_year,
            'form_type' => 'D10',
            'status' => $auditForm->status,
            'reject_reason' => $auditForm->reject_reason,
            'section_data' => $this->getD10SectionData($auditForm),
            'preparer_id' => $auditForm->timPerikatan->pegawai_id,
            'reviewer_id' => null,
            'approver_id' => null,
            'created_at' => $auditForm->created_at,
            'updated_at' => $auditForm->updated_at,
        ];

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
            ],
            'formType' => 'D10',
            'formToEdit' => $formattedForm,
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
    public function editC10(C10D10 $auditForm)
    {
        $user = Auth::user();
        $client = $auditForm->timPerikatan?->client;
        if (!$client) {
            abort(404, 'Client tidak ditemukan.');
        }

        $teamRole = $user->roleInClient($client->id);
        if ($teamRole !== 'anggota' || $auditForm->timPerikatan->pegawai_id !== $user->pegawai_id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->status === 'final_approved') {
            abort(400, 'Laporan yang sudah disetujui tidak dapat diubah.');
        }

        $auditForm->load('accounts');

        $groups = [];
        foreach ($auditForm->accounts as $account) {
            $groupId = $account->kode_induk;
            if (!isset($groups[$groupId])) {
                $groups[$groupId] = [
                    'id' => 'group-' . $groupId,
                    'kode_induk' => $account->kode_induk,
                    'nama_induk' => $account->nama_induk,
                    'saldo_normal' => $account->saldo_normal,
                    'children' => [],
                ];
            }
            $groups[$groupId]['children'][] = [
                'id' => $account->id,
                'suffix' => $account->suffix,
                'kode_lengkap' => $account->kode_lengkap,
                'nama' => $account->nama,
                'saldo_unaudited' => (float)$account->saldo_unaudited,
                'tcm_unaudited' => $account->tcm_unaudited,
                'penyesuaian_debit' => (float)$account->penyesuaian_debit,
                'penyesuaian_kredit' => (float)$account->penyesuaian_kredit,
                'reff' => $account->reff,
                'saldo_audited' => (float)$account->saldo_audited,
                'tcm_audited' => $account->tcm_audited,
                'saldo_audited_prev' => (float)$account->saldo_audited_prev,
                'saldo_audited_prev2' => $account->saldo_audited_prev2 !== null ? (float)$account->saldo_audited_prev2 : null,
                'persen_materialitas' => (float)$account->persen_materialitas,
                'status_materialitas' => $account->status_materialitas,
            ];
        }

        $formattedForm = [
            'id' => $auditForm->id,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'book_year' => $client->book_year,
            'form_type' => 'C10',
            'status' => $auditForm->status,
            'reject_reason' => $auditForm->reject_reason,
            'section_data' => [
                'notes' => $auditForm->section_data['notes'] ?? '',
                'groups' => array_values($groups),
            ],
            'preparer_id' => $auditForm->timPerikatan->pegawai_id,
            'reviewer_id' => null,
            'approver_id' => null,
            'created_at' => $auditForm->created_at,
            'updated_at' => $auditForm->updated_at,
        ];

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'book_year' => $client->book_year,
                'schedule' => $client->schedule,
            ],
            'formType' => 'C10',
            'formToEdit' => $formattedForm,
        ]);
    }

    /**
     * Show form details.
     */
    public function show($type, $id)
    {
        $user = Auth::user();

        if ($type === 'A10') {
            $form = A10::find($id);
        } else {
            $form = C10D10::find($id);
        }

        if (!$form) {
            abort(404, 'Laporan tidak ditemukan.');
        }

        $client = $form->timPerikatan?->client;
        if (!$client) {
            abort(404, 'Client tidak ditemukan.');
        }

        // Check if user is part of the client team (or admin)
        if (!$user->isAdmin()) {
            $teamRole = $user->roleInClient($client->id);
            if (!$teamRole) {
                abort(403, 'Unauthorized.');
            }
        }

        $form->load(['timPerikatan.pegawai']);

        if ($type === 'A10') {
            $formatted = [
                'id' => $form->id,
                'client_id' => $client->id,
                'form_type' => 'A10',
                'status' => $form->status,
                'reject_reason' => $form->reject_reason,
                'section_data' => $form->form_a10,
                'preparer_id' => $form->timPerikatan?->pegawai_id,
                'preparer' => $form->timPerikatan?->pegawai,
                'reviewer_id' => null,
                'reviewer' => null,
                'approver_id' => null,
                'approver' => null,
                'created_at' => $form->created_at,
                'updated_at' => $form->updated_at,
            ];
        } else {
            if ($type === 'D10') {
                $form->load('accounts');
                $formatted = [
                    'id' => $form->id,
                    'client_id' => $client->id,
                    'form_type' => 'D10',
                    'status' => $form->status,
                    'reject_reason' => $form->reject_reason,
                    'section_data' => $this->getD10SectionData($form),
                    'preparer_id' => $form->timPerikatan?->pegawai_id,
                    'preparer' => $form->timPerikatan?->pegawai,
                    'reviewer_id' => null,
                    'reviewer' => null,
                    'approver_id' => null,
                    'approver' => null,
                    'created_at' => $form->created_at,
                    'updated_at' => $form->updated_at,
                ];
            } else {
                $groups = [];
                $form->load('accounts');
                foreach ($form->accounts as $account) {
                    $groupId = $account->kode_induk;
                    if (!isset($groups[$groupId])) {
                        $groups[$groupId] = [
                            'id' => 'group-' . $groupId,
                            'kode_induk' => $account->kode_induk,
                            'nama_induk' => $account->nama_induk,
                            'saldo_normal' => $account->saldo_normal,
                            'children' => [],
                        ];
                    }
                    $groups[$groupId]['children'][] = [
                        'id' => $account->id,
                        'suffix' => $account->suffix,
                        'kode_lengkap' => $account->kode_lengkap,
                        'nama' => $account->nama,
                        'saldo_unaudited' => (float)$account->saldo_unaudited,
                        'tcm_unaudited' => $account->tcm_unaudited,
                        'penyesuaian_debit' => (float)$account->penyesuaian_debit,
                        'penyesuaian_kredit' => (float)$account->penyesuaian_kredit,
                        'reff' => $account->reff,
                        'saldo_audited' => (float)$account->saldo_audited,
                        'tcm_audited' => $account->tcm_audited,
                        'saldo_audited_prev' => (float)$account->saldo_audited_prev,
                        'saldo_audited_prev2' => $account->saldo_audited_prev2 !== null ? (float)$account->saldo_audited_prev2 : null,
                        'persen_materialitas' => (float)$account->persen_materialitas,
                        'status_materialitas' => $account->status_materialitas,
                    ];
                }
                $formatted = [
                    'id' => $form->id,
                    'client_id' => $client->id,
                    'form_type' => 'C10',
                    'status' => $form->status,
                    'reject_reason' => $form->reject_reason,
                    'section_data' => [
                        'notes' => $form->section_data['notes'] ?? '',
                        'groups' => array_values($groups),
                    ],
                    'preparer_id' => $form->timPerikatan?->pegawai_id,
                    'preparer' => $form->timPerikatan?->pegawai,
                    'reviewer_id' => null,
                    'reviewer' => null,
                    'approver_id' => null,
                    'approver' => null,
                    'created_at' => $form->created_at,
                    'updated_at' => $form->updated_at,
                ];
            }
        }

        return response()->json($formatted);
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

        // Find tim perikatan
        $timPerikatan = TimPerikatan::where('pegawai_id', $user->pegawai_id)
            ->where('client_id', $validated['client_id'])
            ->first();

        if (!$timPerikatan || $timPerikatan->role !== 'anggota') {
            abort(403, 'Hanya Anggota tim perikatan yang dapat mengisi form.');
        }

        if ($validated['form_type'] === 'A10') {
            A10::create([
                'tim_perikatan_id' => $timPerikatan->id,
                'status' => 'draft',
                'form_a10' => $validated['section_data'],
            ]);
        } elseif ($validated['form_type'] === 'D10') {
            $overall = $validated['section_data']['overall_materiality'] ?? null;
            $performance = $validated['section_data']['performance_materiality'] ?? null;
            $tolerable = $validated['section_data']['tolerable_error'] ?? null;

            $c10D10 = C10D10::updateOrCreate(
                ['tim_perikatan_id' => $timPerikatan->id],
                [
                    'overall_materiality' => $overall,
                    'performance_materiality' => $performance,
                    'tolerable_error' => $tolerable,
                    'status' => 'draft',
                    'section_data' => $validated['section_data'],
                ]
            );

            // Sync accounts
            if (isset($validated['section_data']['accounts'])) {
                $payloadAccounts = $validated['section_data']['accounts'];
                $payloadAccountIds = collect($payloadAccounts)->pluck('id')->filter()->toArray();

                // Delete accounts removed from UI
                $c10D10->accounts()->whereNotIn('id', $payloadAccountIds)->delete();

                foreach ($payloadAccounts as $accPayload) {
                    $namaRaw = $accPayload['nama'] ?? '';
                    $kodeLengkap = null;
                    $nama = $namaRaw;

                    if (preg_match('/^([\w\.\-]+)\s*-\s*(.+)$/', $namaRaw, $matches)) {
                        $kodeLengkap = trim($matches[1]);
                        $nama = trim($matches[2]);
                    }

                    $inhouse = $accPayload['inhouse'] ?? 0;
                    $persen = $accPayload['persen'] ?? 50.00;
                    $statusMat = $accPayload['status'] ?? 'Tidak';

                    if (!empty($accPayload['id'])) {
                        $accountObj = $c10D10->accounts()->find($accPayload['id']);
                        if ($accountObj) {
                            $accountObj->update([
                                'kode_lengkap' => $kodeLengkap,
                                'nama' => $nama,
                                'saldo_unaudited' => $inhouse,
                                'persen_materialitas' => $persen,
                                'status_materialitas' => $statusMat,
                            ]);
                        }
                    } else {
                        // Guess parent group
                        $kodeInduk = '';
                        $namaInduk = '';
                        $saldoNormal = 'debit';

                        if ($kodeLengkap) {
                            $sibling = $c10D10->accounts()
                                ->whereNotNull('kode_lengkap')
                                ->where('kode_lengkap', '!=', '')
                                ->where(function($q) use ($kodeLengkap) {
                                    $prefix2 = substr($kodeLengkap, 0, 2);
                                    $prefix1 = substr($kodeLengkap, 0, 1);
                                    $q->where('kode_lengkap', 'like', $prefix2 . '%')
                                      ->orWhere('kode_lengkap', 'like', $prefix1 . '%');
                                })
                                ->first();

                            if ($sibling) {
                                $kodeInduk = $sibling->kode_induk;
                                $namaInduk = $sibling->nama_induk;
                                $saldoNormal = $sibling->saldo_normal;
                            } else {
                                $firstDigit = substr($kodeLengkap, 0, 1);
                                if ($firstDigit === '1') {
                                    $kodeInduk = '1000';
                                    $namaInduk = 'Aset';
                                    $saldoNormal = 'debit';
                                } elseif ($firstDigit === '2') {
                                    $kodeInduk = '2000';
                                    $namaInduk = 'Liabilitas';
                                    $saldoNormal = 'kredit';
                                } elseif ($firstDigit === '3') {
                                    $kodeInduk = '3000';
                                    $namaInduk = 'Ekuitas';
                                    $saldoNormal = 'kredit';
                                } elseif ($firstDigit === '4') {
                                    $kodeInduk = '4000';
                                    $namaInduk = 'Pendapatan';
                                    $saldoNormal = 'kredit';
                                } elseif ($firstDigit === '5') {
                                    $kodeInduk = '5000';
                                    $namaInduk = 'Beban';
                                    $saldoNormal = 'debit';
                                }
                            }
                        }

                        C10D10Account::create([
                            'c10_d10_id' => $c10D10->id,
                            'kode_induk' => $kodeInduk,
                            'nama_induk' => $namaInduk,
                            'saldo_normal' => $saldoNormal,
                            'suffix' => $kodeLengkap ? substr($kodeLengkap, -2) : '',
                            'kode_lengkap' => $kodeLengkap,
                            'nama' => $nama,
                            'saldo_unaudited' => $inhouse,
                            'tcm_unaudited' => null,
                            'penyesuaian_debit' => 0,
                            'penyesuaian_kredit' => 0,
                            'reff' => null,
                            'saldo_audited' => $inhouse,
                            'tcm_audited' => null,
                            'saldo_audited_prev' => 0,
                            'saldo_audited_prev2' => null,
                            'persen_materialitas' => $persen,
                            'status_materialitas' => $statusMat,
                        ]);
                    }
                }
            }
        } elseif ($validated['form_type'] === 'C10') {
            $c10D10 = C10D10::firstOrCreate(
                ['tim_perikatan_id' => $timPerikatan->id],
                [
                    'status' => 'draft',
                    'section_data' => ['notes' => $validated['section_data']['notes'] ?? ''],
                ]
            );

            $c10D10->update([
                'section_data' => array_merge($c10D10->section_data ?? [], [
                    'notes' => $validated['section_data']['notes'] ?? ''
                ])
            ]);

            $c10D10->accounts()->delete();
            $groups = $validated['section_data']['groups'] ?? [];
            foreach ($groups as $group) {
                $children = $group['children'] ?? [];
                foreach ($children as $child) {
                    C10D10Account::create([
                        'c10_d10_id' => $c10D10->id,
                        'kode_induk' => $group['kode_induk'] ?? '',
                        'nama_induk' => $group['nama_induk'] ?? '',
                        'saldo_normal' => $group['saldo_normal'] ?? 'debit',
                        'suffix' => $child['suffix'] ?? '',
                        'kode_lengkap' => $child['kode_lengkap'] ?? '',
                        'nama' => $child['nama'] ?? '',
                        'saldo_unaudited' => $child['saldo_unaudited'] ?? 0,
                        'tcm_unaudited' => $child['tcm_unaudited'] ?? null,
                        'penyesuaian_debit' => $child['penyesuaian_debit'] ?? 0,
                        'penyesuaian_kredit' => $child['penyesuaian_kredit'] ?? 0,
                        'reff' => $child['reff'] ?? null,
                        'saldo_audited' => $child['saldo_audited'] ?? 0,
                        'tcm_audited' => $child['tcm_audited'] ?? null,
                        'saldo_audited_prev' => $child['saldo_audited_prev'] ?? 0,
                        'saldo_audited_prev2' => $child['saldo_audited_prev2'] ?? null,
                        'persen_materialitas' => $child['persen_materialitas'] ?? 50.00,
                        'status_materialitas' => $child['status_materialitas'] ?? 'Tidak',
                    ]);
                }
            }
        }

        return redirect()->route('dashboard')->with('success', 'Draft form berhasil disimpan.');
    }

    /**
     * Update an existing audit form.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $form_type = $request->input('form_type');

        if ($form_type === 'A10') {
            $form = A10::findOrFail($id);
        } else {
            $form = C10D10::findOrFail($id);
        }

        if ($form->timPerikatan->pegawai_id !== $user->pegawai_id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if (!in_array($form->status, ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'])) {
            abort(400, 'Laporan yang sudah disubmit tidak dapat diubah.');
        }

        $validated = $request->validate([
            'section_data' => 'required|array',
        ]);

        if ($form_type === 'A10') {
            $form->update([
                'form_a10' => $validated['section_data'],
            ]);
        } elseif ($form_type === 'D10') {
            $overall = $validated['section_data']['overall_materiality'] ?? null;
            $performance = $validated['section_data']['performance_materiality'] ?? null;
            $tolerable = $validated['section_data']['tolerable_error'] ?? null;

            $form->update([
                'overall_materiality' => $overall,
                'performance_materiality' => $performance,
                'tolerable_error' => $tolerable,
                'section_data' => $validated['section_data'],
            ]);

            // Sync accounts
            if (isset($validated['section_data']['accounts'])) {
                $payloadAccounts = $validated['section_data']['accounts'];
                $payloadAccountIds = collect($payloadAccounts)->pluck('id')->filter()->toArray();

                // Delete accounts removed from UI
                $form->accounts()->whereNotIn('id', $payloadAccountIds)->delete();

                foreach ($payloadAccounts as $accPayload) {
                    $namaRaw = $accPayload['nama'] ?? '';
                    $kodeLengkap = null;
                    $nama = $namaRaw;

                    if (preg_match('/^([\w\.\-]+)\s*-\s*(.+)$/', $namaRaw, $matches)) {
                        $kodeLengkap = trim($matches[1]);
                        $nama = trim($matches[2]);
                    }

                    $inhouse = $accPayload['inhouse'] ?? 0;
                    $persen = $accPayload['persen'] ?? 50.00;
                    $statusMat = $accPayload['status'] ?? 'Tidak';

                    if (!empty($accPayload['id'])) {
                        $accountObj = $form->accounts()->find($accPayload['id']);
                        if ($accountObj) {
                            $accountObj->update([
                                'kode_lengkap' => $kodeLengkap,
                                'nama' => $nama,
                                'saldo_unaudited' => $inhouse,
                                'persen_materialitas' => $persen,
                                'status_materialitas' => $statusMat,
                            ]);
                        }
                    } else {
                        // Guess parent group
                        $kodeInduk = '';
                        $namaInduk = '';
                        $saldoNormal = 'debit';

                        if ($kodeLengkap) {
                            $sibling = $form->accounts()
                                ->whereNotNull('kode_lengkap')
                                ->where('kode_lengkap', '!=', '')
                                ->where(function($q) use ($kodeLengkap) {
                                    $prefix2 = substr($kodeLengkap, 0, 2);
                                    $prefix1 = substr($kodeLengkap, 0, 1);
                                    $q->where('kode_lengkap', 'like', $prefix2 . '%')
                                      ->orWhere('kode_lengkap', 'like', $prefix1 . '%');
                                })
                                ->first();

                            if ($sibling) {
                                $kodeInduk = $sibling->kode_induk;
                                $namaInduk = $sibling->nama_induk;
                                $saldoNormal = $sibling->saldo_normal;
                            } else {
                                $firstDigit = substr($kodeLengkap, 0, 1);
                                if ($firstDigit === '1') {
                                    $kodeInduk = '1000';
                                    $namaInduk = 'Aset';
                                    $saldoNormal = 'debit';
                                } elseif ($firstDigit === '2') {
                                    $kodeInduk = '2000';
                                    $namaInduk = 'Liabilitas';
                                    $saldoNormal = 'kredit';
                                } elseif ($firstDigit === '3') {
                                    $kodeInduk = '3000';
                                    $namaInduk = 'Ekuitas';
                                    $saldoNormal = 'kredit';
                                } elseif ($firstDigit === '4') {
                                    $kodeInduk = '4000';
                                    $namaInduk = 'Pendapatan';
                                    $saldoNormal = 'kredit';
                                } elseif ($firstDigit === '5') {
                                    $kodeInduk = '5000';
                                    $namaInduk = 'Beban';
                                    $saldoNormal = 'debit';
                                }
                            }
                        }

                        C10D10Account::create([
                            'c10_d10_id' => $form->id,
                            'kode_induk' => $kodeInduk,
                            'nama_induk' => $namaInduk,
                            'saldo_normal' => $saldoNormal,
                            'suffix' => $kodeLengkap ? substr($kodeLengkap, -2) : '',
                            'kode_lengkap' => $kodeLengkap,
                            'nama' => $nama,
                            'saldo_unaudited' => $inhouse,
                            'tcm_unaudited' => null,
                            'penyesuaian_debit' => 0,
                            'penyesuaian_kredit' => 0,
                            'reff' => null,
                            'saldo_audited' => $inhouse,
                            'tcm_audited' => null,
                            'saldo_audited_prev' => 0,
                            'saldo_audited_prev2' => null,
                            'persen_materialitas' => $persen,
                            'status_materialitas' => $statusMat,
                        ]);
                    }
                }
            }
        } elseif ($form_type === 'C10') {
            $form->update([
                'section_data' => array_merge($form->section_data ?? [], [
                    'notes' => $validated['section_data']['notes'] ?? ''
                ])
            ]);

            $form->accounts()->delete();
            $groups = $validated['section_data']['groups'] ?? [];
            foreach ($groups as $group) {
                $children = $group['children'] ?? [];
                foreach ($children as $child) {
                    C10D10Account::create([
                        'c10_d10_id' => $form->id,
                        'kode_induk' => $group['kode_induk'] ?? '',
                        'nama_induk' => $group['nama_induk'] ?? '',
                        'saldo_normal' => $group['saldo_normal'] ?? 'debit',
                        'suffix' => $child['suffix'] ?? '',
                        'kode_lengkap' => $child['kode_lengkap'] ?? '',
                        'nama' => $child['nama'] ?? '',
                        'saldo_unaudited' => $child['saldo_unaudited'] ?? 0,
                        'tcm_unaudited' => $child['tcm_unaudited'] ?? null,
                        'penyesuaian_debit' => $child['penyesuaian_debit'] ?? 0,
                        'penyesuaian_kredit' => $child['penyesuaian_kredit'] ?? 0,
                        'reff' => $child['reff'] ?? null,
                        'saldo_audited' => $child['saldo_audited'] ?? 0,
                        'tcm_audited' => $child['tcm_audited'] ?? null,
                        'saldo_audited_prev' => $child['saldo_audited_prev'] ?? 0,
                        'saldo_audited_prev2' => $child['saldo_audited_prev2'] ?? null,
                        'persen_materialitas' => $child['persen_materialitas'] ?? 50.00,
                        'status_materialitas' => $child['status_materialitas'] ?? 'Tidak',
                    ]);
                }
            }
        }

        return redirect()->route('dashboard')->with('success', 'Form berhasil diperbarui.');
    }

    /**
     * Submit form for review.
     */
    public function submit(Request $request, $id)
    {
        $user = Auth::user();

        $formType = $request->input('form_type');
        if ($formType === 'A10') {
            $form = A10::find($id);
        } elseif ($formType === 'C10' || $formType === 'D10') {
            $form = C10D10::find($id);
        } else {
            // Fallback
            $form = A10::find($id) ?: C10D10::find($id);
        }

        if (!$form) {
            abort(404, 'Laporan tidak ditemukan.');
        }

        $client = $form->timPerikatan?->client;
        if (!$client) {
            abort(404, 'Client tidak ditemukan.');
        }

        if ($form->timPerikatan->pegawai_id !== $user->pegawai_id) {
            abort(403, 'Unauthorized.');
        }

        if (!in_array($form->status, ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'])) {
            abort(400, 'Laporan sudah disubmit sebelumnya.');
        }

        $nextStatus = 'pending_ketua_tim';
        if ($form->status === 'rejected_supervisor') {
            $nextStatus = 'pending_supervisor';
        } elseif ($form->status === 'rejected_partner') {
            $nextStatus = 'pending_partner';
        }

        $form->update([
            'status' => $nextStatus,
            'reject_reason' => null,
        ]);

        return redirect()->route('dashboard')->with('success', 'Laporan berhasil diajukan ke Ketua Tim.');
    }

    /**
     * Review form (Approve or Reject).
     */
    public function review(Request $request, $id)
    {
        $user = Auth::user();

        $formType = $request->input('form_type');
        if ($formType === 'A10') {
            $form = A10::find($id);
        } elseif ($formType === 'C10' || $formType === 'D10') {
            $form = C10D10::find($id);
        } else {
            // Fallback
            $form = A10::find($id) ?: C10D10::find($id);
        }

        if (!$form) {
            abort(404, 'Laporan tidak ditemukan.');
        }

        $client = $form->timPerikatan?->client;
        if (!$client) {
            abort(404, 'Client tidak ditemukan.');
        }

        $timPerikatan = TimPerikatan::where('pegawai_id', $user->pegawai_id)
            ->where('client_id', $client->id)
            ->first();

        if (!$timPerikatan || !in_array($timPerikatan->role, ['ketua_tim', 'supervisor', 'partner'])) {
            abort(403, 'Hanya Ketua Tim, Supervisor, atau Partner yang dapat melakukan review.');
        }

        $teamRole = $timPerikatan->role;

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'reject_reason' => 'required_if:action,reject|nullable|string',
        ]);

        if ($validated['action'] === 'reject') {
            $rejectStatus = 'rejected';
            if ($teamRole === 'ketua_tim') {
                $rejectStatus = 'rejected_ketua_tim';
            } elseif ($teamRole === 'supervisor') {
                $rejectStatus = 'rejected_supervisor';
            } elseif ($teamRole === 'partner') {
                $rejectStatus = 'rejected_partner';
            }

            $form->update([
                'status' => $rejectStatus,
                'reject_reason' => $validated['reject_reason'],
            ]);

            $roleLabel = $teamRole === 'ketua_tim' ? 'Ketua Tim' : ($teamRole === 'supervisor' ? 'Supervisor' : 'Partner');
            return redirect()->route('dashboard')->with('success', "Laporan ditolak oleh {$roleLabel} dan dikembalikan ke Anggota.");
        }

        if ($teamRole === 'ketua_tim') {
            if ($form->status !== 'pending_ketua_tim') {
                abort(400, 'Status laporan tidak valid untuk disetujui Ketua Tim.');
            }
            $form->update([
                'status' => 'pending_supervisor',
            ]);
            return redirect()->route('dashboard')->with('success', 'Laporan disetujui Ketua Tim. Menunggu review Supervisor.');
        } elseif ($teamRole === 'supervisor') {
            if ($form->status !== 'pending_supervisor') {
                abort(400, 'Status laporan tidak valid untuk disetujui Supervisor.');
            }
            $form->update([
                'status' => 'pending_partner',
            ]);
            return redirect()->route('dashboard')->with('success', 'Laporan disetujui Supervisor. Menunggu review Partner.');
        } elseif ($teamRole === 'partner') {
            if ($form->status !== 'pending_partner') {
                abort(400, 'Status laporan tidak valid untuk disetujui Partner.');
            }
            $form->update([
                'status' => 'final_approved',
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
            'created_by' => auth()->user()?->pegawai_id,
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

        // Detach old team (using pegawai relation)
        $client->pegawais()->detach();

        foreach ($request->team as $member) {
            $user = User::find($member['user_id']);
            if ($user && $user->pegawai_id) {
                $client->pegawais()->attach($user->pegawai_id, ['role' => $member['role']]);
            }
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

    /**
     * Get the formatted section_data for D10 with all fallback defaults to avoid React crashing.
     */
    private function getD10SectionData($c10D10)
    {
        $defaultD10Data = [
            'jenis_kondisi' => 'stabil',
            'benchmark' => 'laba_bersih',
            'overall_materiality' => 0,
            'performance_percent' => 80,
            'performance_materiality' => 0,
            'tolerable_percent' => 5,
            'tolerable_error' => 0,
            'benchmarks' => [
                'pendapatan' => ['nominal' => 0, 'persen' => 1.0, 'hasil' => 0],
                'laba_bersih' => ['nominal' => 0, 'persen' => 5.0, 'hasil' => 0],
                'aset' => ['nominal' => 0, 'persen' => 1.0, 'hasil' => 0],
                'ekuitas' => ['nominal' => 0, 'persen' => 3.0, 'hasil' => 0]
            ],
            'qualitative_questions' => [
                ['no' => 1, 'description' => 'Apakah salah saji tahun sebelumnya signifikan?', 'value' => 'Ya', 'notes' => ''],
                ['no' => 2, 'description' => 'Apakah ada perubahan struktur organisasi kunci yang menimbulkan risiko?', 'value' => 'Ya', 'notes' => ''],
                ['no' => 3, 'description' => 'Apakah perusahaan diatur oleh regulasi yang ketat?', 'value' => 'Ya', 'notes' => ''],
                ['no' => 4, 'description' => 'Apakah perusahaan termasuk perusahaan publik atau dalam proses gopublik?', 'value' => 'Ya', 'notes' => ''],
            ]
        ];

        $dbData = $c10D10->section_data ?? [];
        $d10Data = array_merge($defaultD10Data, $dbData);

        // Override database materiality values specifically if they are set in the model
        if ($c10D10->overall_materiality !== null) {
            $d10Data['overall_materiality'] = (float)$c10D10->overall_materiality;
        }
        if ($c10D10->performance_materiality !== null) {
            $d10Data['performance_materiality'] = (float)$c10D10->performance_materiality;
        }
        if ($c10D10->tolerable_error !== null) {
            $d10Data['tolerable_error'] = (float)$c10D10->tolerable_error;
        }

        // Pull accounts
        $accounts = [];
        if ($c10D10->accounts->isNotEmpty()) {
            foreach ($c10D10->accounts as $account) {
                $accounts[] = [
                    'id' => $account->id,
                    'nama' => $account->kode_lengkap ? ($account->kode_lengkap . ' - ' . $account->nama) : $account->nama,
                    'inhouse' => (float)$account->saldo_unaudited,
                    'persen' => (float)$account->persen_materialitas,
                    'nominal' => $c10D10->overall_materiality ? (float)round($c10D10->overall_materiality * ($account->persen_materialitas / 100)) : 0,
                    'status' => $account->status_materialitas,
                ];
            }
        } else {
            $accounts = $dbData['accounts'] ?? [
                ['nama' => '', 'inhouse' => 0, 'persen' => 50, 'nominal' => 0, 'status' => 'Tidak']
            ];
        }

        $d10Data['accounts'] = $accounts;

        return $d10Data;
    }
}
