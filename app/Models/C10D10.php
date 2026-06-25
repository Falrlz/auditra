<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class C10D10 extends Model
{
    protected $table = 'c10_d10';

    protected $fillable = [
        'tim_perikatan_id',
        'overall_materiality',
        'performance_materiality',
        'tolerable_error',
        'status',
        'reject_reason',
        'section_data',
    ];

    protected function casts(): array
    {
        return [
            'section_data' => 'array',
        ];
    }

    public function timPerikatan(): BelongsTo
    {
        return $this->belongsTo(TimPerikatan::class, 'tim_perikatan_id');
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(C10D10Account::class, 'c10_d10_id');
    }
}
