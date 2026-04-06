import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Compare from './pages/Compare';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="global-nav">
          <div className="nav-brand">ChronoLens</div>
          <div className="nav-links">
            <Link to="/">Timeline</Link>
            <Link to="/compare">Compare</Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/compare" element={<Compare />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
