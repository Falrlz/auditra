<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class A10 extends Model
{
    protected $table = 'a10';

    protected $fillable = [
        'klien_id',
        'status',
        'alasan_penolakan',
        'form_a10',
        'pembuat_id',
        'penelaah_id',
        'penyetuju_id',
    ];

    protected function casts(): array
    {
        return [
            'form_a10' => 'array',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'klien_id');
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
