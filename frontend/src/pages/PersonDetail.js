import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FamilyTreeView from '../components/FamilyTreeView';

const PersonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // useAuth hookidan foydalanish
  const isNewPerson = id === 'new';
  
  const [person, setPerson] = useState(null);
  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [treeData, setTreeData] = useState(null); // Daraxt ma'lumotlari uchun state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(isNewPerson); // If new person, automatically enter edit mode
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTreeTab, setShowTreeTab] = useState(false); // Daraxt ko'rinishi holatini saqlash

  // Form state for editing person
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    death_date: '',
    biography: '',
    photo_url: '',
    is_public: false
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

  // Form state for adding a parent
  const [parentFormData, setParentFormData] = useState({
    full_name: '',
    birth_date: '',
    death_date: '',
    biography: '',
    photo_url: '',
    relation_type: 'biological'
  });

  // Fetch person details
  useEffect(() => {
    // If this is a new person, don't try to fetch data
    if (isNewPerson) {
      setLoading(false);
      return;
    }

    const fetchPersonDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch person data
        const personResponse = await api.get(`/people/${id}`);
        setPerson(personResponse.data);
        
        // Update form data with current person details
        setFormData({
          full_name: personResponse.data.full_name || '',
          birth_date: personResponse.data.birth_date || '',
          death_date: personResponse.data.death_date || '',
          biography: personResponse.data.biography || '',
          photo_url: personResponse.data.photo_url || '',
          is_public: personResponse.data.is_public || false
        });
        
        // If person is public, show share URL
        if (personResponse.data.is_public && personResponse.data.share_token) {
          const shareUrl = `${window.location.origin}/share/${personResponse.data.share_token}`;
          setShareUrl(shareUrl);
        } else {
          setShareUrl(null);
        }
        
        // Fetch parents
        const parentsResponse = await api.get(`/people/${id}/parents`);
        setParents(parentsResponse.data);
        
        // Fetch children
        const childrenResponse = await api.get(`/people/${id}/children`);
        setChildren(childrenResponse.data);
        
        // Fetch family tree
        const treeResponse = await api.get(`/people/${id}/tree`);
        setTreeData(treeResponse.data);
        
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

  // Handle input change for parent form
  const handleParentInputChange = (e) => {
    const { name, value } = e.target;
    setParentFormData({ ...parentFormData, [name]: value });
  };

  // Handle form submission to update person
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let response;
      if (isNewPerson) {
        // Create new person
        response = await api.post('/people', formData);
        // Navigate to the newly created person page
        navigate(`/person/${response.data.id}`);
      } else {
        // Update existing person
        response = await api.put(`/people/${id}`, formData);
        setPerson(response.data);
        setEditing(false);
      }
    } catch (err) {
      console.error('Error updating person:', err);
      setError(isNewPerson ? 'Shaxsni yaratishda xatolik yuz berdi' : 'Shaxsni yangilashda xatolik yuz berdi');
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

  // Handle adding a new parent
  const handleAddParent = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create new parent person
      const parentResponse = await api.post('/people', {
        full_name: parentFormData.full_name,
        birth_date: parentFormData.birth_date,
        death_date: parentFormData.death_date,
        biography: parentFormData.biography,
        photo_url: parentFormData.photo_url
      });
      
      // Create relation with current person (parent_id is the new person, child_id is current person)
      await api.post('/relations', {
        parent_id: parentResponse.data.id,
        child_id: id,
        relation_type: parentFormData.relation_type
      });
      
      // Add the new parent to the parents list
      setParents([...parents, parentResponse.data]);
      
      // Reset form and close modal
      setParentFormData({
        full_name: '',
        birth_date: '',
        death_date: '',
        biography: '',
        photo_url: '',
        relation_type: 'biological'
      });
      setShowAddParentModal(false);
    } catch (err) {
      console.error('Error adding parent:', err);
      setError('Ota-ona qo\'shishda xatolik yuz berdi');
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

  // Toggle public status
  const togglePublicStatus = async () => {
    if (loading) return; // Bir vaqtning o'zida ko'p marta bosishning oldini olish
    
    try {
      setLoading(true);
      console.log("Toggling public status for person ID:", id); // Debug
      
      // PUT emas, POST so'rovidan foydalanish
      const response = await api.post(`/people/${id}/toggle-public`);
      console.log("Toggle response:", response.data); // Debug
      
      // Update the person state with full data from response
      setPerson(prevPerson => ({
        ...prevPerson,
        is_public: response.data.is_public
      }));
      
      // Update the form data
      setFormData(prevData => ({
        ...prevData,
        is_public: response.data.is_public
      }));
      
      // If it's now public, show the share dialog
      if (response.data.is_public) {
        const shareUrl = `${window.location.origin}/share/${response.data.share_token || response.data.share_url || ''}`;
        setShareUrl(shareUrl);
        setShowShareDialog(true);
      } else {
        setShareUrl(null);
        setShowShareDialog(false);
      }
      
      // Show success message
      alert(response.data.message || (response.data.is_public ? 'Shajara ochiq qilindi' : 'Shajara yopildi'));
      
    } catch (err) {
      console.error('Error toggling public status:', err);
      alert('Ochiq/yopiq holatini o\'zgartirishda xatolik yuz berdi: ' + (err.response?.data?.message || err.message));
      setError('Ochiq/yopiq holatini o\'zgartirishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  // Copy share URL to clipboard
  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert('Ulashish havolasi nusxalandi!');
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
          alert('Nusxalash muvaffaqiyatsiz bo\'ldi. Havolani qo\'lda nusxalang.');
        });
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
    <div className="container mx-auto px-4 py-8">
      {/* Tabs for navigation - only show when not creating a new person */}
      {!isNewPerson && (
        <div className="mb-6 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button
                onClick={() => setShowTreeTab(false)}
                className={`inline-block p-4 rounded-t-lg ${
                  !showTreeTab 
                    ? 'text-blue-600 border-b-2 border-blue-600 active' 
                    : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                Shaxs ma'lumotlari
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setShowTreeTab(true)}
                className={`inline-block p-4 rounded-t-lg ${
                  showTreeTab 
                    ? 'text-blue-600 border-b-2 border-blue-600 active' 
                    : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                Avlodlar daraxti
              </button>
            </li>
          </ul>
        </div>
      )}

      {isNewPerson ? (
        // New person form
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Yangi shaxs qo'shish</h1>
            </div>
            
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
                  
                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_public"
                        name="is_public"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                        Shajarani boshqalarga ko'rish uchun ochiq qilish
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
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
          </div>
        </div>
      ) : showTreeTab ? (
        // Tree view tab
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {person?.full_name} avlodlar daraxti
          </h2>
          <div className="h-[700px] border rounded-lg overflow-hidden">
            {treeData ? (
              <FamilyTreeView data={treeData} />
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Person details tab
        <div className="w-full">
          {/* Personal details */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{person?.full_name}</h1>
              {!editing && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Tahrirlash
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    O'chirish
                  </button>
                </div>
              )}
            </div>

            {/* Share button */}
            {!editing && person && (
              <div className="mb-6 bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-blue-700">
                      {person.is_public ? 'Shajara ommaga ochiq' : 'Shajara faqat siz uchun'}
                    </span>
                  </div>
                  <div>
                    {person.is_public ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setShowShareDialog(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                          Ulashish
                        </button>
                        <button 
                          onClick={togglePublicStatus}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Yopiq qilish
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={togglePublicStatus}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                        Ochiq qilish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Person details */}
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
                    
                    <div className="sm:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_public"
                          name="is_public"
                          checked={formData.is_public}
                          onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                          Shajarani boshqalarga ko'rish uchun ochiq qilish
                        </label>
                      </div>
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
                    <h3 className="text-lg font-medium text-gray-900">{person?.full_name}</h3>
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
          <div className="flex flex-wrap gap-6">
            {/* Parents */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg flex-1 min-w-[300px]">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Ota-onalar</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Bu shaxsning ota-onalari</p>
                </div>
                {parents.length === 0 && !isNewPerson && (
                  <button
                    onClick={() => setShowAddParentModal(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Ota-ona qo'shish
                  </button>
                )}
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
            <div className="bg-white shadow overflow-hidden sm:rounded-lg flex-1 min-w-[300px]">
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
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
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
          
          {/* Add Parent Modal */}
          {showAddParentModal && (
            <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black opacity-50"></div>
              <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Yangi ota-ona qo'shish</h3>
                  <button 
                    onClick={() => setShowAddParentModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleAddParent} className="space-y-4">
                  <div>
                    <label htmlFor="parent_full_name" className="block text-sm font-medium text-gray-700">
                      To'liq ism *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      id="parent_full_name"
                      required
                      value={parentFormData.full_name}
                      onChange={handleParentInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="parent_birth_date" className="block text-sm font-medium text-gray-700">
                      Tug'ilgan sana
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      id="parent_birth_date"
                      value={parentFormData.birth_date}
                      onChange={handleParentInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="parent_death_date" className="block text-sm font-medium text-gray-700">
                      Vafot etgan sana
                    </label>
                    <input
                      type="date"
                      name="death_date"
                      id="parent_death_date"
                      value={parentFormData.death_date}
                      onChange={handleParentInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="parent_relation_type" className="block text-sm font-medium text-gray-700">
                      Munosabat turi
                    </label>
                    <select
                      name="relation_type"
                      id="parent_relation_type"
                      value={parentFormData.relation_type}
                      onChange={handleParentInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="biological">Biologik</option>
                      <option value="adopted">Farzandlikka olgan</option>
                      <option value="step">O'gay ota/ona</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddParentModal(false)}
                      className="mr-2 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {loading ? 'Saqlanmoqda...' : 'Ota-ona qo\'shish'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Share dialog */}
          {showShareDialog && shareUrl && (
            <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black opacity-50"></div>
              <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Avlodlar daraxtini ulashing</h3>
                  <button 
                    onClick={() => setShowShareDialog(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 mb-6">
                  <input 
                    type="text" 
                    value={shareUrl} 
                    readOnly
                    className="flex-1 p-2 border rounded"
                  />
                  <button 
                    onClick={copyShareUrl}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                  >
                    Nusxa olish
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowShareDialog(false)}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

export default PersonDetail;
