import React, { useState } from 'react';
import './AddToilet.css'; // Include a custom CSS file for styling

function AddToilet() {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState('');

  // Handle image input change
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImage(file);
  };

  // Handle location input change
  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };

  // Handle form submit
  const handleSubmit = (event) => {
    event.preventDefault();
    if (image && location) {
      console.log('Image:', image);
      console.log('Location:', location);
      // You can send this data to your server or handle it as needed
      alert('Form submitted!');
    } else {
      alert('Please fill out all fields.');
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label htmlFor="image">Upload Image</label>
          <input type="file" accept="image/*" id="image" onChange={handleImageChange} />
        </div>

        <div className="form-control">
          <label htmlFor="location">Enter Location</label>
          <input 
            type="text" 
            id="location" 
            placeholder="Enter location" 
            value={location} 
            onChange={handleLocationChange} 
          />
        </div>

        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>
    </div>
  );
}

export default AddToilet;
