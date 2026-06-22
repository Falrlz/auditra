<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class C10D10Account extends Model
{
    protected $table = 'c10_d10_accounts';

    protected $fillable = [
        'c10_d10_id',
        'kode_induk',
        'nama_induk',
        'saldo_normal',
        'sufiks',
        'kode_lengkap',
        'nama',
        'saldo_unaudited',
        'tcm_unaudited',
        'penyesuaian_debit',
        'penyesuaian_kredit',
        'referensi',
        'saldo_audited',
        'tcm_audited',
        'saldo_audited_sebelumnya',
        'saldo_audited_sebelumnya2',
        'persen_materialitas',
        'status_materialitas',
    ];

    public function c10D10()
    {
        return $this->belongsTo(C10D10::class, 'c10_d10_id');
    }
}
