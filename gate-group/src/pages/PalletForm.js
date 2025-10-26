import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import qrcode from 'qrcode';
import './PalletForm.css';

function PalletForm() {
  const navigate = useNavigate();

  const generatedPalletId = useMemo(() => {
    return `PAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const [formData, setFormData] = useState({
    palletId: generatedPalletId,
    productId: '',
    productName: '',
    expirationDate: '',
    inWarehouse: true,
    initialQuantity: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(null);
  
  // State for one-by-one QR generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQRIndex, setCurrentQRIndex] = useState(0);
  const [currentQR, setCurrentQR] = useState({ dataUrl: '', itemId: '' });

  // Effect to generate a new QR code whenever the index changes while modal is open
  useEffect(() => {
    if (isGenerating) {
      generateSingleQR(currentQRIndex);
    }
  }, [isGenerating, currentQRIndex]);

  const generateSingleQR = async (index) => {
    if (!saved || index >= saved.initialQuantity) {
      setIsGenerating(false); // Auto-close if index is out of bounds
      return;
    }

    setCurrentQR({ dataUrl: '', itemId: 'Generando...' }); // Loading state

    const { palletId, productId, productName } = saved;
    const itemIdFull = `${palletId}-${String(index + 1).padStart(6, '0')}`;

    const payload = {
        pallet_id: palletId,
        item_id: productId,
        name: productName,
        item_id_full: itemIdFull,
    };

    try {
        const dataUrl = await qrcode.toDataURL(JSON.stringify(payload));
        setCurrentQR({ dataUrl, itemId: itemIdFull });
    } catch (err) {
        console.error('Failed to generate QR code', err);
        setCurrentQR({ dataUrl: '', itemId: 'Error al generar' });
    }
  };

  const handleStartGeneration = () => {
    if (!saved) return;
    setCurrentQRIndex(0);
    setIsGenerating(true);
  };

  const handleNextQR = () => {
    setCurrentQRIndex(prevIndex => prevIndex + 1);
  };

  const handleStopGeneration = () => {
    setIsGenerating(false);
  };

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
      const { error: productErr } = await supabase.from('product').upsert([{ product_id: productId, name: formData.productName || productId, description: formData.notes || '', unit_cost: 0.00 }], { onConflict: 'product_id' });
      if (productErr) { setErrors({ api: productErr.message }); return; }

      const { error: palletErr } = await supabase.from('inventory_pallet').insert([{ pallet_id: palletId, product_id: productId, expiration_date: formData.expirationDate, in_warehouse: formData.inWarehouse }]);
      if (palletErr) { setErrors({ api: palletErr.message }); return; }

      const items = Array.from({ length: qty }, (_, index) => ({ item_id: `${palletId}-${String(index + 1).padStart(6, '0')}`, pallet_id: palletId, expiration_date: formData.expirationDate, status: 'ok', cart_id: null }));

      const chunkSize = 500;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const { error: itemErr } = await supabase.from('product_item').insert(chunk);
        if (itemErr) { setErrors({ api: itemErr.message }); return; }
      }

      setSaved({ ...formData, palletId, productId, createdAt: new Date().toISOString() });
    } catch (error) {
      setErrors({ api: error.message });
    }
  };

  const handleClear = () => {
    setFormData({ palletId: generatedPalletId, productId: '', productName: '', expirationDate: '', inWarehouse: true, initialQuantity: '', notes: '' });
    setErrors({});
    setSaved(null);
  };

  const goToScanner = () => navigate('/scanner');
  const goHome = () => navigate('/');

  const isLastQR = saved && currentQRIndex >= saved.initialQuantity - 1;

  return (
    <div className="pallet-form-page">
      <div className="page-container">
        <header className="page-header">
          <h1>Llenado de Información de Pallet</h1>
          <p>Registra un pallet recibido: producto, caducidad, ubicación y cantidad.</p>
        </header>

        <form className="form-card" onSubmit={handleSubmit} noValidate>
          {/* Form fields... */}
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="palletId">ID de Pallet</label>
              <input id="palletId" name="palletId" type="text" value={formData.palletId} onChange={handleChange} />
              {errors.palletId && <span className="error-text">{errors.palletId}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="productId">ID de Producto (SKU)</label>
              <input id="productId" name="productId" type="text" value={formData.productId} onChange={handleChange} maxLength="500" />
              {errors.productId && <span className="error-text">{errors.productId}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="productName">Nombre de Producto (Opcional)</label>
              <input id="productName" name="productName" type="text" value={formData.productName} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label htmlFor="expirationDate">Fecha de Caducidad</label>
              <input id="expirationDate" name="expirationDate" type="date" value={formData.expirationDate} onChange={handleChange} />
              {errors.expirationDate && <span className="error-text">{errors.expirationDate}</span>}
            </div>
            <div className="form-field">
              <label>Ubicación Física</label>
              <div className="toggle-group">
                <button type="button" className={`toggle-btn ${formData.inWarehouse ? 'active' : ''}`} onClick={() => handleToggleLocation(true)}>Bodega Principal</button>
                <button type="button" className={`toggle-btn ${!formData.inWarehouse ? 'active' : ''}`} onClick={() => handleToggleLocation(false)}>Cuarto de Preparación</button>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="initialQuantity">Cantidad Inicial</label>
              <input id="initialQuantity" name="initialQuantity" type="number" min="1" step="1" value={formData.initialQuantity} onChange={handleChange} />
              {errors.initialQuantity && <span className="error-text">{errors.initialQuantity}</span>}
            </div>
            <div className="form-field full-span">
              <label htmlFor="notes">Notas</label>
              <textarea id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange} />
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
              <div><strong>Pallet:</strong> <span>{saved.palletId}</span></div>
              <div><strong>Producto:</strong> <span>{saved.productName || '—'} {saved.productId ? `(SKU ${saved.productId})` : ''}</span></div>
              <div><strong>Caducidad:</strong> <span>{saved.expirationDate}</span></div>
              <div><strong>Ubicación:</strong> <span>{saved.inWarehouse ? 'Bodega Principal' : 'Cuarto de Preparación'}</span></div>
              <div><strong>Cantidad Inicial:</strong> <span>{saved.initialQuantity}</span></div>
            </div>
            <div className="form-actions" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button type="button" className="btn primary" onClick={handleStartGeneration}>Iniciar Generación de QRs</button>
            </div>
          </section>
        )}

        {isGenerating && saved && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ position: 'relative', background: 'white', padding: '25px', borderRadius: '10px', minWidth: '320px', maxWidth: '90%', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', textAlign: 'center' }}>
              <button onClick={handleStopGeneration} style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#888', lineHeight: 1 }}>&times;</button>
              <h2 style={{ marginTop: 0, marginBottom: '15px' }}>QR Generado ({currentQRIndex + 1} / {saved.initialQuantity})</h2>
              {currentQR.dataUrl ? (
                <div>
                  <img src={currentQR.dataUrl} alt={currentQR.itemId} style={{ width: '200px', height: '200px', margin: '0 auto' }} />
                  <p style={{ wordBreak: 'break-all', marginTop: '10px', background: '#f5f5f5', padding: '5px', borderRadius: '4px' }}>{currentQR.itemId}</p>
                </div>
              ) : (
                <p style={{height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{currentQR.itemId}</p>
              )}
              <button onClick={isLastQR ? handleStopGeneration : handleNextQR} className="btn primary" style={{ width: '100%', marginTop: '20px' }}>
                {isLastQR ? 'Finalizar' : 'Siguiente'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PalletForm;
