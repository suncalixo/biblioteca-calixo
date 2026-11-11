import React, { useState } from 'react';
import { Search, ShoppingCart, FileText, Printer, CheckCircle2, Receipt } from 'lucide-react';

export default function VentasView({ ventas, clientes, libros, onOpenFactura, onNewVenta }) {
  const [search, setSearch] = useState('');

  const filteredVentas = ventas.filter(v => {
    const q = search.toLowerCase();
    return !q ||
      v.cliente?.toLowerCase().includes(q) ||
      v.libro?.toLowerCase().includes(q) ||
      v.fecha?.includes(q) ||
      String(v.id_venta).includes(q);
  });

  const totalVendido = ventas.reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Barra de Control de Facturación & Ventas */}
      <div className="editorial-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Barra de Búsqueda */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted group-focus-within:text-[#D4AF37] transition-colors" />
          <input
            type="text"
            placeholder="Buscar factura por cliente, libro, fecha o N°..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 editorial-input rounded-lg text-xs"
          />
        </div>

        {/* Resumen económico rápido y botón */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 editorial-subsurface rounded-lg text-xs">
            <span className="text-theme-secondary">Total Facturado:</span>
            <span className="font-mono-code font-bold text-emerald-500">
              Lps. {totalVendido.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            type="button"
            onClick={onNewVenta}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
            <span>Emitir Nueva Venta / Factura</span>
          </button>
        </div>

      </div>

      {/* Tarjetas de Comprobantes Fiscales SAR Recientes */}
      {filteredVentas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif-title text-sm font-bold text-theme-main flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#D4AF37]" />
              <span>Facturas Fiscales SAR Disponibles ({filteredVentas.length})</span>
            </h3>
            <span className="text-[11px] text-theme-secondary">Haz clic en cualquier factura para visualizarla o imprimirla</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVentas.map(v => {
              const numFactura = `001-001-01-${String(v.id_venta).padStart(8, '0')}`;
              return (
                <div
                  key={`card-${v.id_venta}`}
                  onClick={() => onOpenFactura(v.id_venta)}
                  className="editorial-card p-4 rounded-xl cursor-pointer flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#D4AF37]/15 text-theme-gold border border-[#D4AF37]/30">
                        FAC #{numFactura}
                      </span>
                      <h4 className="font-serif-title font-bold text-sm text-theme-main mt-1.5 line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
                        {v.libro}
                      </h4>
                      <p className="text-xs text-theme-secondary mt-0.5">
                        Cliente: <strong className="text-theme-main">{v.cliente}</strong>
                      </p>
                    </div>
                    <span className="text-[11px] font-mono-code text-theme-muted shrink-0">
                      {v.fecha}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-theme flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-theme-muted block">Total c/ ISV 15%</span>
                      <span className="text-sm font-mono-code font-bold text-emerald-500">
                        Lps. {Number(v.total || 0).toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenFactura(v.id_venta); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 gold-glow-btn rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Abrir Factura</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla Detallada de Ventas y Facturación */}
      <div className="editorial-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="editorial-subsurface text-theme-secondary uppercase font-semibold text-[10px] tracking-wider border-b border-theme">
              <tr>
                <th className="py-3.5 px-4">N° Factura SAR</th>
                <th className="py-3.5 px-4">Fecha de Emisión</th>
                <th className="py-3.5 px-4">Cliente Adquiriente</th>
                <th className="py-3.5 px-4">Libro / Obra Vendida</th>
                <th className="py-3.5 px-4 text-center">Cantidad</th>
                <th className="py-3.5 px-4 text-right">Monto Total</th>
                <th className="py-3.5 px-4 text-right">Comprobante Fiscal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-theme-secondary">
                    No se registran facturas o ventas que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredVentas.map(v => (
                  <tr key={v.id_venta} className="hover:bg-[#D4AF37]/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono-code font-bold text-theme-gold">
                      FAC-{String(v.id_venta).padStart(6, '0')}
                    </td>
                    <td className="py-3.5 px-4 text-theme-secondary">{v.fecha}</td>
                    <td className="py-3.5 px-4 font-semibold text-theme-main">{v.cliente}</td>
                    <td className="py-3.5 px-4 text-theme-main max-w-xs truncate">{v.libro}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 editorial-subsurface text-theme-secondary rounded text-[11px] font-mono-code">
                        {v.cantidad} ejemp.
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-code font-bold text-emerald-500">
                      Lps. {Number(v.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenFactura(v.id_venta)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-theme-gold hover:text-[#0B0F17] border border-[#D4AF37]/35 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Factura SAR</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
