import React, { useState } from 'react';
import { Search, UserPlus, Mail, Phone, Edit3, Trash2 } from 'lucide-react';

export default function ClientesView({ clientes, activeRole, onOpenClienteModal, onOpenEditCliente, onDeleteCliente }) {
  const [search, setSearch] = useState('');

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase();
    return !q ||
      c.nombre?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q) ||
      c.correo?.toLowerCase().includes(q) ||
      c.rol?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Barra de Control de Clientes */}
      <div className="editorial-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Barra de Búsqueda */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted group-focus-within:text-[#D4AF37] transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre, ID o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 editorial-input rounded-lg text-xs"
          />
        </div>

        {activeRole === 'Bibliotecario' && (
          <button
            type="button"
            onClick={onOpenClienteModal}
            className="gold-glow-btn flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider rounded-lg cursor-pointer whitespace-nowrap active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.2]" />
            <span>Registrar Usuario / Lector</span>
          </button>
        )}
      </div>

      {/* Tabla de Clientes */}
      <div className="editorial-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="editorial-subsurface text-theme-secondary uppercase font-semibold text-[10px] tracking-wider border-b border-theme">
              <tr>
                <th className="py-3.5 px-4">DNI / ID Identificador</th>
                <th className="py-3.5 px-4">Nombre Completo</th>
                <th className="py-3.5 px-4">Membresía / Rol</th>
                <th className="py-3.5 px-4">Correo Electrónico</th>
                <th className="py-3.5 px-4">Teléfono</th>
                <th className="py-3.5 px-4">Dirección</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-theme-secondary">
                    No se encontraron clientes o usuarios registrados.
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-[#D4AF37]/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono-code font-bold text-theme-gold">{c.id}</td>
                    <td className="py-3.5 px-4 font-bold text-theme-main">{c.nombre}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-[#D4AF37]/15 text-theme-gold border border-[#D4AF37]/30">
                        {c.rol || 'Lector'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-theme-secondary">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-theme-muted" />
                        <span>{c.correo || '---'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-theme-secondary">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-theme-muted" />
                        <span>{c.telefono || '---'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-theme-secondary max-w-xs truncate">{c.direccion || '---'}</td>
                    <td className="py-3.5 px-4 text-right">
                      {activeRole === 'Bibliotecario' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEditCliente(c)}
                            className="p-1.5 text-theme-secondary hover:text-[#D4AF37] rounded-lg transition-colors cursor-pointer"
                            title="Editar usuario"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCliente(c)}
                            className="p-1.5 text-theme-secondary hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
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
