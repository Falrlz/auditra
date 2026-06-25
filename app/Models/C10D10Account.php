<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class C10D10Account extends Model
{
    protected $table = 'c10_d10_accounts';

    protected $fillable = [
        'c10_d10_id',
        'kode_induk',
        'nama_induk',
        'saldo_normal',
        'suffix',
        'kode_lengkap',
        'nama',
        'saldo_unaudited',
        'tcm_unaudited',
        'penyesuaian_debit',
        'penyesuaian_kredit',
        'reff',
        'saldo_audited',
        'tcm_audited',
        'saldo_audited_prev',
        'saldo_audited_prev2',
        'persen_materialitas',
        'status_materialitas',
    ];

    public function c10D10(): BelongsTo
    {
        return $this->belongsTo(C10D10::class, 'c10_d10_id');
    }
}
