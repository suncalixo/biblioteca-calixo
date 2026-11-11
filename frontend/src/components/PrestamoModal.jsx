import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';

export default function PrestamoModal({ isOpen, onClose, onSave, clientes, libros, preselectedBook }) {
  const [clienteId, setClienteId] = useState('');
  const [isbn, setIsbn] = useState(preselectedBook?.isbn || '');
  const [dias, setDias] = useState(14);
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
    setDias(14);
    setError('');
  }, [isOpen, preselectedBook, libros, clientes]);

  if (!isOpen) return null;

  const selectedLibro = libros.find(l => l.isbn === isbn);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!clienteId) {
      setError('Debes seleccionar un usuario / lector.');
      return;
    }
    if (!isbn) {
      setError('Debes seleccionar un libro.');
      return;
    }
    const d = parseInt(dias, 10);
    if (isNaN(d) || d <= 0) {
      setError('Los días de préstamo deben ser un número positivo.');
      return;
    }
    if (selectedLibro && selectedLibro.stock <= 0) {
      setError('No hay ejemplares disponibles para préstamo de este libro.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        cliente_id: clienteId,
        isbn,
        dias: d
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar el préstamo.');
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
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-lg text-[#F7F8FA]">
                Registrar Salida de Préstamo
              </h3>
              <p className="text-xs text-[#8793A7]">Control de circulación bibliográfica</p>
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
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Usuario / Lector *</label>
            <select
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] focus:outline-none focus:border-[#D6A52C]"
            >
              <option value="">-- Seleccionar Lector --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.rol} - {c.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Libro a Prestar *</label>
            <select
              value={isbn}
              onChange={e => setIsbn(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] focus:outline-none focus:border-[#D6A52C]"
            >
              <option value="">-- Seleccionar Libro --</option>
              {libros.map(l => (
                <option key={l.isbn} value={l.isbn} disabled={l.stock <= 0}>
                  {l.titulo} — Tarifa Lps. {l.precio_prestamo.toFixed(2)} ({l.stock} disponibles)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Días de Préstamo Otorgados *</label>
            <input
              type="number"
              min={1}
              max={60}
              value={dias}
              onChange={e => setDias(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] focus:outline-none focus:border-[#D6A52C] font-mono-code"
            />
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
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:brightness-110 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Calendar className="w-4 h-4" />
              <span>{loading ? 'Registrando...' : 'Confirmar Préstamo'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
