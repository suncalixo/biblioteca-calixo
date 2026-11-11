-- ========================================================
-- ESQUEMA SQL PARA SUPABASE - BIBLIOTECA CALIXO
-- Copia y pega este script en el SQL Editor de tu proyecto en Supabase
-- ========================================================

-- 1. Tabla de Libros
CREATE TABLE IF NOT EXISTS libros (
    isbn TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    autor TEXT NOT NULL,
    genero TEXT NOT NULL,
    precio_venta NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    precio_prestamo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    sinopsis TEXT,
    portada TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    correo TEXT,
    telefono TEXT,
    direccion TEXT,
    rol TEXT DEFAULT 'Lector',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id_venta SERIAL PRIMARY KEY,
    fecha TEXT NOT NULL,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nombre TEXT NOT NULL,
    isbn TEXT REFERENCES libros(isbn) ON DELETE SET NULL,
    libro_titulo TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    isv NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Préstamos
CREATE TABLE IF NOT EXISTS prestamos (
    id TEXT PRIMARY KEY,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nombre TEXT NOT NULL,
    isbn TEXT REFERENCES libros(isbn) ON DELETE SET NULL,
    libro_titulo TEXT NOT NULL,
    fecha_prestamo TEXT NOT NULL,
    fecha_devolucion_esperada TEXT NOT NULL,
    fecha_devolucion_real TEXT,
    estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (opcional o deshabilitado para pruebas directas con clave de servicio)
ALTER TABLE libros DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE ventas DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos DISABLE ROW LEVEL SECURITY;
