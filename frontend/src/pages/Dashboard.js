import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FamilyTreeView from '../components/FamilyTreeView';

const Dashboard = () => {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state for creating new person
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    death_date: '',
    biography: '',
    photo_url: '',
    is_public: false
  });
  
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        // Fetch all people associated with the current user
        const response = await api.get('/people');
        
        setPeople(response.data);
        
        // If we have people, select the first one by default
        if (response.data.length > 0) {
          setSelectedPerson(response.data[0].id);
          await fetchFamilyTree(response.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching people:', err);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPeople();
  }, []);
  
  const fetchFamilyTree = async (personId) => {
    try {
      setTreeLoading(true);
      
      // Fetch the family tree with the selected person as the root
      const response = await api.get(`/people/${personId}/tree`);
      
      setTreeData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching family tree:', err);
      setError('Avlodlar daraxtini yuklashda xatolik yuz berdi');
      setTreeData(null);
    } finally {
      setTreeLoading(false);
    }
  };
  
  const handlePersonSelect = async (personId) => {
    setSelectedPerson(personId);
    await fetchFamilyTree(personId);
  };

  // Filter people based on search query
  const filteredPeople = people.filter(person => 
    person.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };
  
  // Handle form submission to create a new person
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create new person
      const response = await api.post('/people', formData);
      
      // Add the new person to the people list
      setPeople(prevPeople => [...prevPeople, response.data]);
      
      // Select the newly created person
      setSelectedPerson(response.data.id);
      
      // Reset form
      setFormData({
        full_name: '',
        birth_date: '',
        death_date: '',
        biography: '',
        photo_url: '',
        is_public: false
      });
      
      // Fetch tree for the new person
      await fetchFamilyTree(response.data.id);
      
    } catch (err) {
      console.error('Error creating person:', err);
      setError('Shaxsni yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar with people list */}
        <div className="md:w-1/4 p-4">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Shaxslar</h2>
            </div>
            
            {/* Search input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Shaxs qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
            ) : people.length === 0 ? (
              <div className="bg-gray-100 text-gray-500 p-4 rounded-lg text-center">
                {searchQuery ? 'Qidiruv natijasida hech narsa topilmadi' : 'Hali hech qanday shaxs qo\'shilmagan'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredPeople.map((person) => (
                  <li key={person.id}>
                    <button
                      onClick={() => handlePersonSelect(person.id)}
                      className={`w-full text-left px-3 py-3 rounded flex items-center ${
                        selectedPerson === person.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {person.photo_url ? (
                          <img
                            src={person.photo_url}
                            alt={person.full_name}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-medium">
                              {person.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{person.full_name}</h3>
                        <p className="text-xs text-gray-500">
                          {person.birth_date && `Tug'ilgan: ${new Date(person.birth_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:w-3/4 p-4">
          {people.length === 0 && !loading ? (
            // Show new person form when no people exist
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Yangi shaxs qo'shish</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      To'liq ism *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="photo_url" className="block text-sm font-medium text-gray-700">
                      Rasm URL (ixtiyoriy)
                    </label>
                    <input
                      type="text"
                      name="photo_url"
                      id="photo_url"
                      value={formData.photo_url}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                      Tug'ilgan sana (ixtiyoriy)
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      id="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="death_date" className="block text-sm font-medium text-gray-700">
                      Vafot etgan sana (ixtiyoriy)
                    </label>
                    <input
                      type="date"
                      name="death_date"
                      id="death_date"
                      value={formData.death_date}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="biography" className="block text-sm font-medium text-gray-700">
                      Biografiya (ixtiyoriy)
                    </label>
                    <textarea
                      name="biography"
                      id="biography"
                      rows={5}
                      value={formData.biography}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_public"
                        name="is_public"
                        checked={formData.is_public}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                        Shajarani boshqalarga ko'rish uchun ochiq qilish
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Show family tree when people exist
            <div className="bg-white rounded-lg shadow-md p-6 h-[600px]">
              <div className="mb-4 flex flex-col md:flex-row justify-between md:items-center">
                <h2 className="text-xl font-semibold mb-2 md:mb-0">
                  {selectedPerson && people.find(p => p.id === selectedPerson)?.full_name} avlodlar daraxti
                </h2>
                {selectedPerson && (
                  <div className="flex space-x-2">
                    <Link
                      to={`/person/${selectedPerson}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Ko'rish
                    </Link>
                  </div>
                )}
              </div>
              
              {treeLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : !selectedPerson ? (
                <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Daraxtda ko'rish uchun shaxsni tanlang</p>
                </div>
              ) : !treeData ? (
                <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Avlodlar daraxti uchun ma'lumot topilmadi</p>
                </div>
              ) : (
                <FamilyTreeView data={treeData} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
