<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EngagementTeam extends Model
{
    protected $table = 'tim_perikatans';

    protected $fillable = [
        'client_id',
        'user_id',
        'role', // 'anggota', 'supervisor', 'ketua_tim', 'partner'
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
