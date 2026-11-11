import React from 'react';
import { X, ShoppingCart, Calendar, Star, ShoppingBag } from 'lucide-react';
import DynamicBookCover from './DynamicBookCover';

export default function BookDetailModal({ isOpen, onClose, book, onLoan, onSale, onOpenReviews, onAddToCart }) {
  if (!isOpen || !book) return null;

  const disponible = (book.stock || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl editorial-card rounded-2xl shadow-2xl p-6 md:p-8 my-8">
        
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-theme-secondary hover:text-theme-main transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Portada Dinámica con proporción 2/3 normalizada */}
          <div className="w-full md:w-52 shrink-0 aspect-[2/3] editorial-subsurface rounded-xl overflow-hidden shadow-xl relative">
            <DynamicBookCover
              isbn={book.isbn}
              title={book.titulo}
              author={book.autor}
              coverUrl={book.portada}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Información y detalles */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2 pr-8">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-theme-gold border border-[#D4AF37]/30">
                    {book.genero || 'Literatura Clásica'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    disponible
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                  }`}>
                    {disponible ? `${book.stock} disp.` : 'Agotado'}
                  </span>
                </div>

                {/* Botón Reseñas / Calificaciones */}
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenReviews(book); }}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 rounded-full text-xs font-semibold text-theme-gold cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                  <span>5.0 (Reseñas)</span>
                </button>
              </div>

              <h2 className="font-serif-title text-2xl md:text-3xl font-bold text-theme-main leading-tight">{book.titulo}</h2>
              <p className="text-sm font-semibold text-theme-gold mt-1">{book.autor}</p>
              <p className="text-xs font-mono-code text-theme-secondary mt-0.5">ISBN: {book.isbn}</p>

              <div className="mt-4 pt-4 border-t border-theme">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-theme-secondary mb-1.5">Reseña & Contexto de la Obra</h4>
                <p className="text-xs text-theme-secondary leading-relaxed max-h-36 overflow-y-auto pr-2 scrollbar-thin">
                  {book.sinopsis || 'Esta distinguida obra forma parte del acervo bibliográfico patrimonial de la Biblioteca Calixo, preservando el saber universal para estudiantes y lectores.'}
                </p>
              </div>
            </div>

            {/* Precios y Botones */}
            <div className="mt-6 pt-4 border-t border-theme">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="editorial-subsurface p-3 rounded-xl text-center">
                  <span className="text-[9px] uppercase tracking-wider text-theme-secondary font-bold block">Precio de Compra</span>
                  <span className="text-base font-bold text-emerald-500 font-mono-code">Lps. {Number(book.precio_venta || 0).toFixed(2)}</span>
                </div>
                <div className="editorial-subsurface p-3 rounded-xl text-center">
                  <span className="text-[9px] uppercase tracking-wider text-theme-secondary font-bold block">Tarifa de Préstamo</span>
                  <span className="text-base font-bold text-theme-gold font-mono-code">Lps. {Number(book.precio_prestamo || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!disponible}
                  onClick={() => { onAddToCart(book); onClose(); }}
                  className="p-2.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-theme-gold hover:text-[#0B0F17] border border-[#D4AF37]/30 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  title="Añadir a Carrito de Reservas"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={!disponible}
                  onClick={() => { onClose(); onLoan(book); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 gold-glow-btn disabled:opacity-40 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Solicitar en Préstamo</span>
                </button>

                <button
                  type="button"
                  disabled={!disponible}
                  onClick={() => { onClose(); onSale(book); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Comprar Libro</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
