import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function App() {
  const kisumuPosition: [number, number] = [-0.0917, 34.7680]; // Coordinates for Kisumu

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">NiWapi Resilience Platform</h1>
        <p className="text-sm">Kisumu County - Phase 1 Foundation</p>
      </header>

      {/* Main Map Container */}
      <main className="flex-1 bg-gray-100 relative">
        <MapContainer 
          center={kisumuPosition} 
          zoom={13} 
          scrollWheelZoom={true} 
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={kisumuPosition}>
            <Popup>
              Kisumu City Center. <br /> NiWapi Map Initialized.
            </Popup>
          </Marker>
        </MapContainer>
      </main>
    </div>
  );
}

export default App;
