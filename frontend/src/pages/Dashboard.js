import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FamilyTreeView from '../components/FamilyTreeView';

const Dashboard = () => {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Select the first person by default if available
        if (response.data.length > 0 && !selectedPerson) {
          setSelectedPerson(response.data[0]);
          fetchTreeData(response.data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching people:', err);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
        setLoading(false);
      }
    };

    fetchPeople();
  }, [selectedPerson]);

  // Fetch tree data for selected person
  const fetchTreeData = async (personId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/people/${personId}/tree`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTreeData(response.data);
    } catch (err) {
      console.error('Error fetching tree data:', err);
      setError('Avlodlar daraxtini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Handle person selection
  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
    fetchTreeData(person.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sizning avlodlar daraxtingiz</h1>
        <Link
          to="/profile"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Profilni tahrirlash
        </Link>
      </div>

      {people.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sizda hali avlodlar daraxti mavjud emas</h3>
          <p className="text-gray-500 mb-6">O'zingiz haqingizda ma'lumot qo'shing va avlodlar daraxtini boshlang.</p>
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            O'zingiz haqingizda ma'lumot qo'shing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Odamlar ro'yxati</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Kerakli odamni tanlang</p>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {people.map((person) => (
                  <li key={person.id}>
                    <button
                      onClick={() => handlePersonSelect(person)}
                      className={`w-full text-left px-4 py-4 flex items-center hover:bg-gray-50 ${
                        selectedPerson?.id === person.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      {person.photo_url ? (
                        <img
                          src={person.photo_url}
                          alt={person.full_name}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-800 font-medium">
                            {person.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm text-gray-900">{person.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {person.birth_date && `Tug'ilgan: ${new Date(person.birth_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-4 py-3">
              <Link
                to="/profile"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                + Yangi shaxs qo'shish
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                <p className="text-red-500">{error}</p>
              </div>
            ) : selectedPerson ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedPerson.full_name}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Avlodlar daraxti</p>
                  </div>
                  <Link
                    to={`/person/${selectedPerson.id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    Batafsil ko'rish
                  </Link>
                </div>
                <div className="border-t border-gray-200">
                  {treeData ? (
                    <div className="tree-container">
                      <FamilyTreeView data={treeData} />
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Bu shaxs uchun avlodlar daraxti mavjud emas</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                <p className="text-gray-500">Ko'rish uchun shaxsni tanlang</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
