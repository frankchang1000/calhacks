import React from 'react';
import './App.css';
import Map from './Map';

function App() {
  return (
    /*
    <Router>
      <Routes>
        <div className="App">
          
          <Route path="/" element={ < Map /> }/>
          <Route path="/home" element={ < LandingApp /> } />
          <Route path="/add" element={ < AddToilet /> } />  
        </div>
      </Routes>
    </Router>*/
    <Map />
  );
}

export default App;