<?php

namespace App\Http\Controllers;

use App\Models\Person;
use App\Models\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PersonController extends Controller
{
    /**
     * Display a listing of the people for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $people = Person::where('user_id', $user->id)->get();
        
        return response()->json($people);
    }

    /**
     * Store a newly created person.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'birth_date' => 'nullable|date',
            'death_date' => 'nullable|date',
            'biography' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'gender' => 'nullable|string|in:M,F',
            'is_public' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $person = new Person($request->all());
        $person->user_id = $request->user()->id;
        $person->save();

        return response()->json($person, 201);
    }

    /**
     * Display the specified person.
     */
    public function show(string $id)
    {
        $person = Person::findOrFail($id);
        
        // Ensure the user can only access their own person records
        if ($person->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        return response()->json($person);
    }

    /**
     * Update the specified person.
     */
    public function update(Request $request, string $id)
    {
        $person = Person::findOrFail($id);
        
        // Ensure the user can only update their own person records
        if ($person->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'full_name' => 'string|max:255',
            'birth_date' => 'nullable|date',
            'death_date' => 'nullable|date',
            'biography' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'gender' => 'nullable|string|in:M,F',
            'is_public' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $person->update($request->all());
        
        return response()->json($person);
    }

    /**
     * Remove the specified person.
     */
    public function destroy(string $id)
    {
        $person = Person::findOrFail($id);
        
        // Ensure the user can only delete their own person records
        if ($person->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $person->delete();
        
        return response()->json(['message' => 'Person deleted successfully']);
    }
    
    /**
     * Get the family tree structure for a specific person
     */
    public function getTree(string $id)
    {
        $rootPerson = Person::findOrFail($id);
        
        // Ensure the user can only access their own person records
        if ($rootPerson->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $tree = $this->buildTreeData($id);
        
        return response()->json($tree);
    }
    
    /**
     * Add a child to a person and create the relation in one operation.
     */
    public function addChild(Request $request, string $id)
    {
        $parentPerson = Person::findOrFail($id);
        
        // Ensure the user can only add children to their own person records
        if ($parentPerson->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'birth_date' => 'nullable|date',
            'death_date' => 'nullable|date',
            'biography' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'gender' => 'nullable|string|in:M,F',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create the new child
        $childPerson = new Person($request->all());
        $childPerson->user_id = Auth::id();
        $childPerson->save();
        
        // Create the parent-child relation
        $relation = new Relation();
        $relation->parent_id = $parentPerson->id;
        $relation->child_id = $childPerson->id;
        $relation->save();
        
        return response()->json([
            'message' => 'Child added successfully', 
            'parent' => $parentPerson, 
            'child' => $childPerson
        ], 201);
    }
    
    /**
     * Toggle the public status of a person.
     */
    public function togglePublic(string $id)
    {
        Log::info('Toggle public called for person ID: ' . $id); // Debug log

        try {
            $person = Person::findOrFail($id);
            
            // Log the authenticated user ID
            Log::info('Auth ID: ' . (Auth::id() ?: 'null') . ', Person user_id: ' . $person->user_id);
            
            // Ensure the user can only update their own person records
            if ($person->user_id !== Auth::id()) {
                Log::warning('Unauthorized toggle public attempt. Person ID: ' . $id);
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $person->is_public = !$person->is_public;
            
            // Share token yaratish agar mavjud bo'lmasa
            if ($person->is_public && empty($person->share_token)) {
                $person->share_token = \Illuminate\Support\Str::random(32);
            }
            
            $person->save();
            
            $shareUrl = $person->is_public ? $person->getShareableUrl() : null;
            
            $response = [
                'message' => $person->is_public ? 'Shajara ochiq qilindi' : 'Shajara yopildi',
                'is_public' => $person->is_public,
                'share_url' => $shareUrl,
                'share_token' => $person->is_public ? $person->share_token : null
            ];
            
            Log::info('Toggle public successful: ' . json_encode($response));
            
            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Toggle public error: ' . $e->getMessage());
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get the shared tree data using a share token.
     * This endpoint does not require authentication.
     */
    public function getSharedTree(string $token)
    {
        $person = Person::where('share_token', $token)
                        ->where('is_public', true)
                        ->firstOrFail();
        
        $tree = $this->buildTreeData($person->id);
        
        // Strip any sensitive information
        $tree['is_shared'] = true;
        
        return response()->json($tree);
    }
    
    /**
     * Get the shared person data using a share token.
     * This endpoint does not require authentication.
     */
    public function getSharedPerson(string $token)
    {
        $person = Person::where('share_token', $token)
                        ->where('is_public', true)
                        ->firstOrFail();
        
        // Build a limited response to avoid exposing sensitive data
        $response = [
            'id' => $person->id,
            'full_name' => $person->full_name,
            'birth_date' => $person->birth_date,
            'death_date' => $person->death_date,
            'biography' => $person->biography,
            'photo_url' => $person->photo_url,
            'is_public' => true,
            'is_shared' => true,
            'share_token' => $token,
        ];
        
        return response()->json($response);
    }
    
    /**
     * Get the parents of a person.
     */
    public function getParents(string $id)
    {
        $person = Person::findOrFail($id);
        
        // Check if person is public or owned by authenticated user
        if (!$person->is_public && $person->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $parentRelations = Relation::where('child_id', $id)->get();
        $parents = [];
        
        foreach ($parentRelations as $relation) {
            $parent = Person::find($relation->parent_id);
            if ($parent) {
                // For non-owners, limit the data returned
                if ($parent->user_id !== Auth::id()) {
                    $parents[] = [
                        'id' => $parent->id,
                        'full_name' => $parent->full_name,
                        'birth_date' => $parent->birth_date,
                        'death_date' => $parent->death_date,
                        'biography' => $parent->biography,
                        'photo_url' => $parent->photo_url,
                        'is_public' => $parent->is_public,
                    ];
                } else {
                    $parents[] = $parent;
                }
            }
        }
        
        return response()->json($parents);
    }
    
    /**
     * Get the children of a person.
     */
    public function getChildren(string $id)
    {
        $person = Person::findOrFail($id);
        
        // Check if person is public or owned by authenticated user
        if (!$person->is_public && $person->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $childRelations = Relation::where('parent_id', $id)->get();
        $children = [];
        
        foreach ($childRelations as $relation) {
            $child = Person::find($relation->child_id);
            if ($child) {
                // For non-owners, limit the data returned
                if ($child->user_id !== Auth::id()) {
                    $children[] = [
                        'id' => $child->id,
                        'full_name' => $child->full_name,
                        'birth_date' => $child->birth_date,
                        'death_date' => $child->death_date,
                        'biography' => $child->biography,
                        'photo_url' => $child->photo_url,
                        'is_public' => $child->is_public,
                    ];
                } else {
                    $children[] = $child;
                }
            }
        }
        
        return response()->json($children);
    }
    
    /**
     * Helper function to build tree data.
     */
    private function buildTreeData($personId)
    {
        // Recursive function to build the tree
        $buildTree = function ($personId) use (&$buildTree) {
            $person = Person::findOrFail($personId);
            
            $relations = $person->children()->with('child')->get();
            $children = [];
            
            foreach ($relations as $relation) {
                $children[] = $buildTree($relation->child_id);
            }
            
            return [
                'id' => $person->id,
                'full_name' => $person->full_name,
                'birth_date' => $person->birth_date,
                'death_date' => $person->death_date,
                'photo_url' => $person->photo_url,
                'gender' => $person->gender,
                'children' => $children
            ];
        };
        
        return $buildTree($personId);
    }
}
