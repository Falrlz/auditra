<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class C10D10 extends Model
{
    protected $table = 'c10_d10';

    protected $fillable = [
        'klien_id',
        'materialitas_keseluruhan',
        'materialitas_kinerja',
        'kesalahan_ditoleransi',
        'status',
        'alasan_penolakan',
        'data_bagian',
        'pembuat_id',
        'penelaah_id',
        'penyetuju_id',
    ];

    protected function casts(): array
    {
        return [
            'data_bagian' => 'array',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'klien_id');
    }

    public function accounts()
    {
        return $this->hasMany(C10D10Account::class, 'c10_d10_id');
    }

    public function preparer()
    {
        return $this->belongsTo(User::class, 'pembuat_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'penelaah_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'penyetuju_id');
    }
}
