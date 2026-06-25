<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class A10 extends Model
{
    protected $table = 'a10';

    protected $fillable = [
        'tim_perikatan_id',
        'status',
        'reject_reason',
        'form_a10',
    ];

    protected function casts(): array
    {
        return [
            'form_a10' => 'array',
        ];
    }

    public function timPerikatan(): BelongsTo
    {
        return $this->belongsTo(TimPerikatan::class, 'tim_perikatan_id');
    }
}
