import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PersonDetail from './pages/PersonDetail';
import SharedTree from './pages/SharedTree';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/share/:token" element={<SharedTree />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          {/* 
            Route'lar ketma-ketligi juda muhim:
            1. Avval `/person/new` kabi aniq/specific route'lar kelishi kerak
            2. Keyin `/person/:id` kabi dynamic route'lar kelishi kerak
            
            Agar route'lar noto'g'ri ketma-ketlikda joylashtirilsa, 
            `/person/new` manzili `/person/:id` pattern'iga mos keladi 
            va id="new" sifatida ishlatiladi, bu esa backendga so'rov yuborishga olib keladi.
            
            Bu o'zgarish bilan frontend'ni qayta build qilganda, 
            yangi tugmasi backendga so'rov yubormasdan to'g'ri ishlaydi.
          */}
          <Route path="/person/:id" element={<PersonDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
