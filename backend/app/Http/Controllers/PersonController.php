<?php

namespace App\Http\Controllers;

use App\Models\Person;
use App\Models\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

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
                'children' => $children
            ];
        };
        
        $tree = $buildTree($id);
        
        return response()->json($tree);
    }
    
    /**
     * Add a child to a person and create the relation in one operation.
     */
    public function addChild(Request $request, string $id)
    {
        // Validate the parent exists and belongs to the authenticated user
        $parent = Person::findOrFail($id);
        
        if ($parent->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Validate child data
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'birth_date' => 'nullable|date',
            'death_date' => 'nullable|date',
            'biography' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'relation_type' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create the child
        $child = Person::create([
            'user_id' => Auth::id(),
            'full_name' => $request->full_name,
            'birth_date' => $request->birth_date,
            'death_date' => $request->death_date,
            'biography' => $request->biography,
            'photo_url' => $request->photo_url,
        ]);
        
        // Create the parent-child relation
        $relation = Relation::create([
            'parent_id' => $parent->id,
            'child_id' => $child->id,
            'relation_type' => $request->relation_type ?? 'biological',
        ]);
        
        return response()->json([
            'child' => $child,
            'relation' => $relation
        ], 201);
    }
}
