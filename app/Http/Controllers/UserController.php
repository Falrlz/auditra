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
        if ($request->filled('pegawai_id')) {
            $request->validate([
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => ['required', 'string', 'min:8'],
                'pegawai_id' => 'required|exists:pegawai,id|unique:users,pegawai_id',
            ]);

            User::create([
                'pegawai_id' => $request->pegawai_id,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);
        } else {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => ['required', 'string', 'min:8'],
                'role' => 'required|string|in:admin,partner,manager,staff',
                'inisial' => 'required|string|max:10|unique:pegawai,inisial',
            ]);

            // Create pegawai record
            $pegawai = Pegawai::create([
                'name' => $request->name,
                'jabatan' => $request->role,
                'inisial' => strtoupper($request->inisial),
                'status' => 'pending',
            ]);

            // Create user record
            User::create([
                'pegawai_id' => $pegawai->id,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => false,
            ]);
        }

        return redirect()->back()->with('success', 'User registered successfully.');
    }

    /**
     * Update the specified user in storage (Admin only).
     */
    public function update(Request $request, User $user)
    {
        $pegawaiId = $user->pegawai_id;

        $request->validate([
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => 'nullable|boolean',
            'name' => 'nullable|string|max:255',
            'role' => 'nullable|string|in:admin,partner,manager,staff',
            'inisial' => 'nullable|string|max:10|unique:pegawai,inisial,' . $pegawaiId,
        ]);

        // Update pegawai record if details are provided (backward compatibility)
        if ($user->pegawai) {
            $pegawaiData = [];
            if ($request->filled('name')) {
                $pegawaiData['name'] = $request->name;
            }
            if ($request->filled('role')) {
                $pegawaiData['jabatan'] = $request->role;
            }
            if ($request->filled('inisial')) {
                $pegawaiData['inisial'] = strtoupper($request->inisial);
            }
            if (!empty($pegawaiData)) {
                $user->pegawai->update($pegawaiData);
            }
        }

        // Update user record
        $userData = [
            'email' => $request->email,
        ];

        if ($request->has('is_active')) {
            $userData['is_active'] = (bool)$request->is_active;
        }

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        return redirect()->back()->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status of the user (Admin only).
     */
    public function toggleStatus(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        $user->update([
            'is_active' => !$user->is_active
        ]);

        $statusStr = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "User berhasil {$statusStr}.");
    }

    /**
     * Remove the specified user from storage (Admin only).
     */
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        // Soft delete user only (does not delete associated pegawai)
        $user->delete();

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }
}
