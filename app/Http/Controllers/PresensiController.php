<?php

namespace App\Http\Controllers;

use App\Models\Presensi;
use App\Models\PengajuanIzin;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Inertia\Inertia;

class PresensiController extends Controller
{
    /**
     * Display the main attendance screen.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $pegawaiId = $user->pegawai_id;

        if (!$pegawaiId) {
            return Inertia::render('Presensi/Index', [
                'error' => 'Akun user Anda tidak terhubung dengan data Pegawai.'
            ]);
        }

        $todayDate = Carbon::today('Asia/Jakarta')->toDateString();

        // 1. Get today's attendance record
        $todayPresensi = Presensi::where('pegawai_id', $pegawaiId)
            ->whereDate('tanggal', $todayDate)
            ->first();

        // If today has no record, check if there is an approved Izin/Sakit request covering today
        $approvedIzinSakitToday = PengajuanIzin::where('pegawai_id', $pegawaiId)
            ->where('status_approval', 'approved')
            ->whereDate('tanggal_mulai', '<=', $todayDate)
            ->whereDate('tanggal_selesai', '>=', $todayDate)
            ->first();

        // 2. Build attendance history for current user this month
        $startOfMonth = Carbon::now('Asia/Jakarta')->startOfMonth();
        $today = Carbon::today('Asia/Jakarta');

        $actualPresensi = Presensi::where('pegawai_id', $pegawaiId)
            ->whereMonth('tanggal', Carbon::now('Asia/Jakarta')->month)
            ->whereYear('tanggal', Carbon::now('Asia/Jakarta')->year)
            ->get()
            ->keyBy(function ($item) {
                return Carbon::parse($item->tanggal)->toDateString();
            });

        $personalHistory = [];
        $loopDate = clone $startOfMonth;

        while ($loopDate->lte($today)) {
            $dateStr = $loopDate->toDateString();
            if ($actualPresensi->has($dateStr)) {
                $record = $actualPresensi->get($dateStr);
                $personalHistory[] = [
                    'id' => $record->id,
                    'tanggal' => $dateStr,
                    'hari' => $loopDate->translatedFormat('l'),
                    'checkin_at' => $record->checkin_at ? $record->checkin_at->format('H:i') : null,
                    'checkout_at' => $record->checkout_at ? $record->checkout_at->format('H:i') : null,
                    'durasi_kerja' => $this->calculateWorkDuration($record->checkin_at, $record->checkout_at),
                    'status' => $record->status,
                    'is_late' => $record->status === 'hadir' && $record->checkin_at && Carbon::parse($record->checkin_at)->format('H:i:s') > '08:35:00',
                    'is_early' => $record->status === 'hadir' && $record->checkout_at && Carbon::parse($record->checkout_at)->format('H:i:s') < '16:30:00',
                ];
            } else {
                // Check if it's a weekday and in the past
                if ($loopDate->lt($today) && !$loopDate->isWeekend()) {
                    // Check if they had a pending permit request for this date (just to show it cleanly)
                    $pendingPermit = PengajuanIzin::where('pegawai_id', $pegawaiId)
                        ->where('status_approval', 'pending')
                        ->whereDate('tanggal_mulai', '<=', $dateStr)
                        ->whereDate('tanggal_selesai', '>=', $dateStr)
                        ->first();

                    $personalHistory[] = [
                        'id' => null,
                        'tanggal' => $dateStr,
                        'hari' => $loopDate->translatedFormat('l'),
                        'checkin_at' => null,
                        'checkout_at' => null,
                        'durasi_kerja' => '-',
                        'status' => $pendingPermit ? 'pending_izin' : 'alpha',
                        'is_late' => false,
                        'is_early' => false,
                    ];
                }
            }
            $loopDate->addDay();
        }

        // Sort descending
        usort($personalHistory, function ($a, $b) {
            return strcmp($b['tanggal'], $a['tanggal']);
        });

        // 3. Personal permit requests list
        $myPermits = PengajuanIzin::where('pegawai_id', $pegawaiId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'tanggal_mulai' => Carbon::parse($item->tanggal_mulai)->toDateString(),
                    'tanggal_selesai' => Carbon::parse($item->tanggal_selesai)->toDateString(),
                    'tipe' => $item->tipe,
                    'keterangan' => $item->keterangan,
                    'dokumen' => $item->dokumen ? Storage::url($item->dokumen) : null,
                    'status_approval' => $item->status_approval,
                ];
            });

        // 4. Admin & Partner Dashboard Data
        $monitoringData = [];
        $pendingApprovals = [];
        $allPermits = [];
        $pegawaiList = [];
        $stats = [];
        $selectedDate = $request->input('date', $todayDate);

        if (in_array($user->role, ['admin', 'partner'])) {
            $pegawaiList = Pegawai::where('status', 'aktif')->orderBy('name', 'asc')->get();

            // Load daily attendance records for the selected date
            $dailyPresensi = Presensi::whereDate('tanggal', $selectedDate)
                ->get()
                ->keyBy('pegawai_id');

            $totalActive = Pegawai::where('status', 'aktif')->count();
            $totalHadir = 0;
            $totalDinasLuar = 0;
            $totalSakit = 0;
            $totalIzin = 0;
            $totalTerlambat = 0;
            $totalAlpha = 0;

            foreach ($pegawaiList as $p) {
                $record = $dailyPresensi->get($p->id);
                $status = 'belum_absen';
                $checkin = null;
                $checkout = null;
                $durasi = '-';
                $isLate = false;
                $isEarly = false;

                if ($record) {
                    $status = $record->status;
                    $checkin = $record->checkin_at ? $record->checkin_at->format('H:i') : null;
                    $checkout = $record->checkout_at ? $record->checkout_at->format('H:i') : null;
                    $durasi = $this->calculateWorkDuration($record->checkin_at, $record->checkout_at);
                    
                    if ($status === 'hadir') {
                        $totalHadir++;
                        if ($record->checkin_at && $record->checkin_at->format('H:i:s') > '08:35:00') {
                            $isLate = true;
                            $totalTerlambat++;
                        }
                        if ($record->checkout_at && $record->checkout_at->format('H:i:s') < '16:30:00') {
                            $isEarly = true;
                        }
                    } elseif ($status === 'dinas_luar') {
                        $totalDinasLuar++;
                    } elseif ($status === 'sakit') {
                        $totalSakit++;
                    } elseif ($status === 'izin') {
                        $totalIzin++;
                    } elseif ($status === 'alpha') {
                        $totalAlpha++;
                    }
                } else {
                    // Check weekend or weekday
                    $selCarbon = Carbon::parse($selectedDate);
                    if ($selCarbon->lt($today) && !$selCarbon->isWeekend()) {
                        $status = 'alpha';
                        $totalAlpha++;
                    } elseif ($selCarbon->isWeekend()) {
                        $status = 'libur';
                    }
                }

                $monitoringData[] = [
                    'pegawai_id' => $p->id,
                    'name' => $p->name,
                    'inisial' => $p->inisial,
                    'jabatan' => $p->jabatan,
                    'status' => $status,
                    'checkin_at' => $checkin,
                    'checkout_at' => $checkout,
                    'durasi_kerja' => $durasi,
                    'is_late' => $isLate,
                    'is_early' => $isEarly,
                ];
            }

            $stats = [
                'total_pegawai' => $totalActive,
                'total_hadir' => $totalHadir,
                'total_dinas_luar' => $totalDinasLuar,
                'total_sakit_izin' => $totalSakit + $totalIzin,
                'total_terlambat' => $totalTerlambat,
                'total_alpha' => $totalAlpha,
            ];

            // Permits pending approval (Partners process approval)
            $pendingApprovals = PengajuanIzin::with('pegawai')
                ->where('status_approval', 'pending')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'pegawai_id' => $item->pegawai_id,
                        'name' => $item->pegawai->name,
                        'tanggal_mulai' => Carbon::parse($item->tanggal_mulai)->toDateString(),
                        'tanggal_selesai' => Carbon::parse($item->tanggal_selesai)->toDateString(),
                        'tipe' => $item->tipe,
                        'keterangan' => $item->keterangan,
                        'dokumen' => $item->dokumen ? Storage::url($item->dokumen) : null,
                        'status_approval' => $item->status_approval,
                    ];
                });

            // All permits for list
            $allPermits = PengajuanIzin::with(['pegawai', 'approver'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'pegawai_name' => $item->pegawai->name,
                        'tanggal_mulai' => Carbon::parse($item->tanggal_mulai)->toDateString(),
                        'tanggal_selesai' => Carbon::parse($item->tanggal_selesai)->toDateString(),
                        'tipe' => $item->tipe,
                        'keterangan' => $item->keterangan,
                        'dokumen' => $item->dokumen ? Storage::url($item->dokumen) : null,
                        'status_approval' => $item->status_approval,
                        'approved_by_name' => $item->approver?->name,
                    ];
                });
        }

        return Inertia::render('Presensi/Index', [
            'todayPresensi' => $todayPresensi ? [
                'id' => $todayPresensi->id,
                'tanggal' => Carbon::parse($todayPresensi->tanggal)->toDateString(),
                'checkin_at' => $todayPresensi->checkin_at ? $todayPresensi->checkin_at->format('H:i') : null,
                'checkout_at' => $todayPresensi->checkout_at ? $todayPresensi->checkout_at->format('H:i') : null,
                'status' => $todayPresensi->status,
            ] : null,
            'approvedIzinSakitToday' => $approvedIzinSakitToday ? [
                'tipe' => $approvedIzinSakitToday->tipe,
                'keterangan' => $approvedIzinSakitToday->keterangan,
            ] : null,
            'personalHistory' => $personalHistory,
            'myPermits' => $myPermits,
            'monitoringData' => $monitoringData,
            'pendingApprovals' => $pendingApprovals,
            'allPermits' => $allPermits,
            'pegawaiList' => $pegawaiList,
            'stats' => $stats,
            'selectedDate' => $selectedDate,
            'currentRole' => $user->role,
        ]);
    }

    /**
     * Handle Check-In.
     */
    public function checkIn(Request $request)
    {
        $user = Auth::user();
        $pegawaiId = $user->pegawai_id;

        if (!$pegawaiId) {
            return back()->withErrors(['error' => 'Akun Anda tidak terhubung dengan data Pegawai.']);
        }

        $now = Carbon::now('Asia/Jakarta');
        $todayDate = $now->toDateString();

        // Check if already checked in
        $presensi = Presensi::where('pegawai_id', $pegawaiId)
            ->whereDate('tanggal', $todayDate)
            ->first();

        if ($presensi && $presensi->checkin_at !== null) {
            return back()->withErrors(['error' => 'Anda sudah melakukan Check-In hari ini.']);
        }

        // Check if there is pre-assigned Dinas Luar
        if ($presensi && $presensi->status === 'dinas_luar') {
            $presensi->checkin_at = $now;
            $presensi->save();
        } else {
            // Check if there is approved permit for today
            $approvedIzinSakit = PengajuanIzin::where('pegawai_id', $pegawaiId)
                ->where('status_approval', 'approved')
                ->whereDate('tanggal_mulai', '<=', $todayDate)
                ->whereDate('tanggal_selesai', '>=', $todayDate)
                ->first();

            if ($approvedIzinSakit) {
                return back()->withErrors(['error' => 'Hari ini Anda berstatus ' . ucfirst($approvedIzinSakit->tipe) . '. Tidak perlu Check-In.']);
            }

            // Normal office Check-In
            Presensi::create([
                'pegawai_id' => $pegawaiId,
                'tanggal' => $todayDate,
                'checkin_at' => $now,
                'status' => 'hadir',
            ]);
        }

        return back()->with('success', 'Check-In berhasil dicatat pada jam ' . $now->format('H:i') . '.');
    }

    /**
     * Handle Check-Out.
     */
    public function checkOut(Request $request)
    {
        $user = Auth::user();
        $pegawaiId = $user->pegawai_id;

        if (!$pegawaiId) {
            return back()->withErrors(['error' => 'Akun Anda tidak terhubung dengan data Pegawai.']);
        }

        $now = Carbon::now('Asia/Jakarta');
        $todayDate = $now->toDateString();

        $presensi = Presensi::where('pegawai_id', $pegawaiId)
            ->whereDate('tanggal', $todayDate)
            ->first();

        if (!$presensi || $presensi->checkin_at === null) {
            return back()->withErrors(['error' => 'Anda harus melakukan Check-In terlebih dahulu.']);
        }

        if ($presensi->checkout_at !== null) {
            return back()->withErrors(['error' => 'Anda sudah melakukan Check-Out hari ini.']);
        }

        $presensi->checkout_at = $now;
        $presensi->save();

        return back()->with('success', 'Check-Out berhasil dicatat pada jam ' . $now->format('H:i') . '.');
    }

    /**
     * Submit permit request (Izin/Sakit).
     */
    public function submitIzinSakit(Request $request)
    {
        $user = Auth::user();
        $pegawaiId = $user->pegawai_id;

        if (!$pegawaiId) {
            return back()->withErrors(['error' => 'Akun Anda tidak terhubung dengan data Pegawai.']);
        }

        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'tipe' => 'required|in:sakit,izin',
            'keterangan' => 'required|string',
            'dokumen' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $path = $request->file('dokumen')->store('izin_sakit_docs', 'public');

        PengajuanIzin::create([
            'pegawai_id' => $pegawaiId,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'tipe' => $request->tipe,
            'keterangan' => $request->keterangan,
            'dokumen' => $path,
            'status_approval' => 'pending',
        ]);

        return back()->with('success', 'Pengajuan ' . ucfirst($request->tipe) . ' berhasil dikirim dan menunggu persetujuan Partner.');
    }

    /**
     * Assign Dinas Luar status to an employee for a specific date. (Admin/Partner only)
     */
    public function assignDinasLuar(Request $request)
    {
        $request->validate([
            'pegawai_id' => 'required|exists:pegawai,id',
            'tanggal' => 'required|date',
        ]);

        // Check if there is an existing record
        $existing = Presensi::where('pegawai_id', $request->pegawai_id)
            ->whereDate('tanggal', $request->tanggal)
            ->first();

        if ($existing && $existing->checkin_at !== null) {
            return back()->withErrors(['error' => 'Pegawai sudah melakukan check-in pada hari tersebut.']);
        }

        Presensi::updateOrCreate(
            ['pegawai_id' => $request->pegawai_id, 'tanggal' => $request->tanggal],
            ['status' => 'dinas_luar']
        );

        return back()->with('success', 'Pegawai berhasil ditugaskan Dinas Luar.');
    }

    /**
     * Approve permit request. (Partner only)
     */
    public function approveIzinSakit(PengajuanIzin $pengajuan)
    {
        $user = Auth::user();
        
        // Only Partner can approve
        if ($user->role !== 'partner' && $user->role !== 'admin') {
            return back()->withErrors(['error' => 'Hanya Partner atau Admin yang dapat menyetujui pengajuan izin/sakit.']);
        }

        if ($pengajuan->status_approval !== 'pending') {
            return back()->withErrors(['error' => 'Pengajuan ini sudah diproses.']);
        }

        $pengajuan->status_approval = 'approved';
        $pengajuan->approved_by = $user->pegawai_id;
        $pengajuan->save();

        // Automatically populate daily presensi records
        $start = Carbon::parse($pengajuan->tanggal_mulai);
        $end = Carbon::parse($pengajuan->tanggal_selesai);

        while ($start->lte($end)) {
            $dateStr = $start->toDateString();
            
            // Check if record exists
            $existing = Presensi::where('pegawai_id', $pengajuan->pegawai_id)
                ->whereDate('tanggal', $dateStr)
                ->first();

            // Only overwrite if not checked-in
            if (!$existing || $existing->checkin_at === null) {
                Presensi::updateOrCreate(
                    ['pegawai_id' => $pengajuan->pegawai_id, 'tanggal' => $dateStr],
                    [
                        'status' => $pengajuan->tipe,
                        'pengajuan_izin_id' => $pengajuan->id,
                        'checkin_at' => null,
                        'checkout_at' => null,
                    ]
                );
            }
            $start->addDay();
        }

        return back()->with('success', 'Pengajuan berhasil disetujui.');
    }

    /**
     * Reject permit request. (Partner only)
     */
    public function rejectIzinSakit(PengajuanIzin $pengajuan)
    {
        $user = Auth::user();
        
        if ($user->role !== 'partner' && $user->role !== 'admin') {
            return back()->withErrors(['error' => 'Hanya Partner atau Admin yang dapat menolak pengajuan izin/sakit.']);
        }

        if ($pengajuan->status_approval !== 'pending') {
            return back()->withErrors(['error' => 'Pengajuan ini sudah diproses.']);
        }

        $pengajuan->status_approval = 'rejected';
        $pengajuan->approved_by = $user->pegawai_id;
        $pengajuan->save();

        return back()->with('success', 'Pengajuan telah ditolak.');
    }

    /**
     * Helper: calculate duration between check-in and check-out.
     */
    private function calculateWorkDuration($checkin, $checkout)
    {
        if (!$checkin || !$checkout) {
            return '-';
        }

        $diff = $checkin->diff($checkout);
        
        $hours = $diff->h;
        $minutes = $diff->i;

        $parts = [];
        if ($hours > 0) {
            $parts[] = $hours . ' Jam';
        }
        if ($minutes > 0 || empty($parts)) {
            $parts[] = $minutes . ' Menit';
        }

        return implode(' ', $parts);
    }
}
