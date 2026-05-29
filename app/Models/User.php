<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'login',
        'password',
        'role',
        'first_name',
        'last_name',
        'phone',
        'email',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Pełne imię i nazwisko (helper).
     */
    public function getFullNameAttribute(): string
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }

    /**
     * Czy użytkownik ma jedną z podanych ról?
     */
    public function hasRole(string|array $roles): bool
    {
        return in_array($this->role, (array) $roles, true);
    }

    public function repairOrders(): HasMany
    {
        return $this->hasMany(RepairOrder::class, 'mechanic_id');
    }

    public function partRequests(): HasMany
    {
        return $this->hasMany(PartRequest::class, 'mechanic_id');
    }

    public function invoicesIssued(): HasMany
    {
        return $this->hasMany(Invoice::class, 'issued_by');
    }
}
