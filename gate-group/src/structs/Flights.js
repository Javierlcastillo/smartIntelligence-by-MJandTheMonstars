import './Flights.css';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function Flights({ onBack, initialFilter = 'all', selectedFlightId = null }) {
  const [expandedFlight, setExpandedFlight] = useState(selectedFlightId);
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch flights, carts, required items and loaded counts from Supabase
  const fetchFlights = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Scheduled flights with flight info and assigned carts
      const { data: scheduledFlights, error: flightsError } = await supabase
        .from('scheduled_flight')
        .select(`
          scheduled_flight_id,
          departure_time,
          status,
          passenger_capacity,
          flight:flight_id (
            flight_id,
            airline,
            flight_number,
            origin_code,
            destination_code
          ),
          scheduled_flight_cart(
            sf_cart_id,
            status,
            sequence,
            role,
            cart:cart_id (
              cart_id,
              cart_type
            )
          )
        `)
        .order('departure_time', { ascending: true });

      if (flightsError) throw flightsError;

      // 2) Build flights structure
      const processedFlights = await Promise.all(
        (scheduledFlights || []).map(async (sf) => {
          const flightCode = `${sf.flight?.airline ?? ''}${sf.flight?.flight_number ?? ''}`.trim();
          const route = `${sf.flight?.origin_code ?? ''}-${sf.flight?.destination_code ?? ''}`;
          const departure = new Date(sf.departure_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

          const carts = await Promise.all(
            (sf.scheduled_flight_cart || []).map(async (sfc) => {
              const cartId = sfc.cart?.cart_id;
              const cartType = sfc.cart?.cart_type;

              // 2a) Find the most recent cart template for this cart type (prefer flight-specific)
              let templateId = null;
              const { data: specificTpl } = await supabase
                .from('cart_template')
                .select('template_id, created_at')
                .eq('cart_type', cartType)
                .eq('flight_id', sf.flight?.flight_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (specificTpl) {
                templateId = specificTpl.template_id;
              } else {
                const { data: genericTpl } = await supabase
                  .from('cart_template')
                  .select('template_id, created_at')
                  .eq('cart_type', cartType)
                  .is('flight_id', null)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                templateId = genericTpl?.template_id ?? null;
              }

              // 2b) Get required items from template
              let requiredItemsFromTpl = [];
              if (templateId) {
                const { data: tplItems, error: tplErr } = await supabase
                  .from('cart_template_item')
                  .select('qty, product_id, product:product_id(name)')
                  .eq('template_id', templateId);
                if (tplErr) throw tplErr;
                requiredItemsFromTpl = (tplItems || []).map((ti) => ({
                  productId: ti.product_id,
                  item: ti.product?.name || ti.product_id,
                  required: ti.qty
                }));
              }

              // 2c) Count loaded items currently on this cart by product
              const { data: loadedItems, error: loadedErr } = await supabase
                .from('product_item')
                .select('item_id, inventory_pallet(product_id)')
                .eq('cart_id', cartId);
              if (loadedErr) throw loadedErr;

              const loadedCountByProduct = {};
              (loadedItems || []).forEach((it) => {
                const pid = it.inventory_pallet?.product_id;
                if (!pid) return;
                loadedCountByProduct[pid] = (loadedCountByProduct[pid] || 0) + 1;
              });

              // 2d) Merge required with loaded counts
              const requiredItems = requiredItemsFromTpl.map((ri) => {
                const loaded = loadedCountByProduct[ri.productId] || 0;
                let status = 'complete';
                if (loaded < ri.required) status = loaded === 0 ? 'danger' : 'warning';
                return { ...ri, loaded, status };
              });

              const completed = requiredItems.length > 0 && requiredItems.every((ri) => ri.loaded >= ri.required);

              return {
                name: cartId,
                cartId,
                cartType,
                completed,
                requiredItems
              };
            })
          );

          const completedCarts = carts.filter((c) => c.completed).length;
          const totalCarts = carts.length || 0;
          const flightStatus = totalCarts > 0
            ? (completedCarts === totalCarts ? 'Ready' : (completedCarts > 0 ? 'Active' : 'Pending'))
            : 'Pending';

          return {
            id: flightCode || sf.scheduled_flight_id,
            route,
            departure,
            status: flightStatus,
            carts
          };
        })
      );

      setFlights(processedFlights);
    } catch (err) {
      console.error('Error fetching flights:', err);
      setError(err.message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

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

  const handleUpdateItem = async (flightIndex, cartIndex, itemIndex, newLoaded) => {
    try {
      const flight = flights[flightIndex];
      const cart = flight.carts[cartIndex];
      const item = cart.requiredItems[itemIndex];

      const currentLoaded = item.loaded;
      const diff = newLoaded - currentLoaded;
      const productId = item.productId;

      if (diff > 0) {
        // Move items from warehouse to cart
        const { data: available, error: availErr } = await supabase
          .from('product_item')
          .select('item_id, inventory_pallet(product_id)')
          .is('cart_id', null)
          .eq('inventory_pallet.product_id', productId)
          .limit(diff);
        if (availErr) throw availErr;

        const ids = (available || []).map((a) => a.item_id);
        if (ids.length > 0) {
          const { error: updErr } = await supabase
            .from('product_item')
            .update({ cart_id: cart.cartId, status: 'ok' })
            .in('item_id', ids);
          if (updErr) throw updErr;
        }
      } else if (diff < 0) {
        // Move items from cart back to warehouse
        const toRemove = Math.abs(diff);
        const { data: onCart, error: onCartErr } = await supabase
          .from('product_item')
          .select('item_id, inventory_pallet(product_id)')
          .eq('cart_id', cart.cartId)
          .eq('inventory_pallet.product_id', productId)
          .limit(toRemove);
        if (onCartErr) throw onCartErr;

        const ids = (onCart || []).map((a) => a.item_id);
        if (ids.length > 0) {
          const { error: updErr } = await supabase
            .from('product_item')
            .update({ cart_id: null })
            .in('item_id', ids);
          if (updErr) throw updErr;
        }
      }

      await fetchFlights();
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message);
    }
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
                                onClick={() => handleUpdateItem(flightIndex, cartIndex, itemIndex, Math.max(0, item.loaded - 1))}
                              >
                                -
                              </button>
                              <span className="quantity">{item.loaded}</span>
                              <button 
                                className="action-btn-small increase"
                                onClick={() => handleUpdateItem(flightIndex, cartIndex, itemIndex, Math.min(item.required, item.loaded + 1))}
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