<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TimPerikatan extends Model
{
    protected $table = 'tim_perikatan';

    protected $fillable = [
        'pegawai_id',
        'client_id',
        'role', // partner, manager, supervisor, senior, junior
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function a10(): HasOne
    {
        return $this->hasOne(A10::class, 'tim_perikatan_id');
    }

    public function c10D10(): HasOne
    {
        return $this->hasOne(C10D10::class, 'tim_perikatan_id');
    }
}
