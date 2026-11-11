import { supabase, isSupabaseConfigured, verifyBibliotecarioSession } from './supabaseClient';
import seedData from './seedData.json';

const STORAGE_KEYS = {
  LIBROS: 'calixo_db_libros',
  CLIENTES: 'calixo_db_clientes',
  VENTAS: 'calixo_db_ventas',
  PRESTAMOS: 'calixo_db_prestamos',
};

function getLocalStore(key, defaultList) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback to defaultList
  }
  return structuredClone(defaultList);
}

function saveLocalStore(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

function normalizePrestamos(list) {
  return (list || []).map((p, idx) => ({
    id: p.id ?? p.id_prestamo ?? idx + 1,
    cliente: p.cliente,
    cliente_id: p.cliente_id,
    libro: p.libro,
    isbn: p.isbn,
    fecha_prestamo: p.fecha_prestamo,
    fecha_devolucion: p.fecha_devolucion,
    fecha_devolucion_esperada: p.fecha_devolucion_esperada || p.fecha_devolucion,
    estado: p.estado || (p.devuelto === 'Sí' ? 'Devuelto' : 'Activo'),
  }));
}

/**
 * 1. MOTOR PRINCIPAL: SUPABASE SDK (@supabase/supabase-js)
 * Conecta todas las operaciones del catálogo, filtros, stock, préstamos, ventas y Auth 2FA directamente a Supabase.
 */
async function handleSupabaseRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  // CATÁLOGO DE LIBROS
  if (endpoint === '/api/libros' && method === 'GET') {
    const { data, error } = await supabase.from('libros').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      return { success: true, count: data.length, data };
    }
    // Auto-seed inicial en Supabase si la tabla está vacía
    await supabase.from('libros').upsert(seedData.libros);
    return { success: true, count: seedData.libros.length, data: seedData.libros };
  }

  if (endpoint === '/api/libros' && method === 'POST') {
    const payload = {
      isbn: body.isbn,
      titulo: body.titulo,
      autor: body.autor,
      genero: body.genero,
      precio_venta: Number(body.precio_venta || 0),
      precio_prestamo: Number(body.precio_prestamo || 0),
      stock: Number(body.stock ?? 0),
      disponible: Number(body.stock ?? 0) > 0,
      sinopsis: body.sinopsis || '',
      portada: body.portada || '',
    };
    const { data, error } = await supabase.from('libros').upsert([payload]).select().single();
    if (error) throw error;
    return {
      success: true,
      message: `Libro '${payload.titulo}' catalogado en Supabase.`,
      data: data || payload,
    };
  }

  if (endpoint.startsWith('/api/libros/') && method === 'PUT') {
    const isbn = decodeURIComponent(endpoint.replace('/api/libros/', ''));
    const payload = {
      titulo: body.titulo,
      autor: body.autor,
      genero: body.genero,
      precio_venta: Number(body.precio_venta || 0),
      precio_prestamo: Number(body.precio_prestamo || 0),
      stock: Number(body.stock ?? 0),
      disponible: Number(body.stock ?? 0) > 0,
      sinopsis: body.sinopsis || '',
      portada: body.portada || '',
    };
    const { data, error } = await supabase
      .from('libros')
      .update(payload)
      .eq('isbn', isbn)
      .select()
      .single();
    if (error) throw error;
    return {
      success: true,
      message: `Libro '${payload.titulo}' actualizado en Supabase.`,
      data: data || { isbn, ...payload },
    };
  }

  if (endpoint.startsWith('/api/libros/') && method === 'DELETE') {
    const isbn = decodeURIComponent(endpoint.replace('/api/libros/', ''));
    const { error } = await supabase.from('libros').delete().eq('isbn', isbn);
    if (error) throw error;
    return {
      success: true,
      message: `Libro con ISBN '${isbn}' eliminado de Supabase.`,
    };
  }

  // GÉNEROS LITERARIOS
  if (endpoint === '/api/generos' && method === 'GET') {
    const { data, error } = await supabase.from('libros').select('genero');
    if (error) throw error;
    const source = data && data.length > 0 ? data : seedData.libros;
    const uniqueGeneros = [...new Set(source.map(item => item.genero).filter(Boolean))];
    return { success: true, data: uniqueGeneros };
  }

  // CLIENTES Y ROLES
  if (endpoint === '/api/clientes' && method === 'GET') {
    const { data, error } = await supabase.from('clientes').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      return { success: true, count: data.length, data };
    }
    await supabase.from('clientes').upsert(seedData.clientes);
    return { success: true, count: seedData.clientes.length, data: seedData.clientes };
  }

  if (endpoint === '/api/clientes' && method === 'POST') {
    const { data, error } = await supabase.from('clientes').upsert([body]).select().single();
    if (error) throw error;
    return {
      success: true,
      message: `Cliente '${body.nombre}' registrado en Supabase.`,
      data: data || body,
    };
  }

  if (endpoint.startsWith('/api/clientes/') && method === 'PUT') {
    const cid = decodeURIComponent(endpoint.replace('/api/clientes/', ''));
    const { data, error } = await supabase
      .from('clientes')
      .update(body)
      .eq('id', cid)
      .select()
      .single();
    if (error) throw error;
    return {
      success: true,
      message: `Cliente '${body.nombre}' actualizado en Supabase.`,
      data: data || { id: cid, ...body },
    };
  }

  if (endpoint.startsWith('/api/clientes/') && method === 'DELETE') {
    const cid = decodeURIComponent(endpoint.replace('/api/clientes/', ''));
    const { error } = await supabase.from('clientes').delete().eq('id', cid);
    if (error) throw error;
    return {
      success: true,
      message: `Cliente '${cid}' eliminado de Supabase.`,
    };
  }

  // VENTAS Y EXISTENCIAS
  if (endpoint === '/api/ventas' && method === 'GET') {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .order('id_venta', { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) {
      return { success: true, count: data.length, data };
    }
    return { success: true, count: seedData.ventas.length, data: seedData.ventas };
  }

  if (endpoint === '/api/ventas' && method === 'POST') {
    const { data: libroData } = await supabase
      .from('libros')
      .select('*')
      .eq('isbn', body.isbn)
      .single();
    const { data: clienteData } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', body.cliente_id)
      .single();

    if (libroData) {
      const cantidad = Number(body.cantidad || 1);
      const nuevoStock = Math.max(0, Number(libroData.stock || 0) - cantidad);
      const total = Number(libroData.precio_venta || 0) * cantidad;

      await supabase
        .from('libros')
        .update({ stock: nuevoStock, disponible: nuevoStock > 0 })
        .eq('isbn', body.isbn);

      const nuevaVenta = {
        fecha: new Date().toLocaleDateString('es-HN'),
        cliente: clienteData?.nombre || body.cliente_id,
        cliente_id: body.cliente_id,
        libro: libroData.titulo,
        isbn: body.isbn,
        cantidad,
        total,
      };

      const { data: ventaInsertada, error } = await supabase
        .from('ventas')
        .insert([nuevaVenta])
        .select()
        .single();
      if (error) throw error;

      return {
        success: true,
        message: `Venta registrada en Supabase. Total: Lps. ${total.toFixed(2)}`,
        data: ventaInsertada || { id_venta: Date.now(), ...nuevaVenta },
      };
    }
  }

  // PRÉSTAMOS Y DEVOLUCIONES
  if (endpoint === '/api/prestamos' && method === 'GET') {
    const { data, error } = await supabase
      .from('prestamos')
      .select('*')
      .order('id', { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) {
      return { success: true, count: data.length, data: normalizePrestamos(data) };
    }
    return {
      success: true,
      count: seedData.prestamos.length,
      data: normalizePrestamos(seedData.prestamos),
    };
  }

  if (endpoint === '/api/prestamos' && method === 'POST') {
    const { data: libroData } = await supabase
      .from('libros')
      .select('*')
      .eq('isbn', body.isbn)
      .single();
    const { data: clienteData } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', body.cliente_id)
      .single();

    if (libroData) {
      const nuevoStock = Math.max(0, Number(libroData.stock || 0) - 1);
      await supabase
        .from('libros')
        .update({ stock: nuevoStock, disponible: nuevoStock > 0 })
        .eq('isbn', body.isbn);

      const dias = Number(body.dias || 14);
      const fechaSalida = new Date();
      const fechaEntrega = new Date(Date.now() + dias * 86400000);

      const nuevoPrestamo = {
        cliente: clienteData?.nombre || body.cliente_id,
        cliente_id: body.cliente_id,
        libro: libroData.titulo,
        isbn: body.isbn,
        fecha_prestamo: fechaSalida.toLocaleDateString('es-HN'),
        fecha_devolucion: fechaEntrega.toLocaleDateString('es-HN'),
        fecha_devolucion_esperada: fechaEntrega.toISOString().split('T')[0],
        estado: 'Activo',
      };

      const { data: prestamoInsertado, error } = await supabase
        .from('prestamos')
        .insert([nuevoPrestamo])
        .select()
        .single();
      if (error) throw error;

      return {
        success: true,
        message: 'Préstamo registrado en Supabase.',
        data: prestamoInsertado || { id: Date.now(), ...nuevoPrestamo },
      };
    }
  }

  if (endpoint.endsWith('/devolver') && method === 'POST') {
    const pid = decodeURIComponent(
      endpoint.replace('/api/prestamos/', '').replace('/devolver', '')
    );
    const { data: prestamoData } = await supabase
      .from('prestamos')
      .select('*')
      .eq('id', pid)
      .single();

    if (prestamoData) {
      await supabase.from('prestamos').update({ estado: 'Devuelto' }).eq('id', pid);
      if (prestamoData.isbn) {
        const { data: libroData } = await supabase
          .from('libros')
          .select('stock')
          .eq('isbn', prestamoData.isbn)
          .single();
        if (libroData) {
          const nuevoStock = Number(libroData.stock || 0) + 1;
          await supabase
            .from('libros')
            .update({ stock: nuevoStock, disponible: true })
            .eq('isbn', prestamoData.isbn);
        }
      }
      return {
        success: true,
        message: `Libro '${prestamoData.libro}' devuelto y stock restaurado en Supabase.`,
      };
    }
  }

  // ESTADÍSTICAS
  if (endpoint === '/api/stats' && method === 'GET') {
    const [{ data: vData }, { data: lData }, { data: pData }] = await Promise.all([
      supabase.from('ventas').select('total'),
      supabase.from('libros').select('stock'),
      supabase.from('prestamos').select('estado'),
    ]);
    const ventasSource = vData && vData.length > 0 ? vData : seedData.ventas;
    const librosSource = lData && lData.length > 0 ? lData : seedData.libros;
    const prestamosSource = pData && pData.length > 0 ? pData : normalizePrestamos(seedData.prestamos);

    const totalIngresos = ventasSource.reduce((acc, v) => acc + Number(v.total || 0), 0);
    const totalStock = librosSource.reduce((acc, l) => acc + Number(l.stock || 0), 0);
    const activos = prestamosSource.filter(p => p.estado?.toLowerCase() !== 'devuelto').length;

    return {
      success: true,
      data: {
        total_ingresos_ventas: totalIngresos,
        total_stock_fisico: totalStock,
        prestamos_activos: activos,
      },
    };
  }

  // RESTAURAR CATÁLOGO BASE EN SUPABASE
  if (endpoint === '/api/reset' && method === 'POST') {
    await supabase.from('libros').upsert(seedData.libros);
    await supabase.from('clientes').upsert(seedData.clientes);
    return {
      success: true,
      message: 'Catálogo sincronizado y restaurado en Supabase.',
    };
  }

  // VERIFICACIÓN 2FA CON SUPABASE AUTH
  if (endpoint === '/api/2fa/verify' && method === 'POST') {
    return await verifyBibliotecarioSession(body.code);
  }

  return null;
}

/**
 * 2. MOTOR STANDALONE PARA DEPLOY WEB (cuando se despliega en Vercel/Netlify sin backend local)
 */
function handleStandaloneStoreRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  let libros = getLocalStore(STORAGE_KEYS.LIBROS, seedData.libros);
  let clientes = getLocalStore(STORAGE_KEYS.CLIENTES, seedData.clientes);
  let ventas = getLocalStore(STORAGE_KEYS.VENTAS, seedData.ventas);
  let prestamos = normalizePrestamos(getLocalStore(STORAGE_KEYS.PRESTAMOS, seedData.prestamos));

  if (endpoint === '/api/libros' && method === 'GET') {
    return { success: true, count: libros.length, data: libros };
  }

  if (endpoint === '/api/libros' && method === 'POST') {
    const nuevo = {
      isbn: body.isbn,
      titulo: body.titulo,
      autor: body.autor,
      genero: body.genero,
      precio_venta: Number(body.precio_venta || 0),
      precio_prestamo: Number(body.precio_prestamo || 0),
      stock: Number(body.stock ?? 0),
      disponible: Number(body.stock ?? 0) > 0,
      sinopsis: body.sinopsis || '',
      portada: body.portada || '',
    };
    libros = [nuevo, ...libros.filter(l => l.isbn !== nuevo.isbn)];
    saveLocalStore(STORAGE_KEYS.LIBROS, libros);
    return { success: true, message: `Libro '${nuevo.titulo}' catalogado exitosamente.`, data: nuevo };
  }

  if (endpoint.startsWith('/api/libros/') && method === 'PUT') {
    const isbn = decodeURIComponent(endpoint.replace('/api/libros/', ''));
    libros = libros.map(l =>
      l.isbn === isbn
        ? {
            ...l,
            ...body,
            precio_venta: Number(body.precio_venta ?? l.precio_venta),
            precio_prestamo: Number(body.precio_prestamo ?? l.precio_prestamo),
            stock: Number(body.stock ?? l.stock),
            disponible: Number(body.stock ?? l.stock) > 0,
          }
        : l
    );
    saveLocalStore(STORAGE_KEYS.LIBROS, libros);
    return { success: true, message: `Obra '${body.titulo || isbn}' actualizada.` };
  }

  if (endpoint.startsWith('/api/libros/') && method === 'DELETE') {
    const isbn = decodeURIComponent(endpoint.replace('/api/libros/', ''));
    libros = libros.filter(l => l.isbn !== isbn);
    saveLocalStore(STORAGE_KEYS.LIBROS, libros);
    return { success: true, message: `Obra '${isbn}' eliminada del catálogo.` };
  }

  if (endpoint === '/api/generos' && method === 'GET') {
    const generos = [...new Set(libros.map(l => l.genero).filter(Boolean))];
    return { success: true, data: generos };
  }

  if (endpoint === '/api/clientes' && method === 'GET') {
    return { success: true, count: clientes.length, data: clientes };
  }

  if (endpoint === '/api/clientes' && method === 'POST') {
    clientes = [...clientes.filter(c => c.id !== body.id), body];
    saveLocalStore(STORAGE_KEYS.CLIENTES, clientes);
    return { success: true, message: `Cliente '${body.nombre}' registrado.`, data: body };
  }

  if (endpoint.startsWith('/api/clientes/') && method === 'PUT') {
    const cid = decodeURIComponent(endpoint.replace('/api/clientes/', ''));
    clientes = clientes.map(c => (c.id === cid ? { ...c, ...body } : c));
    saveLocalStore(STORAGE_KEYS.CLIENTES, clientes);
    return { success: true, message: `Cliente actualizado.` };
  }

  if (endpoint.startsWith('/api/clientes/') && method === 'DELETE') {
    const cid = decodeURIComponent(endpoint.replace('/api/clientes/', ''));
    clientes = clientes.filter(c => c.id !== cid);
    saveLocalStore(STORAGE_KEYS.CLIENTES, clientes);
    return { success: true, message: `Cliente eliminado.` };
  }

  if (endpoint === '/api/ventas' && method === 'GET') {
    return { success: true, count: ventas.length, data: ventas };
  }

  if (endpoint === '/api/ventas' && method === 'POST') {
    const libro = libros.find(l => l.isbn === body.isbn);
    const cliente = clientes.find(c => c.id === body.cliente_id);
    const cantidad = Number(body.cantidad || 1);
    const total = (libro ? Number(libro.precio_venta || 0) : 0) * cantidad;

    if (libro) {
      libro.stock = Math.max(0, Number(libro.stock || 0) - cantidad);
      libro.disponible = libro.stock > 0;
      saveLocalStore(STORAGE_KEYS.LIBROS, libros);
    }

    const nuevaVenta = {
      id_venta: ventas.length > 0 ? Math.max(...ventas.map(v => Number(v.id_venta || 0))) + 1 : 1,
      fecha: new Date().toLocaleDateString('es-HN'),
      cliente: cliente?.nombre || body.cliente_id,
      cliente_id: body.cliente_id,
      libro: libro?.titulo || body.isbn,
      isbn: body.isbn,
      cantidad,
      total,
    };
    ventas = [...ventas, nuevaVenta];
    saveLocalStore(STORAGE_KEYS.VENTAS, ventas);
    return {
      success: true,
      message: `Venta registrada exitosamente. Total: Lps. ${total.toFixed(2)}`,
      data: nuevaVenta,
    };
  }

  if (endpoint === '/api/prestamos' && method === 'GET') {
    return { success: true, count: prestamos.length, data: prestamos };
  }

  if (endpoint === '/api/prestamos' && method === 'POST') {
    const libro = libros.find(l => l.isbn === body.isbn);
    const cliente = clientes.find(c => c.id === body.cliente_id);
    if (libro) {
      libro.stock = Math.max(0, Number(libro.stock || 0) - 1);
      libro.disponible = libro.stock > 0;
      saveLocalStore(STORAGE_KEYS.LIBROS, libros);
    }
    const dias = Number(body.dias || 14);
    const fechaEntrega = new Date(Date.now() + dias * 86400000);
    const nuevoPrestamo = {
      id: prestamos.length > 0 ? Math.max(...prestamos.map(p => Number(p.id || 0))) + 1 : 1,
      cliente: cliente?.nombre || body.cliente_id,
      cliente_id: body.cliente_id,
      libro: libro?.titulo || body.isbn,
      isbn: body.isbn,
      fecha_prestamo: new Date().toLocaleDateString('es-HN'),
      fecha_devolucion: fechaEntrega.toLocaleDateString('es-HN'),
      fecha_devolucion_esperada: fechaEntrega.toISOString().split('T')[0],
      estado: 'Activo',
    };
    prestamos = [...prestamos, nuevoPrestamo];
    saveLocalStore(STORAGE_KEYS.PRESTAMOS, prestamos);
    return {
      success: true,
      message: `Préstamo registrado hasta el ${nuevoPrestamo.fecha_devolucion}.`,
      data: nuevoPrestamo,
    };
  }

  if (endpoint.endsWith('/devolver') && method === 'POST') {
    const pid = decodeURIComponent(
      endpoint.replace('/api/prestamos/', '').replace('/devolver', '')
    );
    const target = prestamos.find(p => String(p.id) === String(pid));
    if (target) {
      target.estado = 'Devuelto';
      saveLocalStore(STORAGE_KEYS.PRESTAMOS, prestamos);
      const libro = libros.find(l => l.isbn === target.isbn || l.titulo === target.libro);
      if (libro) {
        libro.stock = Number(libro.stock || 0) + 1;
        libro.disponible = true;
        saveLocalStore(STORAGE_KEYS.LIBROS, libros);
      }
    }
    return { success: true, message: 'Libro devuelto y stock restaurado.' };
  }

  if (endpoint === '/api/stats' && method === 'GET') {
    const totalIngresos = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
    const totalStock = libros.reduce((acc, l) => acc + Number(l.stock || 0), 0);
    const activos = prestamos.filter(p => p.estado?.toLowerCase() !== 'devuelto').length;
    return {
      success: true,
      data: {
        total_ingresos_ventas: totalIngresos,
        total_stock_fisico: totalStock,
        prestamos_activos: activos,
      },
    };
  }

  if (endpoint === '/api/reset' && method === 'POST') {
    localStorage.removeItem(STORAGE_KEYS.LIBROS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTES);
    localStorage.removeItem(STORAGE_KEYS.VENTAS);
    localStorage.removeItem(STORAGE_KEYS.PRESTAMOS);
    return { success: true, message: 'Catálogo restaurado a sus valores originales.' };
  }

  return { success: true };
}

export async function fetchApi(endpoint, options = {}) {
  // 1. Conexión Directa a Supabase (@supabase/supabase-js)
  if (isSupabaseConfigured()) {
    try {
      const sbResult = await handleSupabaseRequest(endpoint, options);
      if (sbResult !== null) {
        return sbResult;
      }
    } catch (sbErr) {
      console.warn(`[Supabase Error on ${endpoint}]:`, sbErr.message);
    }
  }

  // 2. Sincronización con API REST o Motor Cloud Standalone para Deploy
  try {
    const token = localStorage.getItem('calixo_jwt_token') || '';
    const res = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // En producción estática (Vercel/Netlify) sin backend local, usar el motor standalone sincronizado
  }

  return handleStandaloneStoreRequest(endpoint, options);
}
