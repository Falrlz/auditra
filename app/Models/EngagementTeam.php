<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EngagementTeam extends Model
{
    protected $table = 'tim_perikatans';

    protected $fillable = [
        'klien_id',
        'user_id',
        'peran', // 'anggota', 'supervisor', 'ketua_tim', 'partner'
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'klien_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
