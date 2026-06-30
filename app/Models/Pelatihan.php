<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'reject_reason',
        'presence_token',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->presence_token = \Illuminate\Support\Str::random(32);
        });
    }

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

    public function presensiPelatihans(): HasMany
    {
        return $this->hasMany(PresensiPelatihan::class, 'pelatihan_id');
    }
}
