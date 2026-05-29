<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceType extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'default_price', 'description'];

    protected $casts = [
        'default_price' => 'decimal:2',
    ];

    public function tasks(): HasMany
    {
        return $this->hasMany(RepairTask::class);
    }
}
