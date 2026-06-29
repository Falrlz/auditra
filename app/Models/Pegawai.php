<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Pegawai extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pegawai';

    protected $fillable = [
        'name',
        'jabatan',
        'inisial',
        'telp',
        'alamat',
        'cv',
        'status',
    ];

    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'pegawai_id');
    }

    public function timPerikatans(): HasMany
    {
        return $this->hasMany(TimPerikatan::class, 'pegawai_id');
    }

    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'tim_perikatan', 'pegawai_id', 'client_id')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    public function presensiPelatihans(): HasMany
    {
        return $this->hasMany(PresensiPelatihan::class, 'pegawai_id');
    }
}
