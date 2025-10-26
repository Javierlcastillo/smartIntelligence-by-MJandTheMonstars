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

  const nextFlight = {
    id: 'LX110',
    route: 'MTY-ZUR',
    departure: '14:30',
    cart: 'C-008',
    status: 'Preparing'
  };

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
    <div>
      

      {/* Main metrics */}
      <section className="metrics-grid">
        <div className="metric-card primary">
          <h3>{dashboardData.flightsToday}</h3>
          <p>Flights Today</p>
        </div>
        <div className="metric-card success">
          <h3>{dashboardData.activeCartridge}</h3>
          <p>Completed Carts</p>
        </div>
        <div className="metric-card warning">
          <h3>{dashboardData.lowStock}</h3>
          <p>Carts to Complete</p>
        </div>
        <div className="metric-card danger">
          <h3>{dashboardData.expiringSoon}</h3>
          <p>Finished Carts</p>
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



        {/* Next Flight */}
        <section className="next-flight">
          <h2>Next Flight</h2>
          <div className="flight-card clickable" onClick={handleNavigateToFlights}>
            <div className="flight-header">
              <h3>{nextFlight.id}</h3>
              <span className={`flight-badge ${nextFlight.status.toLowerCase()}`}>
                {nextFlight.status}
              </span>
            </div>
            <div className="flight-details">
              <p><strong>Route:</strong> {nextFlight.route}</p>
              <p><strong>Departure:</strong> {nextFlight.departure}</p>
              <p><strong>Cart:</strong> {nextFlight.cart}</p>
            </div>
            <div className="flight-action">
              <span className="action-hint">Click to fill order →</span>
            </div>
          </div>
        </section>
        </div>
        </div>
  );
}

export default Dashboard;
