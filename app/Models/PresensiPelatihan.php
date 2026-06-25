<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PresensiPelatihan extends Model
{
    use HasFactory;

    protected $table = 'presensi_pelatihan';

    protected $fillable = [
        'pegawai_id',
        'pelatihan_id',
        'tanggal',
        'checkin_at',
        'checkout_at',
        'status',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'checkin_at' => 'datetime',
        'checkout_at' => 'datetime',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function pelatihan(): BelongsTo
    {
        return $this->belongsTo(Pelatihan::class, 'pelatihan_id');
    }
}
