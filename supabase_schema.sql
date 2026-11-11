-- ==========================================================
-- BIBLIOTECA CALIXO — SABER DE ALEJANDRÍA
-- Script SQL para inicializar tablas en Supabase (SQL Editor)
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.libros (
  isbn TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL,
  genero TEXT NOT NULL,
  precio_venta NUMERIC(10, 2) NOT NULL DEFAULT 0,
  precio_prestamo NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  sinopsis TEXT DEFAULT '',
  portada TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  rol TEXT NOT NULL DEFAULT 'Lector'
);

CREATE TABLE IF NOT EXISTS public.ventas (
  id_venta SERIAL PRIMARY KEY,
  fecha TEXT NOT NULL,
  cliente TEXT NOT NULL,
  cliente_id TEXT REFERENCES public.clientes(id) ON DELETE SET NULL,
  libro TEXT NOT NULL,
  isbn TEXT REFERENCES public.libros(isbn) ON DELETE SET NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.prestamos (
  id SERIAL PRIMARY KEY,
  cliente TEXT NOT NULL,
  cliente_id TEXT REFERENCES public.clientes(id) ON DELETE SET NULL,
  libro TEXT NOT NULL,
  isbn TEXT REFERENCES public.libros(isbn) ON DELETE SET NULL,
  fecha_prestamo TEXT NOT NULL,
  fecha_devolucion TEXT NOT NULL,
  fecha_devolucion_esperada TEXT,
  estado TEXT NOT NULL DEFAULT 'Activo'
);

-- Habilitar acceso de lectura/escritura pública para el cliente anon (ajustable según políticas RLS)
ALTER TABLE public.libros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso completo a libros" ON public.libros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso completo a clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso completo a ventas" ON public.ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso completo a prestamos" ON public.prestamos FOR ALL USING (true) WITH CHECK (true);
