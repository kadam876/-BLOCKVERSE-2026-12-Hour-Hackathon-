import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import VideoDetect from './pages/VideoDetect.jsx';
import AlertHistory from './pages/AlertHistory.jsx';
import Locations from './pages/Locations.jsx';
import LocationDetail from './pages/LocationDetail.jsx';
import LiveCamera from './pages/LiveCamera.jsx';
import Suspects from './pages/Suspects.jsx';
import SuspectDetail from './pages/SuspectDetail.jsx';
import Cameras from './pages/Cameras.jsx';
import VehicleTracking from './pages/VehicleTracking.jsx';
import VehiclePathDetail from './pages/VehiclePathDetail.jsx';


export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <h1>🚨 Crowd Alert System</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/detect">Detect</NavLink>
          <NavLink to="/cameras">Cameras</NavLink>
          <NavLink to="/vehicles">Vehicles</NavLink>
          <NavLink to="/suspects">Person Identity</NavLink>
          <NavLink to="/alerts">Alerts</NavLink>
          <NavLink to="/locations">Locations</NavLink>
        </nav>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/detect" element={<VideoDetect />} />
        <Route path="/cameras" element={<Cameras />} />
        <Route path="/vehicles" element={<VehicleTracking />} />
        <Route path="/vehicles/:vehicleId" element={<VehiclePathDetail />} />
        <Route path="/live" element={<LiveCamera />} />
        <Route path="/suspects" element={<Suspects />} />
        <Route path="/suspects/:id" element={<SuspectDetail />} />
        <Route path="/alerts" element={<AlertHistory />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/locations/:id" element={<LocationDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
