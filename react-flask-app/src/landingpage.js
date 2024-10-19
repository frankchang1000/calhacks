import React from 'react';
import './landingpage.css'; // You can style the buttons and layout here

function App() {
  // Handlers for button clicks (you can link to real routes or functionalities later)
  const handleSignUpClick = () => {
    alert("Navigate to Sign Up");
  };

  const handleAddDataClick = () => {
    alert("Navigate to Add Data");
  };

  const handleDashboardClick = () => {
    alert("Navigate to Dashboard");
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>Welcome to the App</h1>
        <p>Your gateway to amazing functionalities!</p>
      </header>

      <div className="button-container">
        <button className="landing-button" onClick={handleSignUpClick}>
          Sign Up
        </button>

        <button className="landing-button" onClick={handleAddDataClick}>
          Add Data
        </button>

        <button className="landing-button" onClick={handleDashboardClick}>
          Dashboard
        </button>
      </div>
    </div>
  );
}

export default App;
