<?php

namespace Database\Seeders;

use App\Models\Person;
use App\Models\Relation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PeopleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test user if none exists
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now()
            ]
        );

        // Array of Uzbek male names
        $maleNames = [
            'Abdurahmon', 'Alisher', 'Anvar', 'Asror', 'Aziz', 'Bahrom', 'Bekzod', 
            'Bobur', 'Dilshod', 'Erkin', 'Farrukh', 'Gayrat', 'Humoyun', 'Ikrom', 
            'Ismoil', 'Jamshid', 'Javohir', 'Kamoliddin', 'Lutfulla', 'Mansur', 
            'Mirzohid', 'Nodir', 'Odil', 'Olim', 'Otabek', 'Pulat', 'Qudrat', 
            'Ravshan', 'Rustam', 'Sardor', 'Shavkat', 'Sherali', 'Tohir', 'Umid', 
            'Ulugbek', 'Vohid', 'Yodgor', 'Zafar', 'Zuhriddin'
        ];

        // Array of Uzbek female names
        $femaleNames = [
            'Aziza', 'Barno', 'Charos', 'Dilbar', 'Ezoza', 'Feruza', 'Gulnora', 
            'Hilola', 'Iroda', 'Jamila', 'Kamola', 'Lola', 'Malika', 'Nargiza', 
            'Odina', 'Parizoda', 'Qunduz', 'Rayhon', 'Saodat', 'Tahmina', 'Umida', 
            'Vazira', 'Xurshida', 'Yulduz', 'Zarina', 'Dilfuza', 'Mohira', 'Nasiba',
            'Shahlo', 'Zulfiya', 'Manzura', 'Nilufar', 'Ozoda', 'Shahrizoda', 'Dilnoza'
        ];

        // Array of Uzbek last names
        $lastNames = [
            'Abdullayev', 'Ahmedov', 'Alimov', 'Bahodirov', 'Boltaboyev', 'Davronov',
            'Ergashev', 'Fazliddinov', 'Ganiyev', 'Hakimov', 'Ikromov', 'Jorayev',
            'Karimov', 'Latipov', 'Mahmudov', 'Nazarov', 'Olimov', 'Polatov',
            'Qodirov', 'Rahimov', 'Soliyev', 'Torayev', 'Umarov', 'Vohidov',
            'Xolmatov', 'Yusupov', 'Zohidov', 'Sherbekov', 'Ismailov', 'Toshmatov'
        ];

        // Basic biographies for test data
        $biographies = [
            'Professional engineer with expertise in construction.',
            'Talented artist known for landscape paintings.',
            'Respected teacher who dedicated life to education.',
            'Hardworking farmer who cultivated the land.',
            'Successful merchant who traveled throughout Central Asia.',
            'Military officer who served with distinction.',
            'Community leader known for philanthropic activities.',
            'Skilled craftsman specializing in traditional carpentry.',
            'Notable scholar who authored several books.',
            'Doctor who helped establish local healthcare facilities.'
        ];

        // Start date for first generation (approximately 210 years ago)
        $startYear = date('Y') - 210;
        
        // Track created people by generation for building relations
        $peopleByGeneration = [];
        
        // Create first generation (generation 0) - the ancestors
        $peopleByGeneration[0] = [];
        
        // Create 2 ancestors (a couple)
        $ancestor1 = Person::create([
            'user_id' => $user->id,
            'full_name' => $this->getRandomName($maleNames, $lastNames),
            'birth_date' => Carbon::createFromDate($startYear, rand(1, 12), rand(1, 28)),
            'death_date' => Carbon::createFromDate($startYear + rand(65, 85), rand(1, 12), rand(1, 28)),
            'biography' => $this->getRandomBio($biographies) . ' Founder of the family lineage.',
            'photo_url' => null
        ]);
        
        $ancestor2 = Person::create([
            'user_id' => $user->id,
            'full_name' => $this->getRandomName($femaleNames, $lastNames, true),
            'birth_date' => Carbon::createFromDate($startYear + rand(2, 5), rand(1, 12), rand(1, 28)),
            'death_date' => Carbon::createFromDate($startYear + rand(65, 85), rand(1, 12), rand(1, 28)),
            'biography' => $this->getRandomBio($biographies) . ' Matriarch of the family.',
            'photo_url' => null
        ]);
        
        $peopleByGeneration[0][] = $ancestor1;
        $peopleByGeneration[0][] = $ancestor2;
        
        // Generate 7 generations
        for ($generation = 1; $generation < 7; $generation++) {
            $this->command->info("Creating generation " . $generation);
            
            // Approximate birth year for this generation
            $generationYear = $startYear + ($generation * 30);
            
            // Store people in this generation
            $peopleByGeneration[$generation] = [];
            
            // Previous generation's people who will have children
            $parents = $peopleByGeneration[$generation - 1];
            
            // For each potential parent pair from previous generation
            for ($i = 0; $i < count($parents); $i += 2) {
                // Only create children if we have a "couple" (skip last person if odd number)
                if ($i + 1 >= count($parents)) continue;
                
                $parent1 = $parents[$i];
                $parent2 = $parents[$i + 1];
                
                // Random number of children for this couple (2-5)
                $childrenCount = rand(2, 5);
                
                // Create children
                for ($c = 0; $c < $childrenCount; $c++) {
                    // Randomly assign gender
                    $isMale = (bool)rand(0, 1);
                    
                    // Create birth/death dates (people live 60-85 years)
                    $birthYear = $generationYear + rand(0, 10); // Spread births over 10 years
                    $deathYear = $birthYear + rand(60, 85);
                    
                    // Limit death year to current year
                    $deathYear = min($deathYear, date('Y'));
                    
                    // If death year would be in the future, set to null (still alive)
                    $deathDate = ($deathYear >= date('Y')) ? null : 
                        Carbon::createFromDate($deathYear, rand(1, 12), rand(1, 28));
                    
                    // Create the person
                    $person = Person::create([
                        'user_id' => $user->id,
                        'full_name' => $this->getRandomName(
                            $isMale ? $maleNames : $femaleNames, 
                            $lastNames,
                            !$isMale
                        ),
                        'birth_date' => Carbon::createFromDate($birthYear, rand(1, 12), rand(1, 28)),
                        'death_date' => $deathDate,
                        'biography' => $this->getRandomBio($biographies),
                        'photo_url' => null
                    ]);
                    
                    // Add to this generation's people
                    $peopleByGeneration[$generation][] = $person;
                    
                    // Create relations to both parents
                    Relation::create([
                        'parent_id' => $parent1->id,
                        'child_id' => $person->id,
                        'relation_type' => $isMale ? 'son' : 'daughter'
                    ]);
                    
                    Relation::create([
                        'parent_id' => $parent2->id,
                        'child_id' => $person->id,
                        'relation_type' => $isMale ? 'son' : 'daughter'
                    ]);
                }
            }
            
            // If this generation doesn't have enough people for next generation,
            // create some spouses for them
            if (count($peopleByGeneration[$generation]) < 4 && $generation < 6) {
                $spousesNeeded = 4 - count($peopleByGeneration[$generation]);
                
                for ($s = 0; $s < $spousesNeeded; $s++) {
                    // Create spouse with opposite gender of last person
                    $lastPerson = $peopleByGeneration[$generation][count($peopleByGeneration[$generation]) - 1];
                    $lastName = explode(' ', $lastPerson->full_name);
                    $isLastMale = !str_ends_with($lastName[0], 'a');
                    
                    $birthYear = $generationYear + rand(0, 10);
                    $deathYear = $birthYear + rand(60, 85);
                    
                    // Limit death year to current year
                    $deathYear = min($deathYear, date('Y'));
                    
                    // If death year would be in the future, set to null (still alive)
                    $deathDate = ($deathYear >= date('Y')) ? null : 
                        Carbon::createFromDate($deathYear, rand(1, 12), rand(1, 28));
                    
                    $spouse = Person::create([
                        'user_id' => $user->id,
                        'full_name' => $this->getRandomName(
                            $isLastMale ? $femaleNames : $maleNames, 
                            $lastNames,
                            !$isLastMale
                        ),
                        'birth_date' => Carbon::createFromDate($birthYear, rand(1, 12), rand(1, 28)),
                        'death_date' => $deathDate,
                        'biography' => $this->getRandomBio($biographies) . ' Married into the family.',
                        'photo_url' => null
                    ]);
                    
                    $peopleByGeneration[$generation][] = $spouse;
                }
            }
            
            // Add more complexity by making sure we have pairs for next generation
            // Adjust array to make sure we have an even number of people
            if (count($peopleByGeneration[$generation]) % 2 != 0 && $generation < 6) {
                $extraPerson = Person::create([
                    'user_id' => $user->id,
                    'full_name' => $this->getRandomName(
                        rand(0, 1) ? $maleNames : $femaleNames, 
                        $lastNames,
                        rand(0, 1)
                    ),
                    'birth_date' => Carbon::createFromDate($generationYear + rand(0, 10), rand(1, 12), rand(1, 28)),
                    'death_date' => null,
                    'biography' => $this->getRandomBio($biographies),
                    'photo_url' => null
                ]);
                
                $peopleByGeneration[$generation][] = $extraPerson;
            }
        }
        
        $this->command->info('Created ' . Person::count() . ' people across 7 generations');
        $this->command->info('Created ' . Relation::count() . ' family relationships');
    }
    
    /**
     * Generate a random full name
     */
    private function getRandomName($firstNames, $lastNames, $isFemale = false)
    {
        $firstName = $firstNames[array_rand($firstNames)];
        $lastName = $lastNames[array_rand($lastNames)];
        
        // For women with Uzbek names, modify the last name ending
        if ($isFemale) {
            // If last name ends with 'ov' change to 'ova', if 'ev' change to 'eva'
            if (substr($lastName, -2) === 'ov') {
                $lastName .= 'a';
            } elseif (substr($lastName, -2) === 'ev') {
                $lastName .= 'a';
            }
        }
        
        return $firstName . ' ' . $lastName;
    }
    
    /**
     * Get a random biography
     */
    private function getRandomBio($bios)
    {
        return $bios[array_rand($bios)];
    }
}
