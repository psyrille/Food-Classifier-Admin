import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder"; // Correct import for Leaflet Control Geocoder

const SearchAddressInPhilippines = () => {
  const mapRef = useRef();
  const [address, setAddress] = useState(""); // State for the search input

  // Define the bounding box for the Philippines (approximate lat/lon bounds)
  const philippinesBounds = [
    [4.5, 116.5], // South-West corner (approx)
    [21.5, 126.5], // North-East corner (approx)
  ];

  const handleSearchChange = (e) => {
    setAddress(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (address.trim() !== "") {
      const geocoder = L.Control.Geocoder.nominatim(); // Correct geocoder initialization
      geocoder.geocode(address, (results) => {
        if (results && results.length > 0) {
          const { lat, lng } = results[0].center;
          const marker = L.marker([lat, lng]).addTo(mapRef.current);
          marker.bindPopup(results[0].name).openPopup();
          mapRef.current.setView([lat, lng], 12); // Set the map view to the searched location
        } else {
          alert("No results found");
        }
      });
    }
  };

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;

      // Add the geocoder control
      L.Control.Geocoder.nominatim().addTo(map); // Adds geocoder control to map

      // Set map bounds to restrict the map to the Philippines
      map.setMaxBounds(philippinesBounds);
    }
  }, []);

  return (
    <div>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit}>
        <input
          type="text"
          value={address}
          onChange={handleSearchChange}
          placeholder="Search for an address in the Philippines"
          style={{ padding: "10px", marginBottom: "20px", width: "100%" }}
        />
        <button type="submit">Search</button>
      </form>

      {/* Leaflet Map */}
      <MapContainer
        center={[12.8797, 121.774]} // Center the map in the Philippines
        zoom={6}
        style={{ height: "500px", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
    </div>
  );
};

export default SearchAddressInPhilippines;
