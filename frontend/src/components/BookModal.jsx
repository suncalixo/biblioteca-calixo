import React, { useState, useEffect } from 'react';
import { X, BookOpen, AlertCircle, Save } from 'lucide-react';

export default function BookModal({ isOpen, onClose, onSave, editingBook }) {
  const [formData, setFormData] = useState({
    isbn: '',
    titulo: '',
    autor: '',
    genero: '',
    precio_venta: '',
    precio_prestamo: '',
    stock: '',
    sinopsis: '',
    portada: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingBook) {
      setFormData({
        isbn: editingBook.isbn || '',
        titulo: editingBook.titulo || '',
        autor: editingBook.autor || '',
        genero: editingBook.genero || '',
        precio_venta: editingBook.precio_venta || '',
        precio_prestamo: editingBook.precio_prestamo || '',
        stock: editingBook.stock ?? '',
        sinopsis: editingBook.sinopsis || '',
        portada: editingBook.portada || ''
      });
    } else {
      setFormData({
        isbn: '',
        titulo: '',
        autor: '',
        genero: '',
        precio_venta: '',
        precio_prestamo: '',
        stock: '',
        sinopsis: '',
        portada: ''
      });
    }
    setError('');
  }, [isOpen, editingBook]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones estrictas de rúbrica
    if (!formData.isbn.trim()) {
      setError('El ISBN es un campo obligatorio y no puede estar vacío.');
      return;
    }
    if (!formData.titulo.trim()) {
      setError('El título de la obra es obligatorio.');
      return;
    }
    if (!formData.autor.trim()) {
      setError('El nombre del autor es obligatorio.');
      return;
    }
    if (!formData.genero.trim()) {
      setError('El género literario es obligatorio.');
      return;
    }

    const pVenta = parseFloat(formData.precio_venta);
    if (isNaN(pVenta) || pVenta <= 0) {
      setError('El precio de venta debe ser un número positivo mayor a 0.');
      return;
    }

    const pPrestamo = parseFloat(formData.precio_prestamo);
    if (isNaN(pPrestamo) || pPrestamo <= 0) {
      setError('El precio de préstamo debe ser un número positivo mayor a 0.');
      return;
    }

    const stock = parseInt(formData.stock, 10);
    if (isNaN(stock) || stock < 0) {
      setError('El stock físico no puede ser un número negativo.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        precio_venta: pVenta,
        precio_prestamo: pPrestamo,
        stock: stock
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el libro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#101827] border border-[#D6A52C]/30 rounded-3xl shadow-2xl p-6 md:p-8 text-[#F7F8FA] my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D6A52C]/10 border border-[#D6A52C]/30 flex items-center justify-center text-[#D6A52C]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-lg text-[#F7F8FA]">
                {editingBook ? `Editar Obra: ${editingBook.titulo}` : 'Catalogar Nueva Obra Literaria'}
              </h3>
              <p className="text-xs text-[#8793A7]">Gestión del acervo bibliográfico de Alejandría</p>
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
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Código ISBN *</label>
              <input
                type="text"
                disabled={!!editingBook}
                value={formData.isbn}
                onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="Ej. 978-0-14-044913-6"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C] font-mono-code disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Género Literario *</label>
              <input
                type="text"
                value={formData.genero}
                onChange={e => setFormData({ ...formData, genero: e.target.value })}
                placeholder="Ej. Filosofía, Épica, Novela..."
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Título de la Obra *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título completo del libro"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Autor / Filósofo *</label>
              <input
                type="text"
                value={formData.autor}
                onChange={e => setFormData({ ...formData, autor: e.target.value })}
                placeholder="Nombre del autor"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7]/60 focus:outline-none focus:border-[#D6A52C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Precio Venta (Lps) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.precio_venta}
                onChange={e => setFormData({ ...formData, precio_venta: e.target.value })}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-emerald-400 font-mono-code focus:outline-none focus:border-[#D6A52C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Precio Alquiler (Lps) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.precio_prestamo}
                onChange={e => setFormData({ ...formData, precio_prestamo: e.target.value })}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-purple-400 font-mono-code focus:outline-none focus:border-[#D6A52C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8793A7] mb-1">Existencias Físicas *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#EACB76] font-mono-code focus:outline-none focus:border-[#D6A52C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Ruta de Portada (Opcional)</label>
            <input
              type="text"
              value={formData.portada}
              onChange={e => setFormData({ ...formData, portada: e.target.value })}
              placeholder="/static/img/libros/..."
              className="w-full px-3.5 py-2.5 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#8793A7] font-mono-code focus:outline-none focus:border-[#D6A52C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8793A7] mb-1">Sinopsis de la Obra</label>
            <textarea
              rows={3}
              value={formData.sinopsis}
              onChange={e => setFormData({ ...formData, sinopsis: e.target.value })}
              placeholder="Descripción o contexto de la obra literaria..."
              className="w-full px-3.5 py-2 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] focus:outline-none focus:border-[#D6A52C] resize-none"
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
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-[#080D17] bg-gradient-to-r from-[#D6A52C] to-[#EACB76] hover:brightness-110 rounded-xl shadow-md glow-gold-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Obra'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
