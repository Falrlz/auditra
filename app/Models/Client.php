<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Client extends Model
{
    protected $fillable = [
        'name',
        'book_year',
        'schedule',
    ];

    public function auditForms(): HasMany
    {
        return $this->hasMany(AuditForm::class);
    }

    public function timPerikatans(): HasMany
    {
        return $this->hasMany(EngagementTeam::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tim_perikatans')
                    ->withPivot('role')
                    ->withTimestamps();
    }
}
