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
  
  const handlePersonChange = async (e) => {
    const personId = e.target.value;
    setSelectedPerson(personId);
    await fetchFamilyTree(personId);
  };
  
  if (loading) return <div className="text-center py-10">Yuklanmoqda...</div>;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Sizning avlodlar daraxtingiz</h1>
        
        {error && <p className="text-red-500">{error}</p>}
        
        {people.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">Hali oila a'zolari kiritilmagan</p>
            <Link
              to="/profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Oila a'zolarini qo'shing
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <label htmlFor="person-select" className="block text-sm font-medium text-gray-700 mb-2">
                Ildiz sifatida ko'rish uchun oila a'zosini tanlang:
              </label>
              <select
                id="person-select"
                value={selectedPerson || ''}
                onChange={handlePersonChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {people.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="h-[700px] border rounded-lg p-4">
              {treeLoading ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">Shajara daraxti yuklanmoqda...</p>
                </div>
              ) : treeData ? (
                <FamilyTreeView data={treeData} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">Shajara daraxti ma'lumotlari mavjud emas</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
