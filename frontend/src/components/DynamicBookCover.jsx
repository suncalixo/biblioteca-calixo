import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

/**
 * Componente de portada de libro con resolución dinámica y proporción 2/3 normalizada:
 * 1. Prioriza la imagen local/existente del libro.
 * 2. Si falla o no existe, consulta Open Library Covers API por ISBN.
 * 3. Si Open Library no la tiene o falla, muestra un elegante placeholder editorial con proporción 2/3.
 */
export default function DynamicBookCover({ 
  isbn, 
  title, 
  author, 
  coverUrl, 
  className = "w-full h-full object-cover",
  aspectRatio = "aspect-[2/3]"
}) {
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const initialUrl =
    coverUrl && (!coverUrl.startsWith('/static/') || isLocalHost)
      ? coverUrl
      : getOpenLibraryUrl(isbn) || coverUrl;

  const [imgSrc, setImgSrc] = useState(initialUrl);
  const [hasFailedAll, setHasFailedAll] = useState(false);
  const [triedOpenLib, setTriedOpenLib] = useState(false);

  function getCleanIsbn(rawIsbn) {
    if (!rawIsbn) return '';
    return rawIsbn.replace(/[^0-9X]/gi, '');
  }

  function getOpenLibraryUrl(rawIsbn) {
    const clean = getCleanIsbn(rawIsbn);
    if (clean && (clean.length === 10 || clean.length === 13)) {
      return `https://covers.openlibrary.org/b/isbn/${clean}-M.jpg?default=false`;
    }
    return null;
  }

  const handleError = () => {
    if (!triedOpenLib && isbn) {
      setTriedOpenLib(true);
      const olUrl = getOpenLibraryUrl(isbn);
      if (olUrl && olUrl !== imgSrc) {
        setImgSrc(olUrl);
        return;
      }
    }
    setHasFailedAll(true);
  };

  if (hasFailedAll || !imgSrc) {
    return (
      <div
        style={{ aspectRatio: '2/3' }}
        className={`w-full h-full ${aspectRatio} flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B0F17] select-none`}
      >
        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37] mb-2 shadow-inner">
          <BookOpen className="w-5 h-5 stroke-[2]" />
        </div>
        <span className="font-serif-title font-bold text-[#F1F5F9] text-xs line-clamp-2 leading-tight">
          {title || 'Obra Literaria'}
        </span>
        <span className="text-[10px] text-[#94A3B8] mt-1 line-clamp-1">
          {author || 'Biblioteca Calixo'}
        </span>
        <span className="mt-2 text-[9px] font-mono-code text-[#D4AF37] px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
          {isbn || 'Saber Universal'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={title || "Portada"}
      loading="lazy"
      onError={handleError}
      style={{ aspectRatio: '2/3', objectFit: 'cover' }}
      className={className}
    />
  );
}
