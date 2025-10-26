import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PalletForm from './pages/PalletForm';
import ItemScanner from './pages/ItemScanner';
import Dashboard from './pages/Dashboard';
import Header from './components/Header'
import './App.css';

function App() {

  return (
    <div className="App">
      <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pallet" element={<PalletForm />} />
        <Route path="/scanner" element={<ItemScanner />} />
        <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
      </div>
  );
}

export default App;
