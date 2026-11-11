import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Grid, List, BookOpen, ShoppingCart, 
  Calendar, Edit3, Trash2, SlidersHorizontal, 
  ArrowUpRight, Star, ChevronLeft, ChevronRight, 
  ShoppingBag, RotateCcw
} from 'lucide-react';
import DynamicBookCover from './DynamicBookCover';

export default function BooksView({
  libros,
  generos,
  activeRole,
  theme = 'dark',
  onOpenBookModal,
  onOpenEditModal,
  onDeleteBook,
  onSelectBookDetail,
  onQuickLoan,
  onQuickSale,
  onAddToCart,
  onOpenReviews
}) {
  const isLight = theme === 'light';

  // Estados de Búsqueda Reactiva & Filtros Combinados
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('todos');
  const [estadoFilter, setEstadoFilter] = useState('todos'); // 'todos', 'disponible', 'agotado'
  const [maxPrecio, setMaxPrecio] = useState(1500);
  const [viewMode, setViewMode] = useState('cards');
  const [sortBy, setSortBy] = useState('destacados');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const sliderMaxLimit = 1500;

  // Filtrado reactivo en tiempo real (Instant Search + Estado + Precio Máximo + Género)
  const filteredBooks = useMemo(() => {
    const limitePrecio = Number(maxPrecio);

    return libros.filter(libro => {
      // 1. Filtro Género
      const matchGenre =
        selectedGenre === 'todos' ||
        (libro.genero || '').toLowerCase() === selectedGenre.toLowerCase();

      // 2. Búsqueda reactiva (título, autor, ISBN, género)
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (libro.titulo || '').toLowerCase().includes(q) ||
        (libro.autor || '').toLowerCase().includes(q) ||
        (libro.isbn || '').toLowerCase().includes(q) ||
        (libro.genero || '').toLowerCase().includes(q);

      // 3. Filtro Estado (Disponible / Agotado)
      const isDisponible = Number(libro.stock || 0) > 0;
      let matchEstado = true;
      if (estadoFilter === 'disponible') matchEstado = isDisponible;
      if (estadoFilter === 'agotado') matchEstado = !isDisponible;

      // 4. Filtro de Precio Máximo en Tiempo Real (Lps. 0 a 1500)
      const precioVenta = Number(libro.precio_venta ?? libro.precioVenta ?? 0);
      const precioAlquiler = Number(libro.precio_prestamo ?? libro.precioAlquiler ?? 0);
      const precioEfectivo = precioVenta > 0 ? precioVenta : precioAlquiler;
      const matchPrecio = limitePrecio > 0 && precioEfectivo <= limitePrecio;

      return matchGenre && matchSearch && matchEstado && matchPrecio;
    }).sort((a, b) => {
      if (sortBy === 'precio-asc') return Number(a.precio_venta || 0) - Number(b.precio_venta || 0);
      if (sortBy === 'precio-desc') return Number(b.precio_venta || 0) - Number(a.precio_venta || 0);
      if (sortBy === 'stock') return Number(b.stock || 0) - Number(a.stock || 0);
      if (sortBy === 'titulo') return (a.titulo || '').localeCompare(b.titulo || '');
      return 0;
    });
  }, [libros, search, selectedGenre, estadoFilter, maxPrecio, sortBy]);

  // Libros Paginados
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBooks = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredBooks.slice(start, start + pageSize);
  }, [filteredBooks, safeCurrentPage, pageSize]);

  // Reset página cuando cambian los filtros
  const handleFilterChange = (setter, val) => {
    setter(val);
    setCurrentPage(1);
  };

  const handlePriceSliderChange = (e) => {
    const numericVal = Number(e.target.value);
    setMaxPrecio(numericVal);
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSelectedGenre('todos');
    setSearch('');
    setEstadoFilter('todos');
    setMaxPrecio(1500);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedGenre !== 'todos' ||
    search.trim() !== '' ||
    estadoFilter !== 'todos' ||
    maxPrecio < sliderMaxLimit;

  const sliderPercentage = Math.min(100, Math.max(0, (maxPrecio / sliderMaxLimit) * 100));

  return (
    <div className="space-y-5">
      
      {/* BARRA DE CONTROL UNIFICADA (Top Control Bar) */}
      <div className={`p-4 rounded-xl border space-y-3.5 transition-colors ${
        isLight
          ? 'bg-white border-[#E2E8F0] shadow-xs'
          : 'bg-[#1E293B] border-[#334155]'
      }`}>
        
        {/* Fila Principal Unificada */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5">
          
          {/* 1. Buscador Principal Amplio con Icono de Lupa */}
          <div className="relative flex-1 min-w-[240px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] group-focus-within:text-[#D4AF37] transition-colors" />
            <input
              type="text"
              placeholder="Buscar por título, autor, ISBN o género literario..."
              value={search}
              onChange={e => handleFilterChange(setSearch, e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 border rounded-lg text-xs focus:outline-none focus:border-[#D4AF37] transition-colors ${
                isLight
                  ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder-[#64748B]'
                  : 'bg-[#0B0F17] border-[#334155] text-[#F1F5F9] placeholder-[#64748B]'
              }`}
            />
            {search && (
              <button 
                onClick={() => handleFilterChange(setSearch, '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#D4AF37] px-1 cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controles Centrales y Derecha */}
          <div className="flex flex-wrap items-center gap-3 justify-between xl:justify-end">
            
            {/* 2. Selector de Estado (Segmented Control Moderno) */}
            <div className={`flex items-center border rounded-lg p-1 ${
              isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#0B0F17] border-[#334155]'
            }`}>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'disponible', label: 'Disponibles' },
                { id: 'agotado', label: 'Agotados' }
              ].map(opt => {
                const active = estadoFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleFilterChange(setEstadoFilter, opt.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? isLight
                          ? 'bg-white text-[#9A7415] font-bold border border-[#D4AF37]/50 shadow-2xs'
                          : 'bg-[#1E293B] text-[#D4AF37] font-semibold border border-[#D4AF37]/40 shadow-xs'
                        : isLight
                        ? 'text-[#475569] hover:text-[#0F172A]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* 3. Deslizador de Precio Máximo Reactivo (0 a 1500 Lps.) */}
            <div className={`flex items-center gap-3 border rounded-lg px-3.5 py-2 ${
              isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#0B0F17] border-[#334155]'
            }`}>
              <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
                <span className={isLight ? 'text-[#475569] font-medium' : 'text-[#94A3B8] font-medium'}>
                  Precio Máx:
                </span>
                <span className={`font-mono-code font-bold min-w-[68px] text-right ${
                  isLight ? 'text-[#9A7415]' : 'text-[#D4AF37]'
                }`}>
                  Lps. {maxPrecio}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={sliderMaxLimit}
                step="10"
                value={maxPrecio}
                onChange={handlePriceSliderChange}
                onInput={handlePriceSliderChange}
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${sliderPercentage}%, ${isLight ? '#CBD5E1' : '#334155'} ${sliderPercentage}%, ${isLight ? '#CBD5E1' : '#334155'} 100%)`
                }}
                className="w-28 sm:w-32 h-1.5 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                title={`Filtrar libros hasta Lps. ${maxPrecio}`}
              />
            </div>

            {/* Ordenar & Vista */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className={`appearance-none border text-xs rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-[#D4AF37] cursor-pointer ${
                    isLight
                      ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
                      : 'bg-[#0B0F17] border-[#334155] text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  <option value="destacados">Destacados</option>
                  <option value="titulo">Título (A-Z)</option>
                  <option value="precio-asc">Menor Precio</option>
                  <option value="precio-desc">Mayor Precio</option>
                  <option value="stock">Mayor Stock</option>
                </select>
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className={`flex border rounded-lg p-0.5 ${
                isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#0B0F17] border-[#334155]'
              }`}>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? isLight ? 'bg-white text-[#9A7415] shadow-2xs' : 'bg-[#1E293B] text-[#D4AF37]'
                      : 'text-[#64748B] hover:text-[#D4AF37]'
                  }`}
                  title="Vista Editorial"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? isLight ? 'bg-white text-[#9A7415] shadow-2xs' : 'bg-[#1E293B] text-[#D4AF37]'
                      : 'text-[#64748B] hover:text-[#D4AF37]'
                  }`}
                  title="Vista de Tabla"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Acción Primaria: + CATALOGAR LIBRO (2FA) */}
            {activeRole === 'Bibliotecario' && (
              <button
                type="button"
                onClick={onOpenBookModal}
                className="gold-glow-btn flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider rounded-lg cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Catalogar Libro (2FA)</span>
              </button>
            )}

          </div>

        </div>

        {/* Sub-barra limpia de Géneros Literarios + Contador de Resultados */}
        <div className={`flex flex-wrap items-center justify-between gap-2 pt-3 border-t ${
          isLight ? 'border-[#E2E8F0]' : 'border-[#334155]/70'
        }`}>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => handleFilterChange(setSelectedGenre, 'todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedGenre === 'todos'
                  ? 'bg-[#D4AF37] text-[#0B0F17] font-semibold shadow-xs'
                  : isLight
                  ? 'bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
                  : 'bg-[#0B0F17] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#334155]'
              }`}
            >
              <span>Todos los Géneros</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code ${
                selectedGenre === 'todos' ? 'bg-[#0B0F17]/20 text-[#0B0F17] font-bold' : 'text-[#64748B]'
              }`}>
                {libros.length}
              </span>
            </button>

            {generos.map(g => {
              const count = libros.filter(l => (l.genero || '').toLowerCase() === g.toLowerCase()).length;
              const isActive = selectedGenre.toLowerCase() === g.toLowerCase();
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleFilterChange(setSelectedGenre, g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#0B0F17] font-semibold shadow-xs'
                      : isLight
                      ? 'bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
                      : 'bg-[#0B0F17] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#334155]'
                  }`}
                >
                  <span>{g}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code ${
                    isActive ? 'bg-[#0B0F17]/20 text-[#0B0F17] font-bold' : 'text-[#64748B]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className={`text-[11px] font-mono-code ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>
              Resultados: <strong>{filteredBooks.length}</strong> de {libros.length}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer Filtros</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* CATÁLOGO DE OBRAS (Estado Vacío / Cuadrícula Editorial / Tabla) */}
      {paginatedBooks.length === 0 ? (
        <div className={`p-14 text-center rounded-xl border ${
          isLight ? 'bg-white border-[#E2E8F0] shadow-xs' : 'bg-[#1E293B] border-[#334155]'
        }`}>
          <BookOpen className="w-12 h-12 text-[#D4AF37] mx-auto mb-3 stroke-[1.5]" />
          <h3 className={`font-serif-title text-lg font-bold ${isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}`}>
            {maxPrecio < sliderMaxLimit && libros.length > 0
              ? 'No se encontraron libros dentro de este rango de precio'
              : 'No se encontraron obras literarias'}
          </h3>
          <p className={`text-xs mt-1.5 max-w-md mx-auto ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>
            {maxPrecio < sliderMaxLimit
              ? `Actualmente estás filtrando obras con un precio máximo de Lps. ${maxPrecio}. Incrementa el deslizador de precio o restablece los filtros para ver el catálogo.`
              : 'Ajusta los criterios de búsqueda reactiva, disponibilidad o género literario.'}
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold gold-glow-btn cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Rango y Filtros</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CUADRÍCULA EDITORIAL DE LIBROS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedBooks.map((libro) => {
            const disponible = Number(libro.stock || 0) > 0;
            return (
              <div
                key={libro.isbn}
                className={`group rounded-xl p-3.5 flex flex-col justify-between border transition-all duration-250 ${
                  isLight
                    ? 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#D4AF37]/60'
                    : 'bg-[#1E293B] border-[#334155] hover:bg-[#243247] hover:border-[#D4AF37]/45 shadow-lg'
                }`}
              >
                <div>
                  {/* Portada uniforme aspect-[2/3], object-cover y rounded-lg (8px) */}
                  <div 
                    style={{ aspectRatio: '2/3' }}
                    className={`relative aspect-[2/3] w-full rounded-lg overflow-hidden border cursor-pointer ${
                      isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#0B0F17] border-[#334155]/60'
                    }`}
                    onClick={() => onSelectBookDetail(libro)}
                  >
                    <DynamicBookCover
                      isbn={libro.isbn}
                      title={libro.titulo}
                      author={libro.autor}
                      coverUrl={libro.portada}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />

                    {/* Gradiente sutil en la base */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/75 via-transparent to-[#0B0F17]/25 pointer-events-none" />

                    {/* Badges Superiores: Género & Pill Minimalista Verde Esmeralda de Disponibilidad */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 pointer-events-none">
                      <span className={`px-2.5 py-1 backdrop-blur-md border rounded-full text-[10px] font-bold truncate shadow-sm ${
                        isLight
                          ? 'bg-white/95 text-[#0F172A] border-slate-200'
                          : 'bg-[#0F172A]/90 text-white border-[#334155]'
                      }`}>
                        {libro.genero || 'Literatura'}
                      </span>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5 backdrop-blur-md shrink-0 shadow-sm ${
                        disponible
                          ? isLight
                            ? 'bg-emerald-50/95 text-emerald-700 border border-emerald-300'
                            : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                          : isLight
                          ? 'bg-rose-50/95 text-rose-700 border border-rose-300'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${disponible ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {disponible ? `${libro.stock} disp.` : 'Agotado'}
                      </span>
                    </div>

                    {/* Calificación en esquina inferior derecha */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenReviews(libro); }}
                      className={`absolute bottom-2.5 right-2.5 px-2 py-0.5 backdrop-blur-md border hover:border-[#D4AF37] rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-md ${
                        isLight
                          ? 'bg-white/95 text-[#0F172A] border-slate-300'
                          : 'bg-[#0B0F17]/90 text-white border-[#334155]'
                      }`}
                      title="Ver y publicar reseñas"
                    >
                      <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                      <span className="text-[10px] font-mono-code font-bold">5.0</span>
                    </button>
                  </div>

                  {/* Información Editorial de la Obra */}
                  <div className="mt-3.5 px-0.5">
                    <p className={`text-[11px] font-semibold truncate ${isLight ? 'text-[#9A7415]' : 'text-[#D4AF37]'}`}>
                      {libro.autor}
                    </p>

                    <h4
                      className={`font-serif-title text-[15px] font-bold line-clamp-1 mt-0.5 transition-colors cursor-pointer ${
                        isLight
                          ? 'text-[#0F172A] group-hover:text-[#9A7415]'
                          : 'text-[#F1F5F9] group-hover:text-[#D4AF37]'
                      }`}
                      onClick={() => onSelectBookDetail(libro)}
                      title={libro.titulo}
                    >
                      {libro.titulo}
                    </h4>

                    <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                      isLight ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}>
                      {libro.sinopsis || 'Edición catalogada en el acervo literario de la Biblioteca Calixo.'}
                    </p>
                  </div>
                </div>

                {/* Pie de Tarjeta: Fila Limpia de Precios + Botones de Acción Jerarquizados */}
                <div className={`mt-3.5 pt-3 border-t ${isLight ? 'border-[#E2E8F0]' : 'border-[#334155]/70'}`}>
                  
                  {/* Precios en una fila limpia, equilibrada y sutil */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-3 ${
                    isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#0B0F17]/70 border-[#334155]/60'
                  }`}>
                    <div className="flex flex-col">
                      <span className="text-[9.5px] uppercase tracking-wider text-[#64748B] font-semibold">
                        Venta
                      </span>
                      <span className={`text-xs font-bold font-mono-code mt-0.5 ${
                        isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'
                      }`}>
                        Lps. {Number(libro.precio_venta || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className={`h-6 w-[1px] ${isLight ? 'bg-[#E2E8F0]' : 'bg-[#334155]/70'}`} />

                    <div className="flex flex-col text-right">
                      <span className="text-[9.5px] uppercase tracking-wider text-[#64748B] font-semibold">
                        Alquiler
                      </span>
                      <span className={`text-xs font-bold font-mono-code mt-0.5 ${
                        isLight ? 'text-[#9A7415]' : 'text-[#D4AF37]'
                      }`}>
                        Lps. {Number(libro.precio_prestamo || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-1.5">
                    
                    {/* Acción Principal */}
                    <button
                      type="button"
                      onClick={() => onSelectBookDetail(libro)}
                      className={`flex-1 py-2 px-3 border rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        isLight
                          ? 'bg-[#0F172A] hover:bg-[#D4AF37] text-white hover:text-[#0B0F17] border-[#0F172A] hover:border-[#D4AF37]'
                          : 'bg-[#0B0F17] hover:bg-[#D4AF37] text-[#F1F5F9] hover:text-[#0B0F17] border-[#334155] hover:border-[#D4AF37]'
                      }`}
                    >
                      <span>Ver Ficha</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Acciones Operativas (Alquilar / Comprar / Carrito) */}
                    {disponible && (
                      <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                        isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#0B0F17] border-[#334155]'
                      }`}>
                        <button
                          type="button"
                          onClick={() => onQuickLoan(libro)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? 'text-[#475569] hover:text-[#9A7415] hover:bg-white'
                              : 'text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#1E293B]'
                          }`}
                          title="Alquilar / Solicitar Préstamo"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onQuickSale(libro)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? 'text-[#475569] hover:text-emerald-600 hover:bg-white'
                              : 'text-[#94A3B8] hover:text-emerald-400 hover:bg-[#1E293B]'
                          }`}
                          title="Comprar Obra"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onAddToCart(libro)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? 'text-[#475569] hover:text-[#9A7415] hover:bg-white'
                              : 'text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#1E293B]'
                          }`}
                          title="Añadir al Carrito"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Iconos Administrativos Secundarios (Bibliotecario) */}
                    {activeRole === 'Bibliotecario' && (
                      <div className={`flex items-center gap-0.5 p-1 rounded-lg border ${
                        isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#0B0F17] border-[#334155]'
                      }`}>
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(libro)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? 'text-[#64748B] hover:text-[#9A7415] hover:bg-white'
                              : 'text-[#64748B] hover:text-[#D4AF37] hover:bg-[#1E293B]'
                          }`}
                          title="Editar obra (2FA)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBook(libro)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isLight
                              ? 'text-[#64748B] hover:text-rose-600 hover:bg-white'
                              : 'text-[#64748B] hover:text-rose-400 hover:bg-[#1E293B]'
                          }`}
                          title="Eliminar obra (2FA)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Vista de Tabla Editorial */
        <div className={`rounded-xl border overflow-hidden ${
          isLight ? 'bg-white border-[#E2E8F0] shadow-xs' : 'bg-[#1E293B] border-[#334155]'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase font-semibold text-[10px] tracking-wider border-b ${
                isLight
                  ? 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
                  : 'bg-[#0B0F17] text-[#94A3B8] border-[#334155]'
              }`}>
                <tr>
                  <th className="py-3.5 px-4 w-12">Portada</th>
                  <th className="py-3.5 px-4">ISBN</th>
                  <th className="py-3.5 px-4">Título de la Obra</th>
                  <th className="py-3.5 px-4">Autor</th>
                  <th className="py-3.5 px-4">Género</th>
                  <th className="py-3.5 px-4 text-right">Venta</th>
                  <th className="py-3.5 px-4 text-right">Alquiler</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-[#E2E8F0]' : 'divide-[#334155]/60'}`}>
                {paginatedBooks.map(libro => {
                  const disponible = Number(libro.stock || 0) > 0;
                  return (
                    <tr key={libro.isbn} className={isLight ? 'hover:bg-[#F8FAFC]' : 'hover:bg-[#0B0F17]/40'}>
                      <td className="py-2.5 px-4 w-12">
                        <div className={`w-8 h-12 rounded-md overflow-hidden border ${isLight ? 'border-[#E2E8F0]' : 'border-[#334155]'}`}>
                          <DynamicBookCover
                            isbn={libro.isbn}
                            title={libro.titulo}
                            author={libro.autor}
                            coverUrl={libro.portada}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className={`py-2.5 px-4 font-mono-code text-[11px] ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>{libro.isbn}</td>
                      <td className={`py-2.5 px-4 font-serif-title font-bold max-w-xs truncate ${isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}`}>{libro.titulo}</td>
                      <td className={`py-2.5 px-4 font-medium ${isLight ? 'text-[#9A7415]' : 'text-[#D4AF37]'}`}>{libro.autor}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2.5 py-0.5 border rounded-md text-[10px] ${
                          isLight ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]' : 'bg-[#0B0F17] border-[#334155] text-[#94A3B8]'
                        }`}>
                          {libro.genero}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono-code font-semibold ${isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}`}>
                        Lps. {Number(libro.precio_venta || 0).toFixed(2)}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono-code font-semibold ${isLight ? 'text-[#9A7415]' : 'text-[#D4AF37]'}`}>
                        Lps. {Number(libro.precio_prestamo || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                          disponible
                            ? isLight
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : isLight
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        }`}>
                          {disponible ? `${libro.stock} disp.` : 'Agotado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectBookDetail(libro)}
                            className={`px-2.5 py-1 border rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-[#F8FAFC] hover:bg-[#D4AF37] text-[#0F172A] border-[#E2E8F0]'
                                : 'bg-[#0B0F17] hover:bg-[#D4AF37] text-[#F1F5F9] hover:text-[#0B0F17] border-[#334155]'
                            }`}
                          >
                            Ver Ficha
                          </button>
                          {disponible && (
                            <>
                              <button
                                type="button"
                                onClick={() => onQuickLoan(libro)}
                                className={`px-2.5 py-1 border rounded-md text-xs transition-colors cursor-pointer ${
                                  isLight
                                    ? 'bg-[#F8FAFC] hover:border-[#D4AF37] text-[#9A7415] border-[#E2E8F0]'
                                    : 'bg-[#0B0F17] hover:border-[#D4AF37] text-[#D4AF37] border-[#334155]'
                                }`}
                              >
                                Alquilar
                              </button>
                              <button
                                type="button"
                                onClick={() => onQuickSale(libro)}
                                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                                  isLight
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                Comprar
                              </button>
                              <button
                                type="button"
                                onClick={() => onAddToCart(libro)}
                                className={`p-1.5 border rounded-md transition-colors cursor-pointer ${
                                  isLight
                                    ? 'bg-[#F8FAFC] text-[#475569] hover:text-[#9A7415] border-[#E2E8F0]'
                                    : 'bg-[#0B0F17] text-[#94A3B8] hover:text-[#D4AF37] border-[#334155]'
                                }`}
                                title="Añadir al carrito"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {activeRole === 'Bibliotecario' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(libro)}
                                className="p-1.5 text-[#64748B] hover:text-[#D4AF37] rounded-md cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteBook(libro)}
                                className="p-1.5 text-[#64748B] hover:text-rose-500 rounded-md cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación Editorial */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs ${
          isLight ? 'bg-white border-[#E2E8F0] text-[#475569] shadow-2xs' : 'bg-[#1E293B] border-[#334155] text-[#94A3B8]'
        }`}>
          <span>
            Mostrando obras <strong className={isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}>{((safeCurrentPage - 1) * pageSize) + 1}</strong> a <strong className={isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}>{Math.min(safeCurrentPage * pageSize, filteredBooks.length)}</strong> de <strong className="text-[#D4AF37]">{filteredBooks.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className={`p-1.5 rounded-lg border hover:border-[#D4AF37] disabled:opacity-30 cursor-pointer ${
                isLight ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]' : 'bg-[#0B0F17] border-[#334155] text-[#F1F5F9]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`font-mono-code font-semibold px-2 ${isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}`}>
              Página {safeCurrentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className={`p-1.5 rounded-lg border hover:border-[#D4AF37] disabled:opacity-30 cursor-pointer ${
                isLight ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]' : 'bg-[#0B0F17] border-[#334155] text-[#F1F5F9]'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
