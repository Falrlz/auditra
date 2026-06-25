<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    /**
     * Store a newly created user in storage (Admin only).
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', 'min:8'],
            'role' => 'required|string|in:admin,partner,manager,staff',
            'inisial' => 'required|string|max:10',
        ]);

        // Create pegawai record
        $pegawai = Pegawai::create([
            'name' => $request->name,
            'jabatan' => $request->role,
            'inisial' => strtoupper($request->inisial),
            'status' => 'aktif',
        ]);

        // Create user record
        User::create([
            'pegawai_id' => $pegawai->id,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()->with('success', 'User registered successfully.');
    }

    /**
     * Update the specified user in storage (Admin only).
     */
    public function update(Request $request, User $user)
    {
        // For unique validation of inisial, we check the pegawai associated with this user
        $pegawaiId = $user->pegawai_id;

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'string', 'min:8'],
            'role' => 'required|string|in:admin,partner,manager,staff',
            'inisial' => 'required|string|max:10|unique:pegawai,inisial,' . $pegawaiId,
        ]);

        // Update pegawai record
        if ($user->pegawai) {
            $user->pegawai->update([
                'name' => $request->name,
                'jabatan' => $request->role,
                'inisial' => strtoupper($request->inisial),
            ]);
        }

        // Update user record
        $userData = [
            'email' => $request->email,
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        return redirect()->back()->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified user from storage (Admin only).
     */
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        // Soft delete both user and associated pegawai
        $pegawai = $user->pegawai;
        $user->delete();
        if ($pegawai) {
            $pegawai->delete();
        }

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }
}
