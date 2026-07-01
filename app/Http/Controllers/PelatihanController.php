<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\Pelatihan;
use App\Models\PresensiPelatihan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PelatihanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $pegawai = $user->pegawai;
        $role = $user->role;

        $props = [
            'auth' => [
                'user' => $user,
            ],
            'activeTab' => $request->query('tab'),
        ];

        // Load participation items for the logged-in pegawai (if exists)
        if ($pegawai) {
            $props['availablePelatihans'] = Pelatihan::with(['creator'])
                ->where('status', 'disetujui')
                ->where('akhir', '>=', now())
                ->orderBy('mulai', 'asc')
                ->get()
                ->map(function ($pelatihan) use ($pegawai) {
                    $hasPresensi = PresensiPelatihan::where('pelatihan_id', $pelatihan->id)
                        ->where('pegawai_id', $pegawai->id)
                        ->first();
                    $pelatihan->has_presensi = $hasPresensi ? true : false;
                    $pelatihan->presensi_status = $hasPresensi ? $hasPresensi->status : null;
                    return $pelatihan;
                });

            $props['personalHistory'] = PresensiPelatihan::with('pelatihan')
                ->where('pegawai_id', $pegawai->id)
                ->get()
                ->map(function ($presensi) {
                    return [
                        'id' => $presensi->id,
                        'pelatihan' => $presensi->pelatihan,
                        'status' => $presensi->status,
                        'checkin_at' => $presensi->checkin_at,
                        'tanggal' => $presensi->tanggal,
                        'skp' => $presensi->status === 'hadir' && $presensi->pelatihan?->status === 'selesai' ? $presensi->pelatihan->skp : 0,
                    ];
                });

            $props['accumulatedSkp'] = Pelatihan::where('status', 'selesai')
                ->whereHas('presensiPelatihans', function ($query) use ($pegawai) {
                    $query->where('pegawai_id', $pegawai->id)
                          ->where('status', 'hadir');
                })
                ->sum('skp');
        } else {
            $props['availablePelatihans'] = [];
            $props['personalHistory'] = [];
            $props['accumulatedSkp'] = 0;
        }

        if ($role === 'admin' || $role === 'partner') {
            // Load all training items
            $props['pelatihans'] = Pelatihan::with(['creator', 'approver', 'presensiPelatihans.pegawai'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Also send active pegawai for listing/history reporting
            $props['pegawaiList'] = Pegawai::where('status', 'aktif')
                ->whereIn('jabatan', ['staff', 'manager'])
                ->with(['presensiPelatihans.pelatihan'])
                ->orderBy('name', 'asc')
                ->get();
        }

        return Inertia::render('Pelatihan/Index', $props);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'kegiatan' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'skp' => 'required|integer|min:1',
            'mulai' => 'required|date|after_or_equal:today',
            'akhir' => 'required|date|after:mulai',
        ]);

        Pelatihan::create([
            'kegiatan' => $request->kegiatan,
            'deskripsi' => $request->deskripsi,
            'skp' => $request->skp,
            'mulai' => Carbon::parse($request->mulai),
            'akhir' => Carbon::parse($request->akhir),
            'status' => 'draft',
            'created_by' => Auth::user()->pegawai_id,
        ]);

        return redirect()->route('pelatihan.index')->with('success', 'Draft pelatihan berhasil dibuat.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Pelatihan $pelatihan)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        if (!in_array($pelatihan->status, ['draft', 'ditolak'])) {
            abort(403, 'Pelatihan yang sudah diajukan atau disetujui tidak dapat diubah.');
        }

        $request->validate([
            'kegiatan' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'skp' => 'required|integer|min:1',
            'mulai' => 'required|date',
            'akhir' => 'required|date|after:mulai',
        ]);

        $pelatihan->update([
            'kegiatan' => $request->kegiatan,
            'deskripsi' => $request->deskripsi,
            'skp' => $request->skp,
            'mulai' => Carbon::parse($request->mulai),
            'akhir' => Carbon::parse($request->akhir),
            'status' => 'draft', // Reset to draft if previously rejected
        ]);

        return redirect()->route('pelatihan.index')->with('success', 'Pelatihan berhasil diubah.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pelatihan $pelatihan)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        if (!in_array($pelatihan->status, ['draft', 'ditolak'])) {
            abort(403, 'Hanya draft pelatihan yang dapat dihapus.');
        }

        $pelatihan->delete();

        return redirect()->route('pelatihan.index')->with('success', 'Pelatihan berhasil dihapus.');
    }

    /**
     * Submit training for Partner approval.
     */
    public function submit(Pelatihan $pelatihan)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        if (!in_array($pelatihan->status, ['draft', 'ditolak'])) {
            abort(403, 'Pelatihan tidak dalam status draft.');
        }

        $pelatihan->update([
            'status' => 'menunggu_persetujuan'
        ]);

        return redirect()->route('pelatihan.index')->with('success', 'Pelatihan berhasil diajukan untuk persetujuan.');
    }

    /**
     * Approve training.
     */
    public function approve(Pelatihan $pelatihan)
    {
        if (Auth::user()->role !== 'partner') {
            abort(403, 'Unauthorized action.');
        }

        if ($pelatihan->status !== 'menunggu_persetujuan') {
            abort(403, 'Pelatihan tidak sedang menunggu persetujuan.');
        }

        $pelatihan->update([
            'status' => 'disetujui',
            'approved_by' => Auth::user()->pegawai_id,
            'reject_reason' => null,
        ]);

        return redirect()->route('pelatihan.index')->with('success', 'Pelatihan berhasil disetujui.');
    }

    /**
     * Reject training.
     */
    public function reject(Request $request, Pelatihan $pelatihan)
    {
        if (Auth::user()->role !== 'partner') {
            abort(403, 'Unauthorized action.');
        }

        if ($pelatihan->status !== 'menunggu_persetujuan') {
            abort(403, 'Pelatihan tidak sedang menunggu persetujuan.');
        }

        $request->validate([
            'reject_reason' => 'required|string|min:5|max:1000',
        ]);

        $pelatihan->update([
            'status' => 'ditolak',
            'approved_by' => Auth::user()->pegawai_id,
            'reject_reason' => $request->reject_reason,
        ]);

        return redirect()->route('pelatihan.index')->with('success', 'Pelatihan berhasil ditolak.');
    }

    /**
     * Mark training as completed and auto-compile presence logic.
     */
    public function finish(Pelatihan $pelatihan)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        if ($pelatihan->status !== 'disetujui') {
            abort(403, 'Hanya pelatihan yang sudah disetujui yang dapat diselesaikan.');
        }

        $pelatihan->update([
            'status' => 'selesai'
        ]);

        // Auto-assign alpha status to active pegawai (staff/manager) who did not present
        $activePegawais = Pegawai::where('status', 'aktif')
            ->whereIn('jabatan', ['staff', 'manager'])
            ->get();

        foreach ($activePegawais as $peg) {
            $hasPresensi = PresensiPelatihan::where('pelatihan_id', $pelatihan->id)
                ->where('pegawai_id', $peg->id)
                ->exists();

            if (!$hasPresensi) {
                PresensiPelatihan::create([
                    'pegawai_id' => $peg->id,
                    'pelatihan_id' => $pelatihan->id,
                    'tanggal' => $pelatihan->mulai->toDateString(),
                    'checkin_at' => null,
                    'checkout_at' => null,
                    'status' => 'alpha',
                ]);
            }
        }

        return redirect()->route('pelatihan.index')->with('success', 'Pelatihan telah selesai dan presensi direkap.');
    }

    /**
     * Show presence form for employee.
     */
    public function showPresensiByToken($token)
    {
        $pelatihan = Pelatihan::where('presence_token', $token)->firstOrFail();

        if ($pelatihan->status !== 'disetujui') {
            abort(403, 'Pendaftaran presensi tidak aktif untuk pelatihan ini.');
        }

        $now = now();
        $isOpen = $now >= $pelatihan->mulai && $now <= $pelatihan->akhir;

        $pegawaiId = Auth::user()->pegawai_id;
        $existingPresensi = PresensiPelatihan::where('pelatihan_id', $pelatihan->id)
            ->where('pegawai_id', $pegawaiId)
            ->first();

        return Inertia::render('Pelatihan/Presensi', [
            'pelatihan' => $pelatihan,
            'isOpen' => $isOpen,
            'alreadyRecorded' => $existingPresensi ? true : false,
            'presensiStatus' => $existingPresensi ? $existingPresensi->status : null,
        ]);
    }

    /**
     * Record employee presence.
     */
    public function recordPresensiByToken(Request $request, $token)
    {
        $pelatihan = Pelatihan::where('presence_token', $token)->firstOrFail();

        if ($pelatihan->status !== 'disetujui') {
            return back()->withErrors(['error' => 'Pendaftaran presensi tidak aktif untuk pelatihan ini.']);
        }

        $now = now();
        if ($now < $pelatihan->mulai || $now > $pelatihan->akhir) {
            return back()->withErrors(['error' => 'Presensi hanya dapat diisi pada jam mulai hingga selesai pelatihan.']);
        }

        $pegawaiId = Auth::user()->pegawai_id;
        $existing = PresensiPelatihan::where('pelatihan_id', $pelatihan->id)
            ->where('pegawai_id', $pegawaiId)
            ->first();

        if ($existing) {
            return back()->withErrors(['error' => 'Anda sudah mencatatkan kehadiran untuk pelatihan ini.']);
        }

        PresensiPelatihan::create([
            'pegawai_id' => $pegawaiId,
            'pelatihan_id' => $pelatihan->id,
            'tanggal' => $now->toDateString(),
            'checkin_at' => $now,
            'checkout_at' => null,
            'status' => 'hadir',
        ]);

        return back()->with('success', 'Kehadiran berhasil dicatat.');
    }

    /**
     * Show scan presence page.
     */
    public function showScanPage()
    {
        return Inertia::render('Pelatihan/Scan');
    }
}
