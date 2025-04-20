import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import FamilyTreeView from '../components/FamilyTreeView';

const SharedTree = () => {
  const { token } = useParams();
  const [treeData, setTreeData] = useState(null);
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setLoading(true);
        
        // API_URL ni .env faylidan olish
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
        
        // Shaxs ma'lumotlarini olish (faqat asosiy nom uchun)
        const personResponse = await axios.get(`${API_URL}/share/${token}/person`);
        setPerson(personResponse.data);
        
        // Daraxt ma'lumotlarini olish
        const treeResponse = await axios.get(`${API_URL}/share/${token}/tree`);
        setTreeData(treeResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Ulashilgan ma\'lumotlarni yuklashda xatolik:', err);
        setError('Ushbu ulashilgan shajara mavjud emas yoki o\'chirilgan');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedData();
  }, [token]);
  
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
      </div>
      <Link to="/" className="text-blue-500 hover:text-blue-700">
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
  
  if (!person || !treeData) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p>Ma'lumot topilmadi</p>
      </div>
      <Link to="/" className="text-blue-500 hover:text-blue-700">
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{person.full_name} shajara daraxti</h1>
            <p className="text-gray-600">Ulashilgan shajara</p>
          </div>
          <Link 
            to="/" 
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            Bu sizga ulashilgan avlodlar daraxti. Siz uni faqat ko'rishingiz mumkin.
          </p>
        </div>
        
        <div className="h-[700px] border rounded-lg overflow-hidden">
          <FamilyTreeView data={treeData} readOnly={true} />
        </div>
      </div>
    </div>
  );
};

export default SharedTree;
