import './Flights.css';
import { useState } from 'react';

function Flights({ onBack }) {
  const [expandedFlight, setExpandedFlight] = useState(null);

  const flights = [
    {
      id: 'LX110',
      route: 'MTY-ZUR',
      departure: '14:30',
      status: 'Preparing',
      carts: [
        {
          name: 'C-008',
          completed: false,
          requiredItems: [
            { item: 'Mineral Water 500ml', required: 120, loaded: 85, status: 'warning' },
            { item: 'Coffee Cups', required: 80, loaded: 80, status: 'complete' },
            { item: 'Snack Mix', required: 60, loaded: 45, status: 'danger' },
            { item: 'Soft Drinks', required: 100, loaded: 100, status: 'complete' }
          ]
        },
        {
          name: 'C-009',
          completed: true,
          requiredItems: [
            { item: 'Blankets', required: 50, loaded: 50, status: 'complete' },
            { item: 'Pillows', required: 30, loaded: 30, status: 'complete' },
            { item: 'Headphones', required: 120, loaded: 120, status: 'complete' }
          ]
        },
        {
          name: 'C-010',
          completed: false,
          requiredItems: [
            { item: 'Duty Free Items', required: 200, loaded: 150, status: 'warning' },
            { item: 'Magazines', required: 100, loaded: 0, status: 'danger' }
          ]
        }
      ]
    },
    {
      id: 'BA215',
      route: 'LHR-JFK',
      departure: '16:45',
      status: 'Ready',
      carts: [
        {
          name: 'C-012',
          completed: true,
          requiredItems: [
            { item: 'Mineral Water 500ml', required: 150, loaded: 150, status: 'complete' },
            { item: 'Coffee Cups', required: 100, loaded: 95, status: 'warning' },
            { item: 'Meal Trays', required: 80, loaded: 80, status: 'complete' },
            { item: 'Wine Bottles', required: 40, loaded: 25, status: 'danger' }
          ]
        },
        {
          name: 'C-013',
          completed: true,
          requiredItems: [
            { item: 'Business Class Meals', required: 20, loaded: 20, status: 'complete' },
            { item: 'Premium Wine', required: 15, loaded: 15, status: 'complete' }
          ]
        }
      ]
    },
    {
      id: 'AF890',
      route: 'CDG-LAX',
      departure: '22:15',
      status: 'Empty',
      carts: [
        {
          name: 'C-005',
          completed: false,
          requiredItems: [
            { item: 'Mineral Water 500ml', required: 200, loaded: 180, status: 'warning' },
            { item: 'Coffee Cups', required: 120, loaded: 120, status: 'complete' },
            { item: 'Premium Meals', required: 90, loaded: 60, status: 'danger' },
            { item: 'Champagne', required: 30, loaded: 30, status: 'complete' }
          ]
        },
        {
          name: 'C-006',
          completed: false,
          requiredItems: [
            { item: 'First Class Meals', required: 12, loaded: 0, status: 'danger' },
            { item: 'Luxury Amenities', required: 15, loaded: 0, status: 'danger' }
          ]
        },
        {
          name: 'C-007',
          completed: false,
          requiredItems: [
            { item: 'Economy Meals', required: 250, loaded: 100, status: 'danger' },
            { item: 'Snacks', required: 150, loaded: 50, status: 'danger' }
          ]
        }
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
      {/* Flights List */}
      <section className="flights-list">
        {flights.map((flight, flightIndex) => {
          const completedCarts = flight.carts.filter(cart => cart.completed).length;
          const totalCarts = flight.carts.length;
          const cartProgress = (completedCarts / totalCarts) * 100;
          
          return (
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
                  <div className="carts-progress">
                    <p><strong>Carts:</strong> {completedCarts}/{totalCarts} completed</p>
                    <div className="carts-progress-bar">
                      <div 
                        className="carts-progress-fill" 
                        style={{width: `${cartProgress}%`}}
                      ></div>
                    </div>
                  </div>
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
                  {flight.carts.map((cart, cartIndex) => (
                    <div key={cart.name} className="cart-section">
                      <div className="cart-header">
                        <h4>{cart.name}</h4>
                        <span className={`cart-status ${cart.completed ? 'completed' : 'pending'}`}>
                          {cart.completed ? '✓ Completed' : '⏳ Pending'}
                        </span>
                      </div>
                      <div className="required-items">
                        {cart.requiredItems.map((item, itemIndex) => (
                          <div key={itemIndex} className={`item-row ${item.status} interactive`}>
                            <div className="item-info">
                              <h5>{item.item}</h5>
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
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default Flights;