import './Flights.css';
import { useState, useEffect } from 'react';

function Flights({ onBack, initialFilter = 'all', selectedFlightId = null }) {
  const [expandedFlight, setExpandedFlight] = useState(selectedFlightId);
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Effect to handle when a specific flight is selected from dashboard
  useEffect(() => {
    if (selectedFlightId) {
      setExpandedFlight(selectedFlightId);
      // Optional: scroll to the flight card
      setTimeout(() => {
        const flightElement = document.querySelector(`[data-flight-id="${selectedFlightId}"]`);
        if (flightElement) {
          flightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [selectedFlightId]);

  const flights = [
    {
      id: 'LX110',
      route: 'MTY-ZUR',
      departure: '14:30',
      status: 'Active',
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
      status: 'Pending',
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

  // Filter flights based on cart completion status
  const filteredFlights = flights.filter(flight => {
    if (statusFilter === 'all') return true;
    
    const completedCarts = flight.carts.filter(cart => cart.completed).length;
    const totalCarts = flight.carts.length;
    
    if (statusFilter === 'completed') {
      return completedCarts === totalCarts; // All carts completed
    } else if (statusFilter === 'active') {
      return completedCarts > 0 && completedCarts < totalCarts; // Some but not all completed
    } else if (statusFilter === 'pending') {
      return completedCarts === 0; // No carts completed
    }
    
    return true;
  });

  const filterOptions = [
    { value: 'all', label: 'All Flights' },
    { value: 'completed', label: 'Completed' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' }
    
  ];

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setShowFilterDropdown(false);
  };

  return (
    <div className="mobile-dashboard">
      {/* Page Title and Filter */}
      <div className="flights-header" style={{ 
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
          Flight Management
        </h1>
        
        {/* Filter Button */}
        <div className="filter-container" style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Filter
            <span style={{ fontSize: '12px' }}>
              {showFilterDropdown ? '▲' : '▼'}
            </span>
          </button>
          
          {/* Dropdown Menu */}
          {showFilterDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '180px'
            }}>
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: statusFilter === option.value ? 'var(--color-primary)' : 'transparent',
                    color: statusFilter === option.value ? 'white' : 'var(--color-text-main)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderRadius: statusFilter === option.value ? '6px' : '0',
                    margin: statusFilter === option.value ? '2px' : '0'
                  }}
                  onMouseEnter={(e) => {
                    if (statusFilter !== option.value) {
                      e.target.style.backgroundColor = 'var(--color-background)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (statusFilter !== option.value) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Flights List */}
      <section className="flights-list">
        {filteredFlights.map((flight, flightIndex) => {
          const completedCarts = flight.carts.filter(cart => cart.completed).length;
          const totalCarts = flight.carts.length;
          const cartProgress = (completedCarts / totalCarts) * 100;
          
          return (
            <div key={flight.id} className="flight-box" data-flight-id={flight.id}>
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