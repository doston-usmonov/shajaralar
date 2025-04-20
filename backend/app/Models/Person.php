<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Person extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'full_name',
        'birth_date',
        'death_date',
        'biography',
        'photo_url',
        'is_public',
        'share_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birth_date' => 'date',
        'death_date' => 'date',
        'is_public' => 'boolean',
    ];

    /**
     * Bootstrap the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Ulashish tokeni avtomatik yaratiladi
        static::creating(function ($person) {
            if (empty($person->share_token)) {
                $person->share_token = Str::random(32);
            }
        });
    }

    /**
     * Get the user that owns the person.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the children of this person.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Relation::class, 'parent_id');
    }

    /**
     * Get the parents of this person.
     */
    public function parents(): HasMany
    {
        return $this->hasMany(Relation::class, 'child_id');
    }

    /**
     * Generate a shareable URL for this person's tree.
     */
    public function getShareableUrl()
    {
        if ($this->is_public && $this->share_token) {
            return url("/share/{$this->share_token}");
        }
        
        return null;
    }
}
