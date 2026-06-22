<?php

namespace App\Models;

use Database\Factories\ClientFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    /** @use HasFactory<ClientFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nama',
        'tahun_buku',
        'jadwal',
        'dibuat_oleh',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function a10()
    {
        return $this->hasOne(A10::class, 'klien_id');
    }

    public function c10D10()
    {
        return $this->hasOne(C10D10::class, 'klien_id');
    }

    public function timPerikatans(): HasMany
    {
        return $this->hasMany(EngagementTeam::class, 'klien_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tim_perikatans', 'klien_id', 'user_id')
                    ->withPivot('peran')
                    ->withTimestamps();
    }
}