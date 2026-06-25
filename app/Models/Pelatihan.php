<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pelatihan extends Model
{
    use HasFactory;

    protected $table = 'pelatihan';

    protected $fillable = [
        'kegiatan',
        'deskripsi',
        'skp',
        'mulai',
        'akhir',
        'status',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'mulai' => 'datetime',
        'akhir' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'approved_by');
    }
}
