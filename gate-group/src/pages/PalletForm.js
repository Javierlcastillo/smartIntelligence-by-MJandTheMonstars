import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './PalletForm.css';

function PalletForm() {
  const navigate = useNavigate();

  const generatedPalletId = useMemo(() => {
    // Genera un ID string único basado en timestamp
    return `PAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const [formData, setFormData] = useState({
    palletId: generatedPalletId,
    productId: '',
    productName: '',
    expirationDate: '',
    inWarehouse: true, // true = Bodega principal, false = Cuarto de preparación
    initialQuantity: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number' && name !== 'productId') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleLocation = (flag) => {
    setFormData((prev) => ({ ...prev, inWarehouse: flag }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.palletId || formData.palletId.trim() === '') {
      newErrors.palletId = 'Ingresa un ID de pallet';
    }
    if (!formData.productId || formData.productId.trim() === '') {
      newErrors.productId = 'Ingresa un ID de producto (SKU)';
    } else if (formData.productId.trim().length > 500) {
      newErrors.productId = 'El SKU no puede tener más de 500 caracteres';
    }
    if (!formData.expirationDate) {
      newErrors.expirationDate = 'Selecciona la fecha de caducidad';
    }
    if (formData.initialQuantity === '' || Number(formData.initialQuantity) <= 0) {
      newErrors.initialQuantity = 'La cantidad debe ser mayor a 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const palletId = formData.palletId.trim();
    const productId = formData.productId.trim();
    const qty = Number(formData.initialQuantity);

    try {
      // 1) Crear/actualizar PRODUCT si no existe
      const { error: productErr } = await supabase
        .from('product')
        .upsert([{
          product_id: productId,
          name: formData.productName || productId,
          description: formData.notes || '',
          unit_cost: 0.00
        }], { onConflict: 'product_id' });
      
      if (productErr) {
        setErrors({ api: productErr.message });
        return;
      }

      // 2) Crear registro en inventory_pallet
      const { error: palletErr } = await supabase
        .from('inventory_pallet')
        .insert([{
          pallet_id: palletId,
          product_id: productId,
          expiration_date: formData.expirationDate,
          in_warehouse: formData.inWarehouse
        }]);
      if (palletErr) { 
        setErrors({ api: palletErr.message }); 
        return; 
      }

      // 3) Crear product_items (uno por unidad)
      const items = Array.from({ length: qty }, (_, index) => {
        const itemId = `${palletId}-${String(index + 1).padStart(6, '0')}`;
        return {
          item_id: itemId,
          pallet_id: palletId,
          expiration_date: formData.expirationDate,
          status: 'ok',
          cart_id: null
        };
      });

      // Inserción en lotes por si qty es grande
      const chunkSize = 500;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const { error: itemErr } = await supabase.from('product_item').insert(chunk);
        if (itemErr) { 
          setErrors({ api: itemErr.message }); 
          return; 
        }
      }


      // Local feedback
      setSaved({
        ...formData,
        palletId,
        productId,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      setErrors({ api: error.message });
    }
  };

  const handleClear = () => {
    setFormData({
      palletId: generatedPalletId,
      productId: '',
      productName: '',
      expirationDate: '',
      inWarehouse: true,
      initialQuantity: '',
      notes: ''
    });
    setErrors({});
    setSaved(null);
  };

  const goToScanner = () => navigate('/scanner');
  const goHome = () => navigate('/');

  return (
    <div className="pallet-form-page">
      <div className="page-container">
        <header className="page-header">
          <h1>Llenado de Información de Pallet</h1>
          <p>Registra un pallet recibido: producto, caducidad, ubicación y cantidad.</p>
        </header>

        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="palletId">ID de Pallet</label>
              <input
                id="palletId"
                name="palletId"
                type="text"
                value={formData.palletId}
                onChange={handleChange}
                placeholder="Ej. PAL-123456789"
              />
              {errors.palletId && <span className="error-text">{errors.palletId}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="productId">ID de Producto (SKU)</label>
              <input
                id="productId"
                name="productId"
                type="text"
                value={formData.productId}
                onChange={handleChange}
                placeholder="Ej. SKU-100234"
                maxLength="500"
              />
              {errors.productId && <span className="error-text">{errors.productId}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="productName">Nombre de Producto (Opcional)</label>
              <input
                id="productName"
                name="productName"
                type="text"
                value={formData.productName}
                onChange={handleChange}
                placeholder="Ej. Agua Mineral 500ml"
              />
            </div>

            <div className="form-field">
              <label htmlFor="expirationDate">Fecha de Caducidad</label>
              <input
                id="expirationDate"
                name="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={handleChange}
              />
              {errors.expirationDate && <span className="error-text">{errors.expirationDate}</span>}
            </div>

            <div className="form-field">
              <label>Ubicación Física</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${formData.inWarehouse ? 'active' : ''}`}
                  onClick={() => handleToggleLocation(true)}
                >
                  Bodega Principal
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${!formData.inWarehouse ? 'active' : ''}`}
                  onClick={() => handleToggleLocation(false)}
                >
                  Cuarto de Preparación
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="initialQuantity">Cantidad Inicial</label>
              <input
                id="initialQuantity"
                name="initialQuantity"
                type="number"
                min="1"
                step="1"
                value={formData.initialQuantity}
                onChange={handleChange}
                placeholder="Ej. 120"
              />
              {errors.initialQuantity && <span className="error-text">{errors.initialQuantity}</span>}
            </div>

            <div className="form-field full-span">
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Observaciones opcionales"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary">Guardar Pallet</button>
            <button type="button" className="btn secondary" onClick={handleClear}>Limpiar</button>
            <button type="button" className="btn tertiary" onClick={goToScanner}>Escanear Ítems</button>
            <button type="button" className="btn ghost" onClick={goHome}>Inicio</button>
          </div>
          {errors.api && <div className="error-text" style={{marginTop: '12px', textAlign: 'center'}}>{errors.api}</div>}
        </form>

        {saved && (
          <section className="summary-card">
            <h2>Resumen Guardado</h2>
            <div className="summary-grid">
              <div>
                <strong>Pallet:</strong> <span>{saved.palletId}</span>
              </div>
              <div>
                <strong>Producto:</strong> <span>{saved.productName || '—'} {saved.productId ? `(SKU ${saved.productId})` : ''}</span>
              </div>
              <div>
                <strong>Caducidad:</strong> <span>{saved.expirationDate}</span>
              </div>
              <div>
                <strong>Ubicación:</strong> <span>{saved.inWarehouse ? 'Bodega Principal' : 'Cuarto de Preparación'}</span>
              </div>
              <div>
                <strong>Cantidad Inicial:</strong> <span>{saved.initialQuantity}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default PalletForm;
