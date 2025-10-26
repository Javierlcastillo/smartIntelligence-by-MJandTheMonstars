import { React, useState} from 'react';
import Flights from '../structs/Flights';


function Dashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Sample data for dashboard
  const dashboardData = {
    flightsToday: 8,
    activeCartridge: 12,
    lowStock: 3,
    expiringSoon: 5,
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
      status: 'Preparing'
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

  const handleNavigateToFlights = () => {
    setCurrentPage('flights');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'flights') {
    return <Flights onBack={handleBackToDashboard} />;
  }
  return (
    <div className="dashboard-container">
      {/* Main metrics */}
      <section className="metrics-grid">
        <div className="metric-card primary">
          <h3>{dashboardData.flightsToday}</h3>
          <p>Flights Today</p>
        </div>
        <div className="metric-card success">
          <h3>{dashboardData.activeCartridge}</h3>
          <p>Completed Flights</p>
        </div>
        <div className="metric-card warning">
          <h3>{dashboardData.lowStock}</h3>
          <p>Upcoming Flights</p>
        </div>
        <div className="metric-card danger">
          <h3>{dashboardData.expiringSoon}</h3>
          <p>Finished Flights</p>
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
              <div key={flight.id} className="flight-card clickable" onClick={handleNavigateToFlights}>
                <div className="flight-header">
                  <h3>{flight.id}</h3>
                  <span className={`flight-badge ${flight.status.toLowerCase()}`}>
                    {flight.status}
                  </span>
                </div>
                <div className="flight-details">
                  <p><strong>Route:</strong> {flight.route}</p>
                  <p><strong>Departure:</strong> {flight.departure}</p>
                  <p><strong>Carts:</strong> {flight.completedCarts}/{flight.carts} completed</p>
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
