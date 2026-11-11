import React from 'react';
import { User, Shield, Calendar, ShoppingCart, Clock, AlertTriangle, BookOpen, CheckCircle2 } from 'lucide-react';
import DynamicBookCover from './DynamicBookCover';

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  activeRole, 
  clientes, 
  prestamos, 
  ventas,
  onOpenFactura
}) {
  if (!isOpen) return null;

  // Encontrar el perfil de cliente correspondiente al rol actual
  const currentClient = clientes.find(c => c.rol?.toLowerCase() === activeRole.toLowerCase()) || clientes[0] || {
    id: "USER-001",
    nombre: "Usuario Calixo",
    correo: "usuario@biblioteca.edu",
    rol: activeRole
  };

  // Filtrar préstamos y compras del usuario activo (o todas si es Bibliotecario)
  const isBibliotecario = activeRole === 'Bibliotecario';

  const userPrestamos = isBibliotecario 
    ? prestamos 
    : prestamos.filter(p => p.cliente_id === currentClient.id || p.cliente?.toLowerCase() === currentClient.nombre?.toLowerCase());

  const userVentas = isBibliotecario 
    ? ventas 
    : ventas.filter(v => v.cliente_id === currentClient.id || v.cliente?.toLowerCase() === currentClient.nombre?.toLowerCase());

  // Cálculo de préstamos vencidos y multas (Lps. 15 por día de retraso)
  const today = new Date();
  const MULTA_POR_DIA = 15.00;

  const prestamosConAlerta = userPrestamos.map(p => {
    let diasRetraso = 0;
    let esVencido = false;
    let esProximo = false;

    if (p.fecha_devolucion_esperada && p.estado?.toLowerCase() !== 'devuelto') {
      const fechaLimite = new Date(p.fecha_devolucion_esperada);
      const diffTime = today.getTime() - fechaLimite.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        diasRetraso = diffDays;
        esVencido = true;
      } else if (diffDays >= -2) {
        esProximo = true;
      }
    }

    const multa = diasRetraso * MULTA_POR_DIA;
    return { ...p, diasRetraso, esVencido, esProximo, multa };
  });

  const totalMultas = prestamosConAlerta.reduce((acc, p) => acc + (p.multa || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#101827] border border-[#D6A52C]/30 rounded-3xl shadow-2xl p-6 md:p-8 text-[#F7F8FA] my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EACB76] to-[#D6A52C] flex items-center justify-center text-[#080D17] shadow-lg">
              <User className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-title text-xl font-bold text-[#F7F8FA]">
                  {currentClient.nombre}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D6A52C]/15 text-[#EACB76] border border-[#D6A52C]/30 font-mono-code">
                  {activeRole}
                </span>
              </div>
              <p className="text-xs text-[#8793A7]">{currentClient.correo} &bull; DNI: {currentClient.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8793A7] hover:text-[#F7F8FA] hover:bg-white/5 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Resumen de Estado del Usuario */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          
          <div className="p-3.5 bg-[#080D17] border border-white/5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#8793A7] block">Préstamos en Curso</span>
              <span className="text-lg font-bold text-purple-400 font-mono-code">
                {prestamosConAlerta.filter(p => p.estado?.toLowerCase() !== 'devuelto').length}
              </span>
            </div>
            <Calendar className="w-5 h-5 text-purple-400/60" />
          </div>

          <div className="p-3.5 bg-[#080D17] border border-white/5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#8793A7] block">Obras Compradas</span>
              <span className="text-lg font-bold text-emerald-400 font-mono-code">
                {userVentas.length}
              </span>
            </div>
            <ShoppingCart className="w-5 h-5 text-emerald-400/60" />
          </div>

          <div className="p-3.5 bg-[#080D17] border border-white/5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#8793A7] block">Multas por Retraso</span>
              <span className={`text-lg font-bold font-mono-code ${totalMultas > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                Lps. {totalMultas.toFixed(2)}
              </span>
            </div>
            <AlertTriangle className={`w-5 h-5 ${totalMultas > 0 ? 'text-rose-400' : 'text-[#8793A7]'}`} />
          </div>

        </div>

        {/* Pestañas de Historial */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
          
          {/* Sección 1: Préstamos y Alertas de Vencimiento */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D6A52C] mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Historial de Préstamos & Alertas de Vencimiento</span>
            </h4>

            {prestamosConAlerta.length === 0 ? (
              <p className="text-xs text-[#8793A7] p-4 bg-[#080D17] rounded-xl text-center">No hay registros de préstamos para este perfil.</p>
            ) : (
              <div className="space-y-2">
                {prestamosConAlerta.map(p => (
                  <div 
                    key={p.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${p.esVencido ? 'bg-rose-500/10 border-rose-500/30' : p.esProximo ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#080D17] border-white/5'}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F7F8FA]">{p.libro}</span>
                        <span className="font-mono-code text-[10px] text-[#8793A7]">({p.id})</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-[#8793A7] mt-1">
                        <span>Salida: {p.fecha_prestamo}</span>
                        <span>Vencimiento: <strong className={p.esVencido ? 'text-rose-400' : ''}>{p.fecha_devolucion_esperada}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      {p.esVencido ? (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] block">
                            Vencido ({p.diasRetraso} días)
                          </span>
                          <span className="text-[10px] text-rose-400 font-mono-code font-bold mt-0.5 block">
                            Multa: Lps. {p.multa.toFixed(2)}
                          </span>
                        </div>
                      ) : p.esProximo ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[#EACB76] font-bold text-[10px]">
                          Por vencer pronto
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                          {p.estado}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección 2: Compras e Historial de Facturas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D6A52C] mb-2.5 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Compras Realizadas & Comprobantes Fiscales</span>
            </h4>

            {userVentas.length === 0 ? (
              <p className="text-xs text-[#8793A7] p-4 bg-[#080D17] rounded-xl text-center">No hay compras registradas para este perfil.</p>
            ) : (
              <div className="space-y-2">
                {userVentas.map(v => (
                  <div 
                    key={v.id_venta}
                    className="p-3 bg-[#080D17] border border-white/5 rounded-2xl flex items-center justify-between text-xs hover:border-white/10"
                  >
                    <div>
                      <span className="font-bold text-[#F7F8FA]">{v.libro}</span>
                      <div className="text-[10px] text-[#8793A7] mt-0.5">
                        {v.fecha} &bull; {v.cantidad} ejemplar(es)
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-code font-bold text-emerald-400">
                        Lps. {v.total.toFixed(2)}
                      </span>
                      <button
                        onClick={() => { onClose(); onOpenFactura(v.id_venta); }}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-[#EACB76] rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Ver Factura
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#F7F8FA] rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>

      </div>
    </div>
  );
}
