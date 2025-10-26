import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './Reports.css';

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

const STATUS_COLORS = {
  planned: '#64748b',
  boarding: '#0ea5e9',
  departed: '#22c55e',
  delayed: '#f59e0b',
  cancelled: '#ef4444'
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('executive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Executive dashboard state
  const [flightsTodayByStatus, setFlightsTodayByStatus] = useState({});
  const [cartStatusToday, setCartStatusToday] = useState({});
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [weeklyWastageValue, setWeeklyWastageValue] = useState(0);
  const [atRiskFlights, setAtRiskFlights] = useState([]);

  // Flight Ops state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyFlights, setDailyFlights] = useState([]);
  const [expandedFlightId, setExpandedFlightId] = useState(null);

  // Inventory state
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [expiryHorizonDays, setExpiryHorizonDays] = useState(7);
  const [expiryRisk, setExpiryRisk] = useState([]);
  const [pallets, setPallets] = useState([]);

  const lowStockThreshold = 20;

  // Executive computed KPIs
  const totalFlightsToday = useMemo(() => Object.values(flightsTodayByStatus || {}).reduce((a, b) => a + Number(b || 0), 0), [flightsTodayByStatus]);
  const delayedFlights = Number(flightsTodayByStatus?.delayed || 0);
  const cancelledFlights = Number(flightsTodayByStatus?.cancelled || 0);
  const onTimeFlights = Math.max(totalFlightsToday - delayedFlights - cancelledFlights, 0);
  const onTimeRate = totalFlightsToday ? Math.round((onTimeFlights / totalFlightsToday) * 100) : 0;

  const totalCartsToday = useMemo(() => Object.values(cartStatusToday || {}).reduce((a, b) => a + Number(b || 0), 0), [cartStatusToday]);
  const loadedCarts = Number((cartStatusToday?.loaded || 0)) + Number((cartStatusToday?.sealed || 0));
  const loadedRate = totalCartsToday ? Math.round((loadedCarts / totalCartsToday) * 100) : 0;

  const refreshExecutive = async () => {
    setError(null);
    try {
      const now = new Date();
      const s = startOfDay(now);
      const e = endOfDay(now);

      // Flights today by status
      const { data: todayFlights, error: fErr } = await supabase
        .from('scheduled_flight')
        .select('scheduled_flight_id, status, departure_time, flight:flight_id(airline, flight_number)')
        .gte('departure_time', s)
        .lte('departure_time', e);
      if (fErr) throw fErr;
      const fByStatus = todayFlights.reduce((acc, f) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
      }, {});
      setFlightsTodayByStatus(fByStatus);

      // Cart loading status today
      const todayIds = todayFlights.map((f) => f.scheduled_flight_id);
      let cartsStatus = {};
      if (todayIds.length) {
        const { data: sfc, error: sfcErr } = await supabase
          .from('scheduled_flight_cart')
          .select('status, scheduled_flight_id')
          .in('scheduled_flight_id', todayIds);
        if (sfcErr) throw sfcErr;
        cartsStatus = sfc.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {});
      }
      setCartStatusToday(cartsStatus);

      // Total inventory value (items in warehouse => cart_id is null)
      const { data: itemsWh, error: itemsErr } = await supabase
        .from('product_item')
        .select('item_id, inventory_pallet(product_id)')
        .is('cart_id', null);
      if (itemsErr) throw itemsErr;
      const countByProduct = itemsWh.reduce((acc, it) => {
        const pid = it.inventory_pallet?.product_id;
        if (!pid) return acc;
        acc[pid] = (acc[pid] || 0) + 1;
        return acc;
      }, {});
      const productIds = Object.keys(countByProduct);
      let totalValue = 0;
      if (productIds.length) {
        const { data: prices, error: priceErr } = await supabase
          .from('product')
          .select('product_id, unit_cost')
          .in('product_id', productIds);
        if (priceErr) throw priceErr;
        const priceMap = new Map(prices.map((p) => [p.product_id, Number(p.unit_cost || 0)]));
        totalValue = productIds.reduce((sum, pid) => sum + (countByProduct[pid] * (priceMap.get(pid) || 0)), 0);
      }
      setTotalInventoryValue(totalValue);

      // Weekly wastage cost (expired or damaged)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: waste, error: wasteErr } = await supabase
        .from('product_item')
        .select('item_id, updated_at, inventory_pallet(product_id)')
        .in('status', ['expired', 'damaged'])
        .gte('updated_at', sevenDaysAgo);
      if (wasteErr) throw wasteErr;
      const wasteCountByProduct = waste.reduce((acc, it) => {
        const pid = it.inventory_pallet?.product_id;
        if (!pid) return acc;
        acc[pid] = (acc[pid] || 0) + 1;
        return acc;
      }, {});
      let wasteValue = 0;
      const wasteIds = Object.keys(wasteCountByProduct);
      if (wasteIds.length) {
        const { data: wPrices, error: wPriceErr } = await supabase
          .from('product')
          .select('product_id, unit_cost')
          .in('product_id', wasteIds);
        if (wPriceErr) throw wPriceErr;
        const wPriceMap = new Map(wPrices.map((p) => [p.product_id, Number(p.unit_cost || 0)]));
        wasteValue = wasteIds.reduce((sum, pid) => sum + (wasteCountByProduct[pid] * (wPriceMap.get(pid) || 0)), 0);
      }
      setWeeklyWastageValue(wasteValue);

      // At-Risk flights (next 3 hours, carts not sealed)
      const threeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
      const { data: nearFlights, error: nfErr } = await supabase
        .from('scheduled_flight')
        .select('scheduled_flight_id, departure_time, flight:flight_id(airline, flight_number), scheduled_flight_cart(status)')
        .gte('departure_time', now.toISOString())
        .lte('departure_time', threeHours);
      if (nfErr) throw nfErr;
      const atRisk = (nearFlights || [])
        .filter((f) => (f.scheduled_flight_cart || []).some((c) => c.status !== 'sealed'))
        .map((f) => ({
          id: f.scheduled_flight_id,
          code: `${f.flight?.airline ?? ''}${f.flight?.flight_number ?? ''}`,
          departure: formatTime(f.departure_time)
        }));
      setAtRiskFlights(atRisk);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const refreshDailySchedule = async () => {
    setError(null);
    try {
      const s = startOfDay(selectedDate);
      const e = endOfDay(selectedDate);
      const { data: sFlights, error: sErr } = await supabase
        .from('scheduled_flight')
        .select('scheduled_flight_id, status, departure_time, passenger_capacity, flight:flight_id(airline, flight_number, destination_code) , scheduled_flight_cart(status, role, sequence, cart:cart_id(cart_id,cart_type))')
        .gte('departure_time', s)
        .lte('departure_time', e)
        .order('departure_time');
      if (sErr) throw sErr;

      const mapped = (sFlights || []).map((sf) => {
        const sfc = sf.scheduled_flight_cart || [];
        const total = sfc.length;
        const loaded = sfc.filter((c) => ['loaded', 'sealed'].includes(c.status)).length;
        return {
          id: sf.scheduled_flight_id,
          code: `${sf.flight?.airline ?? ''}${sf.flight?.flight_number ?? ''}`,
          destination: sf.flight?.destination_code ?? '',
          departure: formatTime(sf.departure_time),
          status: sf.status,
          passengerCapacity: sf.passenger_capacity,
          progress: { loaded, total },
          carts: sfc
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((c) => ({
              name: c.cart?.cart_id,
              role: c.role,
              sequence: c.sequence,
              status: c.status,
              cartType: c.cart?.cart_type
            }))
        };
      });
      setDailyFlights(mapped);
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshWarehouse = async () => {
    setError(null);
    try {
      // warehouse_inventory view
      const { data: inv, error: invErr } = await supabase
        .from('warehouse_inventory')
        .select('product_id, total_quantity');
      if (invErr) throw invErr;
      const ids = inv.map((r) => r.product_id);
      const { data: products, error: pErr } = await supabase
        .from('product')
        .select('product_id, name, unit_cost')
        .in('product_id', ids);
      if (pErr) throw pErr;
      const map = new Map(products.map((p) => [p.product_id, p]));
      const rows = inv.map((r) => {
        const p = map.get(r.product_id) || {};
        const unit = Number(p.unit_cost || 0);
        return {
          productId: r.product_id,
          name: p.name || r.product_id,
          totalQuantity: r.total_quantity,
          unitCost: unit,
          totalValue: unit * r.total_quantity
        };
      });
      setWarehouseInventory(rows);

      // Expiration risk
      const horizonDate = new Date();
      horizonDate.setDate(horizonDate.getDate() + Number(expiryHorizonDays || 7));
      const { data: expItems, error: expErr } = await supabase
        .from('product_item')
        .select('item_id, expiration_date, inventory_pallet(product_id)')
        .lte('expiration_date', horizonDate.toISOString().slice(0, 10));
      if (expErr) throw expErr;
      const groups = {};
      (expItems || []).forEach((it) => {
        const pid = it.inventory_pallet?.product_id;
        if (!pid || !it.expiration_date) return;
        const key = `${pid}__${it.expiration_date}`;
        groups[key] = (groups[key] || 0) + 1;
      });
      const uniquePids = [...new Set(Object.keys(groups).map((k) => k.split('__')[0]))];
      const { data: names } = await supabase
        .from('product')
        .select('product_id, name')
        .in('product_id', uniquePids);
      const nameMap = new Map((names || []).map((n) => [n.product_id, n.name]));
      const expRows = Object.entries(groups).map(([key, qty]) => {
        const [pid, date] = key.split('__');
        return { productId: pid, name: nameMap.get(pid) || pid, expirationDate: date, quantity: qty };
      }).sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
      setExpiryRisk(expRows);

      // Pallet details
      const { data: pal, error: palErr } = await supabase
        .from('inventory_pallet')
        .select('pallet_id, expiration_date, in_warehouse, product:product_id(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (palErr) throw palErr;
      const palletRows = (pal || []).map((p) => ({
        palletId: p.pallet_id,
        productName: p.product?.name || '',
        expirationDate: p.expiration_date || '',
        inWarehouse: !!p.in_warehouse
      }));
      setPallets(palletRows);
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshExecutive(),
        refreshDailySchedule(),
        refreshWarehouse()
      ]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try { await refreshDailySchedule(); } finally { setLoading(false); }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try { await refreshWarehouse(); } finally { setLoading(false); }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiryHorizonDays]);

  const filteredInventory = useMemo(() => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return warehouseInventory;
    return warehouseInventory.filter((r) => r.name.toLowerCase().includes(q));
  }, [inventorySearch, warehouseInventory]);

  return (
    <div className="reports-page">
      {loading && (
        <div className="loading-overlay" aria-live="polite" aria-busy="true">
          <div className="spinner" />
        </div>
      )}
      <div className="reports-header">
        <div className="title-group">
          <h1>Reports</h1>
          <div className="subtle">{lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}</div>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={refreshAll} title="Refresh all">Refresh</button>
        </div>
        <div className="tabs">
          {[
            { id: 'executive', label: 'Executive' },
            { id: 'ops', label: 'Flight Ops' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'health', label: 'System Health' }
          ].map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {activeTab === 'executive' && (
        <section className="exec-grid">
          {/* Stat cards row */}
          <div className="card stat-card accent-blue col-span-4">
            <div className="stat-left">
              <div className="stat-icon">✈︎</div>
              <div>
                <div className="stat-title">Flights Today</div>
                <div className="stat-subtext">Delayed {delayedFlights} • Cancelled {cancelledFlights}</div>
              </div>
            </div>
            <div className="stat-value">{totalFlightsToday}</div>
          </div>

          <div className="card stat-card accent-green col-span-4">
            <div className="stat-left">
              <div className="stat-icon">⏱</div>
              <div>
                <div className="stat-title">On‑time Rate</div>
                <div className="stat-subtext">of today's flights</div>
              </div>
            </div>
            <div className="stat-right">
              <div className="ring ring-brand" style={{ ['--percent']: onTimeRate }}>
                <div className="ring-center">{onTimeRate}%</div>
              </div>
            </div>
          </div>

          <div className="card stat-card accent-indigo col-span-4">
            <div className="stat-left">
              <div className="stat-icon">📦</div>
              <div>
                <div className="stat-title">Carts Loaded</div>
                <div className="stat-subtext">loaded or sealed today</div>
              </div>
            </div>
            <div className="stat-right">
              <div className="ring ring-brand" style={{ ['--percent']: loadedRate }}>
                <div className="ring-center">{loadedRate}%</div>
              </div>
            </div>
          </div>

          {/* Detail cards */}
          <div className="card col-span-6">
            <h3>Flights by Status</h3>
            <div className="kpi-row">
              {Object.keys(flightsTodayByStatus).length === 0 && <p>No flights today</p>}
              {Object.entries(flightsTodayByStatus).map(([status, count]) => (
                <div key={status} className="kpi-chip" style={{ backgroundColor: `${STATUS_COLORS[status] || '#e2e8f0'}20`, borderColor: STATUS_COLORS[status] || '#94a3b8' }}>
                  <span className="kpi-label">{status}</span>
                  <span className="kpi-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card col-span-6">
            <h3>Cart Loading Status (Today)</h3>
            <div className="kpi-row">
              {Object.keys(cartStatusToday).length === 0 && <p>No carts assigned today</p>}
              {Object.entries(cartStatusToday).map(([status, count]) => (
                <div key={status} className="kpi-chip alt">
                  <span className="kpi-label">{status}</span>
                  <span className="kpi-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card col-span-6">
            <h3>Total Inventory Value</h3>
            <div className="big-kpi">${totalInventoryValue.toFixed(2)}</div>
          </div>

          <div className="card col-span-6">
            <h3>Weekly Wastage Cost</h3>
            <div className="big-kpi">${weeklyWastageValue.toFixed(2)}</div>
          </div>

          <div className="card col-span-12">
            <h3>At-Risk Flights (Next 3h)</h3>
            {atRiskFlights.length === 0 ? (
              <p>All good for the next 3 hours.</p>
            ) : (
              <ul className="list">
                {atRiskFlights.map((f) => (
                  <li key={f.id} className="list-row">
                    <span className="mono">{f.code || f.id}</span>
                    <span className="muted">Departs {f.departure}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {activeTab === 'ops' && (
        <section>
          <div className="toolbar">
            <label>
              Date
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </label>
          </div>
          <div className="table">
            <div className="thead">
              <div>Flight</div>
              <div>Destination</div>
              <div>Departure</div>
              <div>Status</div>
              <div>Passengers</div>
              <div>Cart Loading</div>
            </div>
            {dailyFlights.length === 0 && (
              <div className="empty-state">No flights scheduled for this date.</div>
            )}
            {(dailyFlights || []).map((f) => (
              <div key={f.id} className="trow" onClick={() => setExpandedFlightId(expandedFlightId === f.id ? null : f.id)}>
                <div className="mono">{f.code || f.id}</div>
                <div>{f.destination}</div>
                <div>{f.departure}</div>
                <div><span className={`status-badge status-${f.status}`}>{f.status}</span></div>
                <div>{f.passengerCapacity}</div>
                <div>
                  {f.progress.loaded} of {f.progress.total}
                  <div className="bar"><div className="bar-fill" style={{ width: `${(f.progress.total ? (f.progress.loaded / f.progress.total) : 0) * 100}%` }} /></div>
                </div>
                {expandedFlightId === f.id && (
                  <div className="expand span-6">
                    <div className="subtable">
                      <div className="thead small">
                        <div>Cart</div>
                        <div>Type</div>
                        <div>Role</div>
                        <div>Seq</div>
                        <div>Status</div>
                      </div>
                      {(f.carts || []).map((c, idx) => (
                        <div key={idx} className="trow small">
                          <div className="mono">{c.name}</div>
                          <div>{c.cartType}</div>
                          <div>{c.role}</div>
                          <div>{c.sequence}</div>
                          <div><span className={`status-badge status-${c.status}`}>{c.status}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'inventory' && (
        <section>
          <div className="toolbar">
            <input placeholder="Search product..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} />
          </div>
          <div className="table">
            <div className="thead">
              <div>Product</div>
              <div>Quantity</div>
              <div>Unit Cost</div>
              <div>Total Value</div>
              <div>Warnings</div>
            </div>
            {filteredInventory.length === 0 && (
              <div className="empty-state">No products match your search.</div>
            )}
            {filteredInventory.map((r) => (
              <div key={r.productId} className="trow">
                <div className="cell-strong">{r.name}</div>
                <div>
                  <span className={r.totalQuantity < lowStockThreshold ? 'warn-chip' : 'ok-chip'}>
                    {r.totalQuantity}
                  </span>
                </div>
                <div className="cell-muted">${r.unitCost.toFixed(2)}</div>
                <div>
                  <span className="value-chip">${r.totalValue.toFixed(2)}</span>
                </div>
                <div>{r.totalQuantity < lowStockThreshold ? 'Low stock' : '—'}</div>
              </div>
            ))}
          </div>

          {/* Charts removed per request */}

          <div className="split">
            <div className="card">
              <div className="toolbar">
                <label>
                  Expiring in
                  <select value={expiryHorizonDays} onChange={(e) => setExpiryHorizonDays(e.target.value)}>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                  </select>
                </label>
              </div>
              <h3>Expiration Risk</h3>
              <div className="table">
                <div className="thead">
                  <div>Product</div>
                  <div>Expiration</div>
                  <div>Qty</div>
                </div>
                {(expiryRisk || []).map((r, idx) => (
                  <div key={idx} className="trow">
                    <div className="cell-strong">{r.name}</div>
                    <div className="cell-muted">{r.expirationDate}</div>
                    <div>
                      <span className={r.quantity >= 50 ? 'warn-chip' : 'ok-chip'}>{r.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>Pallet Details</h3>
              <div className="table">
                <div className="thead">
                  <div>Pallet</div>
                  <div>Product</div>
                  <div>Expiration</div>
                  <div>In Warehouse</div>
                </div>
                {(pallets || []).map((p) => (
                  <div key={p.palletId} className="trow">
                    <div className="mono">{p.palletId}</div>
                    <div className="cell-strong">{p.productName}</div>
                    <div className="cell-muted">{p.expirationDate || '-'}</div>
                    <div>
                      <span className={p.inWarehouse ? 'ok-chip' : 'warn-chip'}>
                        {p.inWarehouse ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'health' && (
        <section>
          <div className="card">
            <h3>Inventory Consistency Issues</h3>
            <ConsistencyIssues />
          </div>
        </section>
      )}
    </div>
  );
}

function ConsistencyIssues() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error: vErr } = await supabase
          .from('inventory_consistency_issues')
          .select('*')
          .limit(200);
        if (vErr) throw vErr;
        setRows(data || []);
      } catch (err) {
        setError(err.message);
      }
    };
    run();
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!rows.length) return <p>No issues found.</p>;

  return (
    <div className="table">
      <div className="thead">
        <div>Item</div>
        <div>cart_id</div>
        <div>Item in WH</div>
        <div>Pallet in WH</div>
      </div>
      {rows.map((r) => (
        <div key={r.item_id} className="trow">
          <div className="mono">{r.item_id}</div>
          <div className="mono">{r.cart_id || '-'}</div>
          <div>{String(r.item_in_warehouse)}</div>
          <div>{String(r.pallet_in_warehouse)}</div>
        </div>
      ))}
    </div>
  );
}


