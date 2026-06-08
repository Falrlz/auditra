<?php

namespace App\Http\Controllers;

use App\Models\AuditForm;
use App\Services\OdsParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
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
        $formsQuery = AuditForm::query();

        if ($user->isAnggota()) {
            $formsQuery->where('preparer_id', $user->id);
        } elseif ($user->isKetuaTim()) {
            // Ketua Tim can see all submitted forms, approved forms, or rejected forms
            $formsQuery->whereIn('status', ['pending_approval', 'approved_by_leader', 'approved', 'rejected']);
        } elseif ($user->isSupervisor()) {
            // Supervisor sees forms approved by Ketua Tim or fully approved
            $formsQuery->whereIn('status', ['approved_by_leader', 'approved']);
        }

        $forms = $formsQuery->with(['preparer', 'reviewer', 'approver'])->latest()->get();

        return Inertia::render('Dashboard', [
            'forms' => $forms,
            'auth' => [
                'user' => $user
            ]
        ]);
    }

    /**
     * Show a single audit form.
     */
    public function show(AuditForm $auditForm)
    {
        $user = Auth::user();

        // Check permission
        if ($user->isAnggota() && $auditForm->preparer_id !== $user->id) {
            abort(403, 'Unauthorized.');
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
        if (!$user->isAnggota()) {
            abort(403, 'Only Anggota can create forms.');
        }

        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'book_year' => 'required|string|max:255',
            'schedule' => 'required|string|max:255',
            'section_data' => 'required|array',
        ]);

        $form = AuditForm::create([
            'client_name' => $validated['client_name'],
            'book_year' => $validated['book_year'],
            'schedule' => $validated['schedule'],
            'status' => 'draft',
            'section_data' => $validated['section_data'],
            'preparer_id' => $user->id,
        ]);

        return redirect()->route('dashboard')->with('success', 'Form draft created successfully.');
    }

    /**
     * Update an existing audit form.
     */
    public function update(Request $request, AuditForm $auditForm)
    {
        $user = Auth::user();
        if ($user->isAnggota()) {
            if ($auditForm->preparer_id !== $user->id) {
                abort(403, 'Unauthorized.');
            }
            if (!in_array($auditForm->status, ['draft', 'rejected'])) {
                abort(400, 'Cannot edit submitted forms.');
            }
        } else {
            abort(403, 'Only Anggota can edit forms.');
        }

        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'book_year' => 'required|string|max:255',
            'schedule' => 'required|string|max:255',
            'section_data' => 'required|array',
        ]);

        $auditForm->update([
            'client_name' => $validated['client_name'],
            'book_year' => $validated['book_year'],
            'schedule' => $validated['schedule'],
            'section_data' => $validated['section_data'],
        ]);

        return redirect()->route('dashboard')->with('success', 'Form updated successfully.');
    }

    /**
     * Submit form for Ketua Tim review.
     */
    public function submit(AuditForm $auditForm)
    {
        $user = Auth::user();
        if (!$user->isAnggota() || $auditForm->preparer_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }

        if (!in_array($auditForm->status, ['draft', 'rejected'])) {
            abort(400, 'Form is already submitted.');
        }

        $auditForm->update([
            'status' => 'pending_approval',
            'reject_reason' => null,
        ]);

        return redirect()->route('dashboard')->with('success', 'Form submitted to Ketua Tim.');
    }

    /**
     * Review form (Approve or Reject by Ketua Tim).
     */
    public function review(Request $request, AuditForm $auditForm)
    {
        $user = Auth::user();
        if (!$user->isKetuaTim()) {
            abort(403, 'Only Ketua Tim can review forms.');
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'reject_reason' => 'required_if:action,reject|nullable|string',
        ]);

        if ($validated['action'] === 'approve') {
            $auditForm->update([
                'status' => 'approved_by_leader',
                'reviewer_id' => $user->id,
            ]);
            return redirect()->route('dashboard')->with('success', 'Form approved and forwarded to Supervisor.');
        } else {
            $auditForm->update([
                'status' => 'rejected',
                'reject_reason' => $validated['reject_reason'],
                'reviewer_id' => $user->id,
            ]);
            return redirect()->route('dashboard')->with('success', 'Form rejected and sent back to Anggota.');
        }
    }

    /**
     * Supervisor Approve.
     */
    public function approveSupervisor(AuditForm $auditForm)
    {
        $user = Auth::user();
        if (!$user->isSupervisor()) {
            abort(403, 'Only Supervisor can approve forms.');
        }

        if ($auditForm->status !== 'approved_by_leader') {
            abort(400, 'Form is not approved by Ketua Tim yet.');
        }

        $auditForm->update([
            'status' => 'approved',
            'approver_id' => $user->id,
        ]);

        return redirect()->route('dashboard')->with('success', 'Form fully approved.');
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
                'client_name' => 'PT EASTPARC HOTEL TBK',
                'book_year' => '31 Desember 2024',
                'schedule' => 'Pre-Engagement (Analisi Penerimaan Dan Keberlanjutan Hubungan Dengan Klien)',
                'section_data' => $structuredData
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

}
