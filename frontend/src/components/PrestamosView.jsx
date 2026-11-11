import React, { useState } from 'react';
import { Search, Calendar, RotateCcw, CheckCircle2, Clock } from 'lucide-react';

export default function PrestamosView({ prestamos, clientes, libros, onDevolver, onNewPrestamo }) {
  const [search, setSearch] = useState('');

  const filtered = prestamos.filter(p => {
    const q = search.toLowerCase();
    return !q ||
      p.cliente?.toLowerCase().includes(q) ||
      p.libro?.toLowerCase().includes(q) ||
      String(p.id)?.toLowerCase().includes(q);
  });

  const activosCount = prestamos.filter(p => p.estado?.toLowerCase() !== 'devuelto').length;

  return (
    <div className="space-y-6">
      
      {/* Barra de Control de Préstamos */}
      <div className="editorial-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Barra de Búsqueda */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted group-focus-within:text-[#D4AF37] transition-colors" />
          <input
            type="text"
            placeholder="Buscar por cliente, libro o ID de préstamo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 editorial-input rounded-lg text-xs"
          />
        </div>

        {/* Resumen de activos y botón */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 editorial-subsurface rounded-lg text-xs">
            <span className="text-theme-secondary">Préstamos en Circulación:</span>
            <span className="font-mono-code font-bold text-theme-gold">
              {activosCount} activos
            </span>
          </div>

          <button
            type="button"
            onClick={onNewPrestamo}
            className="gold-glow-btn flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider rounded-lg cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Calendar className="w-4 h-4 stroke-[2.2]" />
            <span>Registrar Préstamo</span>
          </button>
        </div>

      </div>

      {/* Tabla de Préstamos */}
      <div className="editorial-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="editorial-subsurface text-theme-secondary uppercase font-semibold text-[10px] tracking-wider border-b border-theme">
              <tr>
                <th className="py-3.5 px-4">Código Préstamo</th>
                <th className="py-3.5 px-4">Usuario / Lector</th>
                <th className="py-3.5 px-4">Libro en Préstamo</th>
                <th className="py-3.5 px-4">Fecha Salida</th>
                <th className="py-3.5 px-4">Fecha Devolución</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-theme-secondary">
                    No se registran préstamos con el criterio especificado.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const devuelto = p.estado?.toLowerCase() === 'devuelto';
                  return (
                    <tr key={p.id} className="hover:bg-[#D4AF37]/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono-code font-bold text-theme-gold">#{p.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-theme-main">{p.cliente}</td>
                      <td className="py-3.5 px-4 text-theme-main max-w-xs truncate">{p.libro}</td>
                      <td className="py-3.5 px-4 text-theme-secondary">{p.fecha_prestamo}</td>
                      <td className="py-3.5 px-4 text-theme-secondary">{p.fecha_devolucion || p.fecha_devolucion_esperada || '---'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          devuelto
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        }`}>
                          {devuelto ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {p.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!devuelto && (
                          <button
                            type="button"
                            onClick={() => onDevolver(p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-theme-gold hover:text-[#0B0F17] border border-[#D4AF37]/35 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Devolver Stock</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
