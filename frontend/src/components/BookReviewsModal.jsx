import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, User, ThumbsUp } from 'lucide-react';

export default function BookReviewsModal({ isOpen, onClose, book, activeUser = "Lector Activo" }) {
  if (!isOpen || !book) return null;

  // Clave de almacenamiento por ISBN
  const storageKey = `calixo_reviews_${book.isbn}`;

  // Reseñas iniciales por defecto + persistencia local
  const defaultReviews = [
    {
      id: 1,
      user: "Andrea Medina (Estudiante)",
      rating: 5,
      date: "2026-10-15",
      comment: "Una obra fundamental e imprescindible. La edición y traducción conservadas en la Biblioteca Calixo son impecables."
    },
    {
      id: 2,
      user: "Sophia Cerati (Lectora)",
      rating: 4,
      date: "2026-10-28",
      comment: "Fascinante narrativa y desarrollo filosófico. Muy recomendado para lectura académica o recreativa."
    }
  ];

  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultReviews;
    } catch {
      return defaultReviews;
    }
  });

  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState(activeUser);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newRev = {
      id: Date.now(),
      user: authorName.trim() || activeUser,
      rating: newRating,
      date: new Date().toISOString().split('T')[0],
      comment: newComment.trim()
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#101827] border border-[#D6A52C]/30 rounded-3xl shadow-2xl p-6 md:p-8 text-[#F7F8FA] my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D6A52C]/15 text-[#EACB76] border border-[#D6A52C]/30 font-mono-code">
                MÓDULO DE VALORACIÓN
              </span>
              <span className="text-xs text-[#8793A7] font-mono-code">ISBN: {book.isbn}</span>
            </div>
            <h3 className="font-serif-title text-xl font-bold text-[#F7F8FA] mt-1">
              Calificaciones y Reseñas: {book.titulo}
            </h3>
            <p className="text-xs text-[#8793A7]">Por {book.autor}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8793A7] hover:text-[#F7F8FA] hover:bg-white/5 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Resumen de Valoración Promedio */}
        <div className="py-4 flex items-center justify-between bg-[#080D17] px-5 py-3 rounded-2xl border border-white/5 my-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[#EACB76] font-mono-code">{averageRating}</span>
            <div>
              <div className="flex gap-1 text-[#D6A52C]">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(Number(averageRating)) ? 'fill-[#D6A52C] text-[#D6A52C]' : 'text-slate-700'}`} 
                  />
                ))}
              </div>
              <span className="text-[11px] text-[#8793A7] mt-0.5 block">Basado en {reviews.length} opiniones</span>
            </div>
          </div>
          <div className="text-xs text-[#8793A7] text-right font-mono-code hidden sm:block">
            Biblioteca Calixo &bull; Calificación Comunitaria
          </div>
        </div>

        {/* Lista de Reseñas (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin my-2">
          {reviews.length === 0 ? (
            <p className="text-center text-xs text-[#8793A7] py-6">Aún no hay reseñas para esta obra. ¡Sé el primero en calificarla!</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5 hover:border-[#D6A52C]/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#D6A52C]/10 border border-[#D6A52C]/30 flex items-center justify-center text-[10px] font-bold text-[#EACB76]">
                      {r.user.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-[#F7F8FA]">{r.user}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-[#D6A52C]">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-[#D6A52C] text-[#D6A52C]' : 'text-slate-700'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#8793A7] font-mono-code">{r.date}</span>
                  </div>
                </div>
                <p className="text-xs text-[#8793A7] leading-relaxed pl-8">{r.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* Formulario para Añadir Reseña */}
        <form onSubmit={handleAddReview} className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-[#8793A7]">Tu Calificación:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-[#D6A52C] hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star className={`w-5 h-5 ${(hoverRating || newRating) >= star ? 'fill-[#D6A52C]' : 'text-slate-700'}`} />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-[#EACB76] font-mono-code">{newRating}/5</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Tu nombre o alias"
              className="w-1/3 px-3 py-2 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7] focus:outline-none focus:border-[#D6A52C]"
            />
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Escribe tu opinión crítica o reseña sobre la obra..."
              className="flex-1 px-3 py-2 bg-[#080D17] border border-white/10 rounded-xl text-xs text-[#F7F8FA] placeholder-[#8793A7] focus:outline-none focus:border-[#D6A52C]"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-gradient-to-r from-[#D6A52C] to-[#EACB76] text-[#080D17] font-bold text-xs rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publicar</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
