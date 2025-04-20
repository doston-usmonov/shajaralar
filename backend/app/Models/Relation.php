<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Relation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'parent_id',
        'child_id',
        'relation_type',
    ];

    /**
     * Get the parent person.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'parent_id');
    }

    /**
     * Get the child person.
     */
    public function child(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'child_id');
    }
}
