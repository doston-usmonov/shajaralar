import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const PersonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  
  // Form state for editing person
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    death_date: '',
    biography: '',
    photo_url: ''
  });

  // Form state for adding a child
  const [childFormData, setChildFormData] = useState({
    full_name: '',
    birth_date: '',
    death_date: '',
    biography: '',
    photo_url: '',
    relation_type: 'biological'
  });

  // Fetch person details
  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch person data
        const personResponse = await api.get(`/people/${id}`);
        setPerson(personResponse.data);
        setFormData({
          full_name: personResponse.data.full_name || '',
          birth_date: personResponse.data.birth_date || '',
          death_date: personResponse.data.death_date || '',
          biography: personResponse.data.biography || '',
          photo_url: personResponse.data.photo_url || ''
        });
        
        // Fetch parents
        const parentsResponse = await api.get(`/people/${id}/parents`);
        setParents(parentsResponse.data);
        
        // Fetch children
        const childrenResponse = await api.get(`/people/${id}/children`);
        setChildren(childrenResponse.data);
        
      } catch (err) {
        console.error('Error fetching person details:', err);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonDetails();
  }, [id]);

  // Handle input change for person form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle input change for child form
  const handleChildInputChange = (e) => {
    const { name, value } = e.target;
    setChildFormData({ ...childFormData, [name]: value });
  };

  // Handle form submission to update person
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Update the person
      const response = await api.put(`/people/${id}`, formData);
      
      setPerson(response.data);
      setEditing(false);
    } catch (err) {
      console.error('Error updating person:', err);
      setError('Shaxsni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new child
  const handleAddChild = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Add a child using the new endpoint
      const response = await api.post(`/people/${id}/children`, childFormData);
      
      // Add the new child to the children list
      setChildren([...children, response.data.child]);
      
      // Reset form and close modal
      setChildFormData({
        full_name: '',
        birth_date: '',
        death_date: '',
        biography: '',
        photo_url: '',
        relation_type: 'biological'
      });
      setShowAddChildModal(false);
    } catch (err) {
      console.error('Error adding child:', err);
      setError('Farzand qo\'shishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Handle person deletion
  const handleDelete = async () => {
    if (!window.confirm('Rostdan ham bu shaxsni o\'chirmoqchimisiz?')) return;
    
    setLoading(true);
    try {
      await api.delete(`/people/${id}`);
      
      // Redirect back to profile page after deletion
      navigate('/profile');
    } catch (err) {
      console.error('Error deleting person:', err);
      setError('Shaxsni o\'chirishda xatolik yuz berdi');
      setLoading(false);
    }
  };

  if (loading && !person) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !person) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Link 
          to="/profile" 
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Profilga qaytish
        </Link>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
        <p className="text-gray-500">Shaxs topilmadi</p>
        <Link 
          to="/profile" 
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Profilga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Daraxtga qaytish
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{person.full_name}</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {editing ? 'Bekor qilish' : 'Tahrirlash'}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-gray-50"
          >
            O'chirish
          </button>
        </div>
      </div>

      {/* Person details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {editing ? (
          <div className="px-4 py-5 sm:p-6">
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
                    rows={6}
                    value={formData.biography}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
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
        ) : (
          <>
            <div className="px-4 py-5 sm:px-6 flex items-center">
              {person.photo_url ? (
                <img
                  src={person.photo_url}
                  alt={person.full_name}
                  className="h-16 w-16 rounded-full mr-4"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-2xl text-blue-800 font-medium">
                    {person.full_name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">{person.full_name}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {person.birth_date && `Tug'ilgan: ${new Date(person.birth_date).toLocaleDateString()}`}
                  {person.birth_date && person.death_date && ' | '}
                  {person.death_date && `Vafot etgan: ${new Date(person.death_date).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            {person.biography && (
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Biografiya</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{person.biography}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Family Connections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Parents */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Ota-onalar</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Bu shaxsning ota-onalari</p>
          </div>
          <div className="border-t border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : parents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Ota-onalar mavjud emas</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {parents.map((parent) => (
                  <li key={parent.id}>
                    <Link 
                      to={`/person/${parent.id}`}
                      className="block px-4 py-4 hover:bg-gray-50 flex items-center"
                    >
                      {parent.photo_url ? (
                        <img
                          src={parent.photo_url}
                          alt={parent.full_name}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-800 font-medium">
                            {parent.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm text-gray-900">{parent.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {parent.birth_date && `Tug'ilgan: ${new Date(parent.birth_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Children */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Farzandlar</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Bu shaxsning farzandlari</p>
            </div>
            <button
              onClick={() => setShowAddChildModal(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Farzand qo'shish
            </button>
          </div>
          <div className="border-t border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : children.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Farzandlar mavjud emas</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link 
                      to={`/person/${child.id}`}
                      className="block px-4 py-4 hover:bg-gray-50 flex items-center"
                    >
                      {child.photo_url ? (
                        <img
                          src={child.photo_url}
                          alt={child.full_name}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-800 font-medium">
                            {child.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm text-gray-900">{child.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {child.birth_date && `Tug'ilgan: ${new Date(child.birth_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Yangi farzand qo'shish</h3>
              <button 
                onClick={() => setShowAddChildModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label htmlFor="child_full_name" className="block text-sm font-medium text-gray-700">
                  To'liq ism *
                </label>
                <input
                  type="text"
                  name="full_name"
                  id="child_full_name"
                  required
                  value={childFormData.full_name}
                  onChange={handleChildInputChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="child_birth_date" className="block text-sm font-medium text-gray-700">
                  Tug'ilgan sana
                </label>
                <input
                  type="date"
                  name="birth_date"
                  id="child_birth_date"
                  value={childFormData.birth_date}
                  onChange={handleChildInputChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="relation_type" className="block text-sm font-medium text-gray-700">
                  Munosabat turi
                </label>
                <select
                  name="relation_type"
                  id="relation_type"
                  value={childFormData.relation_type}
                  onChange={handleChildInputChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="biological">Biologik</option>
                  <option value="adopted">Farzandlikka olingan</option>
                  <option value="step">O'gay farzand</option>
                </select>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="mr-2 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {loading ? 'Saqlanmoqda...' : 'Farzand qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonDetail;
