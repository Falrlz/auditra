<?php

namespace App\Models;

use Database\Factories\AuditFormFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditForm extends Model
{
    /** @use HasFactory<AuditFormFactory> */
    use HasFactory;

    protected $fillable = [
        'client_id',
        'form_type',
        'status',
        'reject_reason',
        'section_data',
        'preparer_id',
        'reviewer_id',
        'approver_id',
    ];

    protected function casts(): array
    {
        return [
            'section_data' => 'array',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function preparer()
    {
        return $this->belongsTo(User::class, 'preparer_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}