<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['first_name', 'last_name', 'phone', 'email'];

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function repairOrders(): HasManyThrough
    {
        return $this->hasManyThrough(RepairOrder::class, Vehicle::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }
}
