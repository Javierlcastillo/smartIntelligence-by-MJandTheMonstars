import { React, useEffect, useState } from 'react';
import Flights from '../structs/Flights';
import './Dashboard.css';
import { fetchFlightsData, fetchWarehouseStats } from '../lib/flightsService';
import DashboardCharts from '../components/DashboardCharts';


function Dashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [flightFilter, setFlightFilter] = useState('all');
  const [selectedFlightId, setSelectedFlightId] = useState(null);

  // Live data from database
  const [flights, setFlights] = useState([]);
  const [warehouse, setWarehouse] = useState({ totalProducts: 0, capacityPct: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [flightsData, warehouseStats] = await Promise.all([
          fetchFlightsData(),
          fetchWarehouseStats()
        ]);
        if (!mounted) return;
        setFlights(flightsData);
        setWarehouse(warehouseStats);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading dashboard data:', err);
        setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const flightsToday = flights.length;
  const flightsCompleted = flights.filter(f => f.status === 'Ready').length;
  const flightsActive = flights.filter(f => f.status === 'Active').length;
  const flightsPending = flights.filter(f => f.status === 'Pending').length;

  const upcomingFlights = flights
    .slice(0, 3)
    .map(f => ({
      id: f.id,
      route: f.route,
      departure: f.departure,
      carts: f.carts.length,
      completedCarts: f.carts.filter(c => c.completed).length,
      status: f.status
    }));

  const handleNavigateToFlights = (filter = 'all', flightId = null) => {
    setCurrentPage('flights');
    setFlightFilter(filter);
    setSelectedFlightId(flightId);
  };

  const handleNavigateToSpecificFlight = (flightId) => {
    setCurrentPage('flights');
    setFlightFilter('all');
    setSelectedFlightId(flightId);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setFlightFilter('all');
    setSelectedFlightId(null);
  };

  if (currentPage === 'flights') {
    return <Flights onBack={handleBackToDashboard} initialFilter={flightFilter} selectedFlightId={selectedFlightId} />;
  }
  return (
    <div className="dashboard-container">
      {/* Dashboard Title */}
      <div className="dashboard-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        position: 'relative'
      }}>
        <h1 style={{ 
          color: 'var(--color-primary)', 
          fontSize: '2rem', 
          fontWeight: 'bold',
          margin: 0
        }}>
          Dashboard
        </h1>
      </div>
      
      {/* Main metrics */}
      <section className="metrics-grid">
        <div className="metric-card primary" onClick={() => handleNavigateToFlights('all')}>
          <h3>{loading ? '—' : flightsToday}</h3>
          <p>Flights Today</p>
        </div>
        <div className="metric-card success clickable" onClick={() => handleNavigateToFlights('completed')}>
          <h3>{loading ? '—' : flightsCompleted}</h3>
          <p>Completed</p>
        </div>
        <div className="metric-card warning clickable" onClick={() => handleNavigateToFlights('active')}>
          <h3>{loading ? '—' : flightsActive}</h3>
          <p>Active</p>
        </div>
        <div className="metric-card danger clickable" onClick={() => handleNavigateToFlights('pending')}>
          <h3>{loading ? '—' : flightsPending}</h3>
          <p>Pending</p>
        </div>
      </section>

      {/* Warehouse status */}
      <div className="main-content">
        {/* Charts */}
        <DashboardCharts flights={flights} />



        {/* Upcoming Flights */}
        <section className="upcoming-flights">
          <h2>Upcoming Flights</h2>
          <div className="flights-container">
            {(loading ? [] : upcomingFlights).map((flight) => (
              <div key={flight.id} className="flight-card clickable" onClick={() => handleNavigateToSpecificFlight(flight.id)}>
                <div className="flight-layout">
                  <div className="flight-id-section">
                    <h3>{flight.id}</h3>
                    <span className={`flight-badge ${flight.status.toLowerCase()}`}>
                      {flight.status}
                    </span>
                  </div>
                  <div className="flight-info-section">
                    <p><strong>Route:</strong> {flight.route}</p>
                    <p><strong>Departure:</strong> {flight.departure}</p>
                    <p><strong>Carts:</strong> {flight.completedCarts}/{flight.carts} completed</p>
                  </div>
                </div>
                <div className="flight-action">
                  <span className="action-hint">Click to manage carts →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        </div>
        </div>
  );
}

export default Dashboard;
