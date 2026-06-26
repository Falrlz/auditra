<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengajuanIzin extends Model
{
    use HasFactory;

    protected $table = 'pengajuan_izin';

    protected $fillable = [
        'pegawai_id',
        'tanggal_mulai',
        'tanggal_selesai',
        'tipe',
        'keterangan',
        'dokumen',
        'status_approval',
        'approved_by',
    ];

    protected $casts = [
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'approved_by');
    }
}
