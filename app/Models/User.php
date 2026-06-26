<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pegawai_id',
        'email',
        'password',
        'name',
        'inisial',
        'role',
        'is_active',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'name',
        'inisial',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    // Proxy Accessors & Mutators for backward compatibility
    public function getNameAttribute()
    {
        return $this->pegawai?->name;
    }

    public function setNameAttribute($value)
    {
        $pegawai = $this->pegawai;
        if ($pegawai) {
            $pegawai->name = $value;
            if ($pegawai->exists) {
                $pegawai->save();
            }
        }
    }

    public function getInisialAttribute()
    {
        return $this->pegawai?->inisial;
    }

    public function setInisialAttribute($value)
    {
        $pegawai = $this->pegawai;
        if ($pegawai) {
            $pegawai->inisial = $value;
            if ($pegawai->exists) {
                $pegawai->save();
            }
        }
    }

    public function getRoleAttribute()
    {
        return $this->pegawai?->jabatan;
    }

    public function setRoleAttribute($value)
    {
        $pegawai = $this->pegawai;
        if ($pegawai) {
            $pegawai->jabatan = $value;
            if ($pegawai->exists) {
                $pegawai->save();
            }
        }
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPartner(): bool
    {
        return $this->role === 'partner';
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    public function timPerikatans()
    {
        return $this->hasManyThrough(
            TimPerikatan::class,
            Pegawai::class,
            'id', // Foreign key on Pegawai table
            'pegawai_id', // Foreign key on TimPerikatan table
            'pegawai_id', // Local key on User table
            'id' // Local key on Pegawai table
        );
    }

    public function clients()
    {
        return $this->belongsToMany(Client::class, 'tim_perikatan', 'pegawai_id', 'client_id', 'pegawai_id', 'id')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    public function createdClients()
    {
        return $this->hasMany(Client::class, 'created_by', 'pegawai_id');
    }

    public function roleInClient($clientId)
    {
        if (!$this->pegawai_id) {
            return null;
        }
        $teamMember = TimPerikatan::where('pegawai_id', $this->pegawai_id)
            ->where('client_id', $clientId)
            ->first();
        return $teamMember ? $teamMember->role : null;
    }
}
