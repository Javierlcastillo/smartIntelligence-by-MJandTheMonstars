import { supabase } from './supabaseClient';

// Optional: tweak based on your expected maximum number of items in warehouse
export const WAREHOUSE_MAX_CAPACITY = 1000;

// Fetch flights with carts, required items, and loaded counts
export async function fetchFlightsData() {
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

          // 1a) Most recent template (prefer flight-specific)
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

          // 1b) Required items from template
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

          // 1c) Loaded items currently on this cart by product
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

          // 1d) Merge required with loaded counts
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

  return processedFlights;
}

// Very light-weight warehouse stats: total products count and a pseudo-capacity percent
export async function fetchWarehouseStats(maxCapacity = WAREHOUSE_MAX_CAPACITY) {
  const { count, error } = await supabase
    .from('product_item')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;

  const totalProducts = count ?? 0;
  const capacityPct = maxCapacity > 0 ? Math.min(100, Math.round((totalProducts / maxCapacity) * 100)) : 0;

  return { totalProducts, capacityPct };
}
