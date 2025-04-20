import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state for adding new person
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    death_date: '',
    biography: '',
    photo_url: ''
  });
  const [selectedParent, setSelectedParent] = useState('');
  const [relationType, setRelationType] = useState('biological');

  // Fetch all people that belong to the user
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/people', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPeople(response.data);
      } catch (err) {
        console.error('Error fetching people:', err);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchPeople();
  }, []);

  // Handle input change for form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission to add new person
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Create the new person
      const personResponse = await axios.post('http://localhost:8000/api/people', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // If a parent is selected, create a relation
      if (selectedParent) {
        await axios.post('http://localhost:8000/api/relations', {
          parent_id: selectedParent,
          child_id: personResponse.data.id,
          relation_type: relationType
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Update the people list
      setPeople([...people, personResponse.data]);
      
      // Reset form
      setFormData({
        full_name: '',
        birth_date: '',
        death_date: '',
        biography: '',
        photo_url: ''
      });
      setSelectedParent('');
      setRelationType('biological');
      setIsAdding(false);
      
    } catch (err) {
      console.error('Error adding person:', err);
      setError('Shaxsni qo\'shishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Handle person deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Rostdan ham bu shaxsni o\'chirmoqchimisiz?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/people/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update people list after deletion
      setPeople(people.filter(person => person.id !== id));
    } catch (err) {
      console.error('Error deleting person:', err);
      setError('Shaxsni o\'chirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profil va avlodlar</h1>
      
      {/* User Profile Info */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Foydalanuvchi ma'lumotlari</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Sizning asosiy ma'lumotlaringiz</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">To'liq ism</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email manzil</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* People Management */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Odamlar ro'yxati</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Sizning avlodlaringiz</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {isAdding ? 'Bekor qilish' : 'Yangi shaxs qo\'shish'}
          </button>
        </div>
        
        {/* Add new person form */}
        {isAdding && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
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
                    rows={4}
                    value={formData.biography}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                {people.length > 0 && (
                  <>
                    <div>
                      <label htmlFor="parent" className="block text-sm font-medium text-gray-700">
                        Ota/ona (ixtiyoriy)
                      </label>
                      <select
                        id="parent"
                        value={selectedParent}
                        onChange={(e) => setSelectedParent(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Tanlang...</option>
                        {people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedParent && (
                      <div>
                        <label htmlFor="relation_type" className="block text-sm font-medium text-gray-700">
                          Aloqa turi
                        </label>
                        <select
                          id="relation_type"
                          value={relationType}
                          onChange={(e) => setRelationType(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="biological">Biologik</option>
                          <option value="adopted">Farzandlikka olingan</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="mr-2 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
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
        )}
        
        {/* People list */}
        <div className="border-t border-gray-200">
          {loading && !isAdding ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Ma'lumotlar yuklanmoqda...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : people.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Sizda hali odamlar mavjud emas. Yangi odam qo'shing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ism
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tug'ilgan sana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {people.map((person) => (
                    <tr key={person.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
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
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {person.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.birth_date ? new Date(person.birth_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => navigate(`/person/${person.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Ko'rish
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          O'chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
