import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, Save } from 'lucide-react';

export default function ClienteModal({ isOpen, onClose, onSave, editingCliente }) {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    correo: '',
    telefono: '',
    direccion: '',
    rol: 'Lector'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCliente) {
      setFormData({
        id: editingCliente.id || '',
        nombre: editingCliente.nombre || '',
        correo: editingCliente.correo || '',
        telefono: editingCliente.telefono || '',
        direccion: editingCliente.direccion || '',
        rol: editingCliente.rol || 'Lector'
      });
    } else {
      setFormData({
        id: '',
        nombre: '',
        correo: '',
        telefono: '',
        direccion: '',
        rol: 'Lector'
      });
    }
    setError('');
  }, [isOpen, editingCliente]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.id.trim()) {
      setError('El identificador (DNI/ID) es obligatorio.');
      return;
    }
    if (!formData.nombre.trim()) {
      setError('El nombre completo del usuario no puede estar vacío.');
      return;
    }

    if (formData.correo && !formData.correo.includes('@')) {
      setError('El correo electrónico ingresado no tiene un formato válido.');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#101827] border border-[#D6A52C]/30 rounded-3xl shadow-2xl p-6 md:p-8 text-[#F7F8FA] my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-lg text-[#F7F8FA]">
                {editingCliente ? `Editar Usuario: ${editingCliente.nombre}` : 'Registrar Nuevo Lector / Usuario'}
              </h3>
              <p className="text-xs text-[#8793A7]">Padrón oficial de membresías de Alejandría</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">DNI / Identificador *</label>
              <input
                type="text"
                disabled={!!editingCliente}
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                placeholder="Ej. 0801-1995-12345"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C] font-mono-code disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Rol de Membresía *</label>
              <select
                value={formData.rol}
                onChange={e => setFormData({ ...formData, rol: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#EACB76] font-semibold focus:outline-none focus:border-[#D6A52C]"
              >
                <option value="Lector">Lector General</option>
                <option value="Estudiante">Estudiante Universitario</option>
                <option value="Investigador">Investigador Histórico</option>
                <option value="Comprador">Comprador Asiduo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Nombre Completo *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre y Apellidos"
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.correo}
                onChange={e => setFormData({ ...formData, correo: e.target.value })}
                placeholder="usuario@correo.com"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Número Telefónico</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+504 9999-0000"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Dirección de Residencia</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={e => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Colonia, Ciudad, Referencia..."
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C]"
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
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Usuario'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
