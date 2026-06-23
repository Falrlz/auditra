<?php

namespace App\Http\Controllers;

use App\Models\A10;
use App\Models\C10D10;
use App\Models\C10D10Account;
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

        $clients = $clientsQuery->with([
            'users',
            'a10.preparer', 'a10.reviewer', 'a10.approver',
            'c10D10.preparer', 'c10D10.reviewer', 'c10D10.approver', 'c10D10.accounts'
        ])->latest()->get();

        // Format clients for frontend
        $formattedClients = $clients->map(function ($client) use ($user) {
            $pivot = $client->users->where('id', $user->id)->first();
            $teamRole = $pivot ? $pivot->pivot->peran : null;

            $forms = [];

            // A10 Form
            if ($client->a10) {
                $forms[] = [
                    'id' => $client->a10->id,
                    'client_id' => $client->a10->klien_id,
                    'form_type' => 'A10',
                    'status' => $client->a10->status,
                    'reject_reason' => $client->a10->alasan_penolakan,
                    'section_data' => $client->a10->form_a10,
                    'preparer_id' => $client->a10->pembuat_id,
                    'preparer' => $client->a10->preparer,
                    'reviewer_id' => $client->a10->penelaah_id,
                    'reviewer' => $client->a10->reviewer,
                    'approver_id' => $client->a10->penyetuju_id,
                    'approver' => $client->a10->approver,
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
                        'suffix' => $account->sufiks,
                        'kode_lengkap' => $account->kode_lengkap,
                        'nama' => $account->nama,
                        'saldo_unaudited' => (float)$account->saldo_unaudited,
                        'tcm_unaudited' => $account->tcm_unaudited,
                        'penyesuaian_debit' => (float)$account->penyesuaian_debit,
                        'penyesuaian_kredit' => (float)$account->penyesuaian_kredit,
                        'reff' => $account->referensi,
                        'saldo_audited' => (float)$account->saldo_audited,
                        'tcm_audited' => $account->tcm_audited,
                        'saldo_audited_prev' => (float)$account->saldo_audited_sebelumnya,
                        'saldo_audited_prev2' => $account->saldo_audited_sebelumnya2 !== null ? (float)$account->saldo_audited_sebelumnya2 : null,
                        'persen_materialitas' => (float)$account->persen_materialitas,
                        'status_materialitas' => $account->status_materialitas,
                    ];
                }

                $forms[] = [
                    'id' => $client->c10D10->id,
                    'client_id' => $client->c10D10->klien_id,
                    'form_type' => 'C10',
                    'status' => $client->c10D10->status,
                    'reject_reason' => $client->c10D10->alasan_penolakan,
                    'section_data' => [
                        'notes' => $client->c10D10->data_bagian['notes'] ?? '',
                        'groups' => array_values($groups),
                    ],
                    'preparer_id' => $client->c10D10->pembuat_id,
                    'preparer' => $client->c10D10->preparer,
                    'reviewer_id' => $client->c10D10->penelaah_id,
                    'reviewer' => $client->c10D10->reviewer,
                    'approver_id' => $client->c10D10->penyetuju_id,
                    'approver' => $client->c10D10->approver,
                    'created_at' => $client->c10D10->created_at,
                    'updated_at' => $client->c10D10->updated_at,
                ];

                // D10 Form
                $forms[] = [
                    'id' => $client->c10D10->id,
                    'client_id' => $client->c10D10->klien_id,
                    'form_type' => 'D10',
                    'status' => $client->c10D10->status,
                    'reject_reason' => $client->c10D10->alasan_penolakan,
                    'section_data' => $this->getD10SectionData($client->c10D10),
                    'preparer_id' => $client->c10D10->pembuat_id,
                    'preparer' => $client->c10D10->preparer,
                    'reviewer_id' => $client->c10D10->penelaah_id,
                    'reviewer' => $client->c10D10->reviewer,
                    'approver_id' => $client->c10D10->penyetuju_id,
                    'approver' => $client->c10D10->approver,
                    'created_at' => $client->c10D10->created_at,
                    'updated_at' => $client->c10D10->updated_at,
                ];
            }

            return [
                'id' => $client->id,
                'name' => $client->nama,
                'book_year' => $client->tahun_buku,
                'schedule' => $client->jadwal,
                'team' => $client->users->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'role' => $u->pivot->peran,
                        'inisial' => $u->inisial,
                        'email' => $u->email,
                    ];
                }),
                'team_role' => $teamRole,
                'forms' => $forms,
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

        $d10Form = C10D10::where('klien_id', $client->id)->first();
        $materiality = [
            'overall_materiality' => $d10Form?->materialitas_keseluruhan ?? null,
            'performance_materiality' => $d10Form?->materialitas_kinerja ?? null,
            'tolerable_error' => $d10Form?->kesalahan_ditoleransi ?? null,
        ];

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->nama,
                'book_year' => $client->tahun_buku,
                'schedule' => $client->jadwal,
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
        $client = Client::findOrFail($auditForm->klien_id);

        $teamRole = $user->roleInClient($auditForm->klien_id);
        if ($teamRole !== 'anggota' || $auditForm->pembuat_id !== $user->id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->status === 'final_approved') {
            abort(400, 'Laporan yang sudah disetujui tidak dapat diubah.');
        }

        $d10Form = C10D10::where('klien_id', $client->id)->first();
        $materiality = [
            'overall_materiality' => $d10Form?->materialitas_keseluruhan ?? null,
            'performance_materiality' => $d10Form?->materialitas_kinerja ?? null,
            'tolerable_error' => $d10Form?->kesalahan_ditoleransi ?? null,
        ];

        $formattedForm = [
            'id' => $auditForm->id,
            'client_id' => $auditForm->klien_id,
            'client_name' => $client->nama,
            'book_year' => $client->tahun_buku,
            'form_type' => 'A10',
            'status' => $auditForm->status,
            'reject_reason' => $auditForm->alasan_penolakan,
            'section_data' => $auditForm->form_a10,
            'preparer_id' => $auditForm->pembuat_id,
            'reviewer_id' => $auditForm->penelaah_id,
            'approver_id' => $auditForm->penyetuju_id,
            'created_at' => $auditForm->created_at,
            'updated_at' => $auditForm->updated_at,
        ];

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->nama,
                'book_year' => $client->tahun_buku,
                'schedule' => $client->jadwal,
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

        $c10D10 = C10D10::where('klien_id', $client->id)->with('accounts')->first();
        $formToEdit = null;

        if ($c10D10) {
            $formToEdit = [
                'id' => $c10D10->id,
                'client_id' => $c10D10->klien_id,
                'client_name' => $client->nama,
                'book_year' => $client->tahun_buku,
                'form_type' => 'D10',
                'status' => $c10D10->status,
                'reject_reason' => $c10D10->alasan_penolakan,
                'section_data' => $this->getD10SectionData($c10D10),
                'preparer_id' => $c10D10->pembuat_id,
                'preparer' => $c10D10->preparer,
                'reviewer_id' => $c10D10->penelaah_id,
                'reviewer' => $c10D10->reviewer,
                'approver_id' => $c10D10->penyetuju_id,
                'approver' => $c10D10->approver,
                'created_at' => $c10D10->created_at,
                'updated_at' => $c10D10->updated_at,
            ];
        }

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->nama,
                'book_year' => $client->tahun_buku,
                'schedule' => $client->jadwal,
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
        $client = Client::findOrFail($auditForm->klien_id);

        $teamRole = $user->roleInClient($auditForm->klien_id);
        if ($teamRole !== 'anggota' || $auditForm->pembuat_id !== $user->id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->status === 'final_approved') {
            abort(400, 'Laporan yang sudah disetujui tidak dapat diubah.');
        }

        $auditForm->load('accounts');

        $formattedForm = [
            'id' => $auditForm->id,
            'client_id' => $auditForm->klien_id,
            'client_name' => $client->nama,
            'book_year' => $client->tahun_buku,
            'form_type' => 'D10',
            'status' => $auditForm->status,
            'reject_reason' => $auditForm->alasan_penolakan,
            'section_data' => $this->getD10SectionData($auditForm),
            'preparer_id' => $auditForm->pembuat_id,
            'reviewer_id' => $auditForm->penelaah_id,
            'approver_id' => $auditForm->penyetuju_id,
            'created_at' => $auditForm->created_at,
            'updated_at' => $auditForm->updated_at,
        ];

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->nama,
                'book_year' => $client->tahun_buku,
                'schedule' => $client->jadwal,
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
                'name' => $client->nama,
                'book_year' => $client->tahun_buku,
                'schedule' => $client->jadwal,
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
        $client = Client::findOrFail($auditForm->klien_id);

        $teamRole = $user->roleInClient($auditForm->klien_id);
        if ($teamRole !== 'anggota' || $auditForm->pembuat_id !== $user->id) {
            abort(403, 'Hanya Anggota pembuat form yang dapat melakukan perubahan.');
        }

        if ($auditForm->status === 'final_approved') {
            abort(400, 'Laporan yang sudah disetujui tidak dapat diubah.');
        }

        // Reconstruct groups
        $groups = [];
        $auditForm->load('accounts');
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
                'suffix' => $account->sufiks,
                'kode_lengkap' => $account->kode_lengkap,
                'nama' => $account->nama,
                'saldo_unaudited' => (float)$account->saldo_unaudited,
                'tcm_unaudited' => $account->tcm_unaudited,
                'penyesuaian_debit' => (float)$account->penyesuaian_debit,
                'penyesuaian_kredit' => (float)$account->penyesuaian_kredit,
                'reff' => $account->referensi,
                'saldo_audited' => (float)$account->saldo_audited,
                'tcm_audited' => $account->tcm_audited,
                'saldo_audited_prev' => (float)$account->saldo_audited_sebelumnya,
                'saldo_audited_prev2' => $account->saldo_audited_sebelumnya2 !== null ? (float)$account->saldo_audited_sebelumnya2 : null,
                'persen_materialitas' => (float)$account->persen_materialitas,
                'status_materialitas' => $account->status_materialitas,
            ];
        }

        $formattedForm = [
            'id' => $auditForm->id,
            'client_id' => $auditForm->klien_id,
            'client_name' => $client->nama,
            'book_year' => $client->tahun_buku,
            'form_type' => 'C10',
            'status' => $auditForm->status,
            'reject_reason' => $auditForm->alasan_penolakan,
            'section_data' => [
                'notes' => $auditForm->data_bagian['notes'] ?? '',
                'groups' => array_values($groups),
            ],
            'preparer_id' => $auditForm->pembuat_id,
            'reviewer_id' => $auditForm->penelaah_id,
            'approver_id' => $auditForm->penyetuju_id,
            'created_at' => $auditForm->created_at,
            'updated_at' => $auditForm->updated_at,
        ];

        return Inertia::render('AuditForm/Edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->nama,
                'book_year' => $client->tahun_buku,
                'schedule' => $client->jadwal,
            ],
            'formType' => 'C10',
            'formToEdit' => $formattedForm,
        ]);
    }

    /**
     * Show a single audit form.
     */
    public function show(Request $request, $id)
    {
        $user = Auth::user();

        // Check A10 first or C10/D10 based on form_type query
        $formType = $request->query('form_type');
        if ($formType === 'A10') {
            $form = A10::find($id);
            $type = 'A10';
        } elseif ($formType === 'C10' || $formType === 'D10') {
            $form = C10D10::find($id);
            $type = $formType;
        } else {
            // Fallback
            $form = A10::find($id);
            $type = 'A10';
            if (!$form) {
                $form = C10D10::find($id);
                $type = 'C10';
            }
        }

        if (!$form) {
            abort(404, 'Laporan tidak ditemukan.');
        }

        // Check if user is part of the client team (or admin)
        if (!$user->isAdmin()) {
            $teamRole = $user->roleInClient($form->klien_id);
            if (!$teamRole) {
                abort(403, 'Unauthorized.');
            }
        }

        $form->load(['preparer', 'reviewer', 'approver']);

        if ($type === 'A10') {
            $formatted = [
                'id' => $form->id,
                'client_id' => $form->klien_id,
                'form_type' => 'A10',
                'status' => $form->status,
                'reject_reason' => $form->alasan_penolakan,
                'section_data' => $form->form_a10,
                'preparer_id' => $form->pembuat_id,
                'preparer' => $form->preparer,
                'reviewer_id' => $form->penelaah_id,
                'reviewer' => $form->reviewer,
                'approver_id' => $form->penyetuju_id,
                'approver' => $form->approver,
                'created_at' => $form->created_at,
                'updated_at' => $form->updated_at,
            ];
        } else {
            if ($type === 'D10') {
                $form->load('accounts');
                $formatted = [
                    'id' => $form->id,
                    'client_id' => $form->klien_id,
                    'form_type' => 'D10',
                    'status' => $form->status,
                    'reject_reason' => $form->alasan_penolakan,
                    'section_data' => $this->getD10SectionData($form),
                    'preparer_id' => $form->pembuat_id,
                    'preparer' => $form->preparer,
                    'reviewer_id' => $form->penelaah_id,
                    'reviewer' => $form->reviewer,
                    'approver_id' => $form->penyetuju_id,
                    'approver' => $form->approver,
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
                        'suffix' => $account->sufiks,
                        'kode_lengkap' => $account->kode_lengkap,
                        'nama' => $account->nama,
                        'saldo_unaudited' => (float)$account->saldo_unaudited,
                        'tcm_unaudited' => $account->tcm_unaudited,
                        'penyesuaian_debit' => (float)$account->penyesuaian_debit,
                        'penyesuaian_kredit' => (float)$account->penyesuaian_kredit,
                        'reff' => $account->referensi,
                        'saldo_audited' => (float)$account->saldo_audited,
                        'tcm_audited' => $account->tcm_audited,
                        'saldo_audited_prev' => (float)$account->saldo_audited_sebelumnya,
                        'saldo_audited_prev2' => $account->saldo_audited_sebelumnya2 !== null ? (float)$account->saldo_audited_sebelumnya2 : null,
                        'persen_materialitas' => (float)$account->persen_materialitas,
                        'status_materialitas' => $account->status_materialitas,
                    ];
                }
                $formatted = [
                    'id' => $form->id,
                    'client_id' => $form->klien_id,
                    'form_type' => 'C10',
                    'status' => $form->status,
                    'reject_reason' => $form->alasan_penolakan,
                    'section_data' => [
                        'notes' => $form->data_bagian['notes'] ?? '',
                        'groups' => array_values($groups),
                    ],
                    'preparer_id' => $form->pembuat_id,
                    'preparer' => $form->preparer,
                    'reviewer_id' => $form->penelaah_id,
                    'reviewer' => $form->reviewer,
                    'approver_id' => $form->penyetuju_id,
                    'approver' => $form->approver,
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

        // Validate team role is 'anggota'
        $teamRole = $user->roleInClient($validated['client_id']);
        if ($teamRole !== 'anggota') {
            abort(403, 'Hanya Anggota tim perikatan yang dapat mengisi form.');
        }

        if ($validated['form_type'] === 'A10') {
            A10::create([
                'klien_id' => $validated['client_id'],
                'status' => 'draft',
                'form_a10' => $validated['section_data'],
                'pembuat_id' => $user->id,
            ]);
        } elseif ($validated['form_type'] === 'D10') {
            $overall = $validated['section_data']['overall_materiality'] ?? null;
            $performance = $validated['section_data']['performance_materiality'] ?? null;
            $tolerable = $validated['section_data']['tolerable_error'] ?? null;

            $c10D10 = C10D10::updateOrCreate(
                ['klien_id' => $validated['client_id']],
                [
                    'materialitas_keseluruhan' => $overall,
                    'materialitas_kinerja' => $performance,
                    'kesalahan_ditoleransi' => $tolerable,
                    'status' => 'draft',
                    'data_bagian' => $validated['section_data'],
                    'pembuat_id' => $user->id,
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
                            'sufiks' => $kodeLengkap ? substr($kodeLengkap, -2) : '',
                            'kode_lengkap' => $kodeLengkap,
                            'nama' => $nama,
                            'saldo_unaudited' => $inhouse,
                            'tcm_unaudited' => null,
                            'penyesuaian_debit' => 0,
                            'penyesuaian_kredit' => 0,
                            'referensi' => null,
                            'saldo_audited' => $inhouse,
                            'tcm_audited' => null,
                            'saldo_audited_sebelumnya' => 0,
                            'saldo_audited_sebelumnya2' => null,
                            'persen_materialitas' => $persen,
                            'status_materialitas' => $statusMat,
                        ]);
                    }
                }
            }
        } elseif ($validated['form_type'] === 'C10') {
            $c10D10 = C10D10::firstOrCreate(
                ['klien_id' => $validated['client_id']],
                [
                    'status' => 'draft',
                    'data_bagian' => ['notes' => $validated['section_data']['notes'] ?? ''],
                    'pembuat_id' => $user->id,
                ]
            );

            $c10D10->update([
                'data_bagian' => array_merge($c10D10->data_bagian ?? [], [
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
                        'sufiks' => $child['suffix'] ?? '',
                        'kode_lengkap' => $child['kode_lengkap'] ?? '',
                        'nama' => $child['nama'] ?? '',
                        'saldo_unaudited' => $child['saldo_unaudited'] ?? 0,
                        'tcm_unaudited' => $child['tcm_unaudited'] ?? null,
                        'penyesuaian_debit' => $child['penyesuaian_debit'] ?? 0,
                        'penyesuaian_kredit' => $child['penyesuaian_kredit'] ?? 0,
                        'referensi' => $child['reff'] ?? null,
                        'saldo_audited' => $child['saldo_audited'] ?? 0,
                        'tcm_audited' => $child['tcm_audited'] ?? null,
                        'saldo_audited_sebelumnya' => $child['saldo_audited_prev'] ?? 0,
                        'saldo_audited_sebelumnya2' => $child['saldo_audited_prev2'] ?? null,
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

        $teamRole = $user->roleInClient($form->klien_id);
        if ($teamRole !== 'anggota' || $form->pembuat_id !== $user->id) {
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
                'materialitas_keseluruhan' => $overall,
                'materialitas_kinerja' => $performance,
                'kesalahan_ditoleransi' => $tolerable,
                'data_bagian' => $validated['section_data'],
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
                            'sufiks' => $kodeLengkap ? substr($kodeLengkap, -2) : '',
                            'kode_lengkap' => $kodeLengkap,
                            'nama' => $nama,
                            'saldo_unaudited' => $inhouse,
                            'tcm_unaudited' => null,
                            'penyesuaian_debit' => 0,
                            'penyesuaian_kredit' => 0,
                            'referensi' => null,
                            'saldo_audited' => $inhouse,
                            'tcm_audited' => null,
                            'saldo_audited_sebelumnya' => 0,
                            'saldo_audited_sebelumnya2' => null,
                            'persen_materialitas' => $persen,
                            'status_materialitas' => $statusMat,
                        ]);
                    }
                }
            }
        } elseif ($form_type === 'C10') {
            $form->update([
                'data_bagian' => array_merge($form->data_bagian ?? [], [
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
                        'sufiks' => $child['suffix'] ?? '',
                        'kode_lengkap' => $child['kode_lengkap'] ?? '',
                        'nama' => $child['nama'] ?? '',
                        'saldo_unaudited' => $child['saldo_unaudited'] ?? 0,
                        'tcm_unaudited' => $child['tcm_unaudited'] ?? null,
                        'penyesuaian_debit' => $child['penyesuaian_debit'] ?? 0,
                        'penyesuaian_kredit' => $child['penyesuaian_kredit'] ?? 0,
                        'referensi' => $child['reff'] ?? null,
                        'saldo_audited' => $child['saldo_audited'] ?? 0,
                        'tcm_audited' => $child['tcm_audited'] ?? null,
                        'saldo_audited_sebelumnya' => $child['saldo_audited_prev'] ?? 0,
                        'saldo_audited_sebelumnya2' => $child['saldo_audited_prev2'] ?? null,
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

        $teamRole = $user->roleInClient($form->klien_id);
        if ($teamRole !== 'anggota' || $form->pembuat_id !== $user->id) {
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
            'alasan_penolakan' => null,
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

        $teamRole = $user->roleInClient($form->klien_id);
        if (!in_array($teamRole, ['ketua_tim', 'supervisor', 'partner'])) {
            abort(403, 'Hanya Ketua Tim, Supervisor, atau Partner yang dapat melakukan review.');
        }

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
                'alasan_penolakan' => $validated['reject_reason'],
                'penelaah_id' => $user->id,
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
                'penelaah_id' => $user->id,
            ]);
            return redirect()->route('dashboard')->with('success', 'Laporan disetujui Ketua Tim. Menunggu review Supervisor.');
        } elseif ($teamRole === 'supervisor') {
            if ($form->status !== 'pending_supervisor') {
                abort(400, 'Status laporan tidak valid untuk disetujui Supervisor.');
            }
            $form->update([
                'status' => 'pending_partner',
                'penelaah_id' => $user->id,
            ]);
            return redirect()->route('dashboard')->with('success', 'Laporan disetujui Supervisor. Menunggu review Partner.');
        } elseif ($teamRole === 'partner') {
            if ($form->status !== 'pending_partner') {
                abort(400, 'Status laporan tidak valid untuk disetujui Partner.');
            }
            $form->update([
                'status' => 'final_approved',
                'penyetuju_id' => $user->id,
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
            'nama' => strtoupper($request->name),
            'tahun_buku' => $request->book_year,
            'jadwal' => $request->schedule,
            'dibuat_oleh' => auth()->id(),
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
            'nama' => strtoupper($request->name),
            'tahun_buku' => $request->book_year,
            'jadwal' => $request->schedule,
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
            $client->users()->attach($member['user_id'], ['peran' => $member['role']]);
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

        $dbData = $c10D10->data_bagian ?? [];
        $d10Data = array_merge($defaultD10Data, $dbData);

        // Override database materiality values specifically if they are set in the model
        if ($c10D10->materialitas_keseluruhan !== null) {
            $d10Data['overall_materiality'] = (float)$c10D10->materialitas_keseluruhan;
        }
        if ($c10D10->materialitas_kinerja !== null) {
            $d10Data['performance_materiality'] = (float)$c10D10->materialitas_kinerja;
        }
        if ($c10D10->kesalahan_ditoleransi !== null) {
            $d10Data['tolerable_error'] = (float)$c10D10->kesalahan_ditoleransi;
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
                    'nominal' => $c10D10->materialitas_keseluruhan ? (float)round($c10D10->materialitas_keseluruhan * ($account->persen_materialitas / 100)) : 0,
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
