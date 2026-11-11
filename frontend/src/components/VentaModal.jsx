import React, { useState } from 'react';
import { X, ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VentaModal({ isOpen, onClose, onSave, clientes, libros, preselectedBook }) {
  const [clienteId, setClienteId] = useState('');
  const [isbn, setIsbn] = useState(preselectedBook?.isbn || '');
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (preselectedBook) {
      setIsbn(preselectedBook.isbn);
    } else if (libros.length > 0 && !isbn) {
      setIsbn(libros[0].isbn);
    }
    if (clientes.length > 0 && !clienteId) {
      setClienteId(clientes[0].id);
    }
    setCantidad(1);
    setError('');
  }, [isOpen, preselectedBook, libros, clientes]);

  if (!isOpen) return null;

  const selectedLibro = libros.find(l => l.isbn === isbn);
  const total = selectedLibro ? selectedLibro.precio_venta * cantidad : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!clienteId) {
      setError('Debes seleccionar un cliente.');
      return;
    }
    if (!isbn) {
      setError('Debes seleccionar un libro.');
      return;
    }
    const c = parseInt(cantidad, 10);
    if (isNaN(c) || c <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (selectedLibro && selectedLibro.stock < c) {
      setError(`Stock insuficiente. Solo quedan ${selectedLibro.stock} ejemplares.`);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        cliente_id: clienteId,
        isbn,
        cantidad: c
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al procesar la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#101827] border border-[#D6A52C]/30 rounded-3xl shadow-2xl p-6 md:p-8 text-[#F7F8FA] my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-lg text-[#F7F8FA]">
                Emitir Venta & Factura SAR
              </h3>
              <p className="text-xs text-[#8793A7]">Comprobante fiscal con CAI e ISV 15%</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[#8793A7] hover:text-[#F7F8FA] hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="py-5 space-y-4">
          
          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 py-2.5 px-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Cliente Adquiriente *</label>
            <select
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] focus:outline-none focus:border-[#D6A52C]"
            >
              <option value="">-- Seleccionar Cliente --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (ID: {c.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Libro a Vender *</label>
            <select
              value={isbn}
              onChange={e => setIsbn(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] focus:outline-none focus:border-[#D6A52C]"
            >
              <option value="">-- Seleccionar Libro --</option>
              {libros.map(l => (
                <option key={l.isbn} value={l.isbn} disabled={l.stock <= 0}>
                  {l.titulo} — Lps. {l.precio_venta.toFixed(2)} ({l.stock} disponibles)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Cantidad de Ejemplares *</label>
            <input
              type="number"
              min={1}
              max={selectedLibro ? selectedLibro.stock : 100}
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] focus:outline-none focus:border-[#D6A52C] font-mono-code"
            />
          </div>

          {/* Subtotal Preview */}
          <div className="bg-[#080D17] p-4 rounded-2xl border border-white/5 flex justify-between items-center text-xs">
            <span className="text-[#8793A7]">Total Facturado:</span>
            <span className="text-emerald-400 font-mono-code font-bold text-base">
              Lps. {total.toFixed(2)}
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#8793A7] hover:text-[#F7F8FA] bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-[#080D17] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{loading ? 'Procesando...' : 'Confirmar Venta y Ver Factura'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
