import React from 'react';
import Map from './Map';
import LandingApp from './landingpage'
import AddToilet from './addtoilet';
import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <div className="App">
          <Route path="/" element={ < Map /> }/>
          <Route path="/home" element={ < LandingApp /> } />
          <Route path="/add" element={ < AddToilet /> } />  
        </div>
      </Routes>
    </Router>
  );
}

export default App;
