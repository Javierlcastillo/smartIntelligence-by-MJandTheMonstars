import { React, useState} from 'react';
import Flights from '../structs/Flights';
import './Dashboard.css';


function Dashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [flightFilter, setFlightFilter] = useState('all');
  const [selectedFlightId, setSelectedFlightId] = useState(null);

  // Sample data for dashboard
  const dashboardData = {
    flightsToday: 20,
    flightsCompleted: 12,
    flightsActive: 3,
    flightsPending: 5,
    totalProducts: 156,
    warehouseCapacity: 85
  };

  const upcomingFlights = [
    {
      id: 'LX110',
      route: 'MTY-ZUR',
      departure: '14:30',
      carts: 3,
      completedCarts: 1,
      status: 'Active'
    },
    {
      id: 'BA215',
      route: 'LHR-JFK',
      departure: '16:45',
      carts: 2,
      completedCarts: 2,
      status: 'Ready'
    },
    {
      id: 'AF890',
      route: 'CDG-LAX',
      departure: '22:15',
      carts: 3,
      completedCarts: 0,
      status: 'Pending'
    }
  ];

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
          <h3>{dashboardData.flightsToday}</h3>
          <p>Flights Today</p>
        </div>
        <div className="metric-card success clickable" onClick={() => handleNavigateToFlights('completed')}>
          <h3>{dashboardData.flightsCompleted}</h3>
          <p>Completed</p>
        </div>
        <div className="metric-card warning clickable" onClick={() => handleNavigateToFlights('active')}>
          <h3>{dashboardData.flightsActive}</h3>
          <p>Active</p>
        </div>
        <div className="metric-card danger clickable" onClick={() => handleNavigateToFlights('pending')}>
          <h3>{dashboardData.flightsPending}</h3>
          <p>Pending</p>
        </div>
      </section>

      {/* Warehouse status */}
      <div className="main-content">
        <section className="inventory-status">
          <h2>Warehouse Status</h2>
          <div className="status-bar">
            <div className="status-fill" style={{width: `${dashboardData.warehouseCapacity}%`}}></div>
          </div>
          <div className="status-info">
            <span>{dashboardData.totalProducts} products</span>
            <span>{dashboardData.warehouseCapacity}% capacity</span>
          </div>
        </section>



        {/* Upcoming Flights */}
        <section className="upcoming-flights">
          <h2>Upcoming Flights</h2>
          <div className="flights-container">
            {upcomingFlights.map((flight) => (
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
