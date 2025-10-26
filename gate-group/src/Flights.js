import './App.css';
import { useState } from 'react';

function Flights({ onBack }) {
  const [expandedFlight, setExpandedFlight] = useState(null);

  const flights = [
    {
      id: 'LX110',
      route: 'MTY-ZUR',
      departure: '14:30',
      cart: 'C-008',
      status: 'Preparing',
      requiredItems: [
        { item: 'Mineral Water 500ml', required: 120, loaded: 85, status: 'warning' },
        { item: 'Coffee Cups', required: 80, loaded: 80, status: 'complete' },
        { item: 'Snack Mix', required: 60, loaded: 45, status: 'danger' },
        { item: 'Soft Drinks', required: 100, loaded: 100, status: 'complete' }
      ]
    },
    {
      id: 'BA215',
      route: 'LHR-JFK',
      departure: '16:45',
      cart: 'C-012',
      status: 'Ready',
      requiredItems: [
        { item: 'Mineral Water 500ml', required: 150, loaded: 150, status: 'complete' },
        { item: 'Coffee Cups', required: 100, loaded: 95, status: 'warning' },
        { item: 'Meal Trays', required: 80, loaded: 80, status: 'complete' },
        { item: 'Wine Bottles', required: 40, loaded: 25, status: 'danger' }
      ]
    },
    {
      id: 'AF890',
      route: 'CDG-LAX',
      departure: '22:15',
      cart: 'C-005',
      status: 'Empty',
      requiredItems: [
        { item: 'Mineral Water 500ml', required: 200, loaded: 180, status: 'warning' },
        { item: 'Coffee Cups', required: 120, loaded: 120, status: 'complete' },
        { item: 'Premium Meals', required: 90, loaded: 60, status: 'danger' },
        { item: 'Champagne', required: 30, loaded: 30, status: 'complete' }
      ]
    }
  ];

  const handleBackToDashboard = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const toggleFlightExpansion = (flightId) => {
    setExpandedFlight(expandedFlight === flightId ? null : flightId);
  };

  const handleUpdateItem = (flightIndex, itemIndex, newLoaded) => {
    // This would update the loaded quantity in a real app
    console.log(`Updating flight ${flightIndex}, item ${itemIndex} to ${newLoaded}`);
  };

  return (
    <div className="mobile-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-branding">
          <h1>Smart Intelligence</h1>
          <p>Inventory Dashboard</p>
        </div>
        <nav className="header-navigation">
          <button className="nav-btn secondary" onClick={handleBackToDashboard}>
            Inventory
          </button>
          <button className="nav-btn primary">
            Flights
          </button>
          <button className="nav-btn tertiary">
            Reports
          </button>
          <button className="nav-btn quaternary">
            Settings
          </button>
        </nav>
      </header>

      {/* Flights List */}
      <section className="flights-list">
        {flights.map((flight, flightIndex) => (
          <div key={flight.id} className="flight-box">
            <div className="flight-header-info">
              <div className="flight-main-info">
                <h3>{flight.id}</h3>
                <span className={`flight-badge ${flight.status.toLowerCase()}`}>
                  {flight.status}
                </span>
              </div>
              <div className="flight-details-inline">
                <p><strong>Route:</strong> {flight.route}</p>
                <p><strong>Departure:</strong> {flight.departure}</p>
                <p><strong>Cart:</strong> {flight.cart}</p>
              </div>
              <button 
                className="expand-btn"
                onClick={() => toggleFlightExpansion(flight.id)}
              >
                {expandedFlight === flight.id ? '▲ Hide Items' : '▼ Show Items'}
              </button>
            </div>

            {/* Expandable Items Section */}
            {expandedFlight === flight.id && (
              <div className="flight-items-expanded">
                <div className="required-items">
                  {flight.requiredItems.map((item, itemIndex) => (
                    <div key={itemIndex} className={`item-row ${item.status} interactive`}>
                      <div className="item-info">
                        <h4>{item.item}</h4>
                        <p>{item.loaded}/{item.required} loaded</p>
                      </div>
                      <div className="item-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{width: `${(item.loaded / item.required) * 100}%`}}
                          ></div>
                        </div>
                        <span className={`item-status ${item.status}`}>
                          {item.status === 'complete' ? '✓' : 
                           item.status === 'warning' ? '⚠' : '!'}
                        </span>
                      </div>
                      <div className="item-actions">
                        <button 
                          className="action-btn-small decrease"
                          onClick={() => handleUpdateItem(flightIndex, itemIndex, Math.max(0, item.loaded - 1))}
                        >
                          -
                        </button>
                        <span className="quantity">{item.loaded}</span>
                        <button 
                          className="action-btn-small increase"
                          onClick={() => handleUpdateItem(flightIndex, itemIndex, Math.min(item.required, item.loaded + 1))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

export default Flights;