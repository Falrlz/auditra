<?php

namespace App\Models;

use Database\Factories\ClientFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    /** @use HasFactory<ClientFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'book_year',
        'schedule',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(Pegawai::class, 'created_by');
    }

    public function a10(): HasOneThrough
    {
        return $this->hasOneThrough(A10::class, TimPerikatan::class, 'client_id', 'tim_perikatan_id');
    }

    public function c10D10(): HasOneThrough
    {
        return $this->hasOneThrough(C10D10::class, TimPerikatan::class, 'client_id', 'tim_perikatan_id');
    }

    public function timPerikatans(): HasMany
    {
        return $this->hasMany(TimPerikatan::class, 'client_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tim_perikatan', 'client_id', 'pegawai_id', 'id', 'pegawai_id')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    public function pegawais(): BelongsToMany
    {
        return $this->belongsToMany(Pegawai::class, 'tim_perikatan', 'client_id', 'pegawai_id')
                    ->withPivot('role')
                    ->withTimestamps();
    }
}