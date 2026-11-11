import React, { useState } from 'react';
import { ShoppingBag, Calendar, Trash2, ArrowRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import DynamicBookCover from './DynamicBookCover';

export default function CartModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  onRemoveItem, 
  onClearCart, 
  clientes, 
  onConfirmBatchLoan, 
  onConfirmBatchSale 
}) {
  if (!isOpen) return null;

  const [clienteId, setClienteId] = useState(clientes.length > 0 ? clientes[0].id : '');
  const [diasPrestamo, setDiasPrestamo] = useState(14);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const totalVenta = cartItems.reduce((acc, item) => acc + (item.precio_venta || 0) * (item.quantity || 1), 0);
  const totalAlquiler = cartItems.reduce((acc, item) => acc + (item.precio_prestamo || 0) * (item.quantity || 1), 0);

  const handleCheckoutSale = async () => {
    if (!clienteId) {
      setError("Por favor selecciona un cliente para facturar.");
      return;
    }
    setError('');
    setProcessing(true);
    try {
      await onConfirmBatchSale(clienteId, cartItems);
      onClose();
    } catch (err) {
      setError(err.message || "Error procesando la compra múltiple.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckoutLoan = async () => {
    if (!clienteId) {
      setError("Por favor selecciona un usuario para registrar los préstamos.");
      return;
    }
    setError('');
    setProcessing(true);
    try {
      await onConfirmBatchLoan(clienteId, cartItems, diasPrestamo);
      onClose();
    } catch (err) {
      setError(err.message || "Error procesando el préstamo múltiple.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#101827] border border-[#D6A52C]/30 rounded-3xl shadow-2xl p-6 md:p-8 text-[#F7F8FA] my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D6A52C]/10 border border-[#D6A52C]/30 flex items-center justify-center text-[#D6A52C]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title text-xl font-bold text-[#F7F8FA]">
                Carrito de Obras & Reservas
              </h3>
              <p className="text-xs text-[#8793A7]">{cartItems.length} libro(s) seleccionado(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8793A7] hover:text-[#F7F8FA] hover:bg-white/5 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-2 scrollbar-thin">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-[#8793A7]">
              <ShoppingBag className="w-12 h-12 text-[#8793A7]/40 mx-auto mb-3" />
              <p className="text-sm font-semibold">Tu carrito de reservas está vacío.</p>
              <p className="text-xs mt-1">Explora el catálogo y añade obras para compras o préstamos múltiples.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.isbn}
                className="flex items-center justify-between p-3 bg-[#080D17] border border-white/5 rounded-2xl gap-3 hover:border-white/10 transition-colors"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <DynamicBookCover 
                    isbn={item.isbn} 
                    title={item.titulo} 
                    author={item.autor} 
                    coverUrl={item.portada} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-[#F7F8FA] truncate">{item.titulo}</h4>
                  <p className="text-[11px] text-[#D6A52C] truncate">{item.autor}</p>
                  <div className="flex gap-3 text-[10px] font-mono-code text-[#8793A7] mt-1">
                    <span>Venta: <strong className="text-emerald-400">Lps. {item.precio_venta?.toFixed(2)}</strong></span>
                    <span>Alquiler: <strong className="text-purple-400">Lps. {item.precio_prestamo?.toFixed(2)}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#8793A7] font-mono-code">Cant: {item.quantity || 1}</span>
                  <button
                    onClick={() => onRemoveItem(item.isbn)}
                    className="p-1.5 text-[#8793A7] hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar del carrito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-4">
            
            {/* Selector de Cliente y Días */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#080D17] p-3.5 rounded-2xl border border-white/5">
              <div>
                <label className="block text-[11px] font-semibold text-[#8793A7] mb-1">Cliente / Usuario:</label>
                <select
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#101827] border border-white/10 rounded-xl text-xs text-[#F7F8FA] focus:outline-none focus:border-[#D6A52C]"
                >
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.rol} - {c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8793A7] mb-1">Días de Préstamo (si aplica):</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={diasPrestamo}
                  onChange={e => setDiasPrestamo(parseInt(e.target.value) || 14)}
                  className="w-full px-3 py-1.5 bg-[#101827] border border-white/10 rounded-xl text-xs text-[#F7F8FA] font-mono-code focus:outline-none focus:border-[#D6A52C]"
                />
              </div>
            </div>

            {/* Totales Resumen */}
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="text-[#8793A7]">
                Total Compra: <strong className="text-emerald-400 font-mono-code text-sm">Lps. {totalVenta.toFixed(2)}</strong>
              </span>
              <span className="text-[#8793A7]">
                Total Préstamo: <strong className="text-purple-400 font-mono-code text-sm">Lps. {totalAlquiler.toFixed(2)}</strong>
              </span>
            </div>

            {/* Acciones de Checkout */}
            <div className="flex gap-2.5">
              <button
                onClick={onClearCart}
                className="px-3 py-2 text-xs text-[#8793A7] hover:text-[#F7F8FA] bg-white/[0.04] rounded-xl hover:bg-white/[0.08] cursor-pointer"
              >
                Vaciar
              </button>

              <button
                onClick={handleCheckoutLoan}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Confirmar Préstamo de Lote</span>
              </button>

              <button
                onClick={handleCheckoutSale}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-[#080D17] rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Confirmar Compra de Lote</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
