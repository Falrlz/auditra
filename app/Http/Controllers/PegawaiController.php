<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use Illuminate\Http\Request;

class PegawaiController extends Controller
{
    /**
     * Store a newly created pegawai in storage (Admin only).
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'jabatan' => 'required|string|in:admin,partner,manager,staff',
            'inisial' => 'required|string|max:10|unique:pegawai,inisial',
            'telp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'cv' => 'nullable|string',
        ]);

        Pegawai::create([
            'name' => $request->name,
            'jabatan' => $request->jabatan,
            'inisial' => strtoupper($request->inisial),
            'telp' => $request->telp,
            'alamat' => $request->alamat,
            'cv' => $request->cv,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Pegawai berhasil ditambahkan dan menunggu persetujuan Partner.');
    }

    /**
     * Update the specified pegawai in storage (Admin only).
     */
    public function update(Request $request, Pegawai $pegawai)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'jabatan' => 'required|string|in:admin,partner,manager,staff',
            'inisial' => 'required|string|max:10|unique:pegawai,inisial,' . $pegawai->id,
            'telp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'cv' => 'nullable|string',
            'status' => 'required|string|in:aktif,cuti,nonaktif',
        ]);

        $pegawai->update([
            'name' => $request->name,
            'jabatan' => $request->jabatan,
            'inisial' => strtoupper($request->inisial),
            'telp' => $request->telp,
            'alamat' => $request->alamat,
            'cv' => $request->cv,
            'status' => $request->status,
        ]);

        return redirect()->back()->with('success', 'Pegawai berhasil diperbarui.');
    }

    /**
     * Remove the specified pegawai from storage (Admin only).
     */
    public function destroy(Pegawai $pegawai)
    {
        // If this pegawai is linked to the currently logged in user, prevent deletion
        if ($pegawai->user && $pegawai->user->id === auth()->id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus data pegawai Anda sendiri.');
        }

        // Soft delete the pegawai and the linked user (if any)
        if ($pegawai->user) {
            $pegawai->user->delete();
        }

        $pegawai->delete();

        return redirect()->back()->with('success', 'Pegawai berhasil dihapus.');
    }

    /**
     * Approve the specified pending pegawai (Partner only).
     */
    public function approve(Pegawai $pegawai)
    {
        if ($pegawai->status !== 'pending') {
            return redirect()->back()->with('error', 'Pegawai ini tidak dalam status pending.');
        }

        $pegawai->update([
            'status' => 'aktif'
        ]);

        if ($pegawai->user) {
            $pegawai->user->update([
                'is_active' => true
            ]);
        }

        return redirect()->back()->with('success', "Pegawai {$pegawai->name} berhasil disetujui.");
    }

    /**
     * Reject the specified pending pegawai (Partner only).
     */
    public function reject(Pegawai $pegawai)
    {
        if ($pegawai->status !== 'pending') {
            return redirect()->back()->with('error', 'Pegawai ini tidak dalam status pending.');
        }

        if ($pegawai->user) {
            $pegawai->user->forceDelete();
        }

        $pegawai->forceDelete();

        return redirect()->back()->with('success', "Pegawai berhasil ditolak dan dihapus.");
    }
}
