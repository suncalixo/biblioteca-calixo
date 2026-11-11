import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, ShoppingCart, Calendar, FileText,
  RotateCcw, Menu, X, Landmark,
  CheckCircle2, AlertCircle, ChevronLeft, Shield,
  Sun, Moon, ShoppingBag, User
} from 'lucide-react';

import { fetchApi } from './services/api';
import BooksView from './components/BooksView';
import VentasView from './components/VentasView';
import PrestamosView from './components/PrestamosView';
import ClientesView from './components/ClientesView';
import ReportsView from './components/ReportsView';
import TwoFactorModal from './components/TwoFactorModal';
import FacturaModal from './components/FacturaModal';
import BookModal from './components/BookModal';
import ClienteModal from './components/ClienteModal';
import VentaModal from './components/VentaModal';
import PrestamoModal from './components/PrestamoModal';
import BookDetailModal from './components/BookDetailModal';
import CartModal from './components/CartModal';
import BookReviewsModal from './components/BookReviewsModal';
import UserProfileModal from './components/UserProfileModal';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState('catalogo');
  const [activeRole, setActiveRole] = useState('Bibliotecario');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Gestión Global de Tema: Modo Oscuro ('dark') / Modo Claro ('light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('calixo_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('calixo_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F1F5F9';
      document.body.style.color = '#0F172A';
    } else {
      root.classList.add('dark');
      root.classList.remove('light-theme');
      document.body.style.backgroundColor = '#0F172A';
      document.body.style.color = '#F1F5F9';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isLight = theme === 'light';

  // Carrito de Reservas / Compras Múltiples
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('calixo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('calixo_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const handleAddToCart = (book) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.isbn === book.isbn);
      if (exists) {
        showToast("Carrito Actualizado", `"${book.titulo}" ya está en el carrito.`, "info");
        return prev;
      }
      showToast("Añadido al Carrito", `"${book.titulo}" agregado a tus reservas.`, "success");
      return [...prev, { ...book, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (isbn) => {
    setCartItems(prev => prev.filter(i => i.isbn !== isbn));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Data State
  const [libros, setLibros] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Notification Toast State
  const [toast, setToast] = useState(null);

  // Modales
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [twoFactorAction, setTwoFactorAction] = useState(null);
  const [twoFactorTitle, setTwoFactorTitle] = useState('Verificación 2FA Requerida');
  const [twoFactorDesc, setTwoFactorDesc] = useState('');

  const [facturaOpen, setFacturaOpen] = useState(false);
  const [currentFactura, setCurrentFactura] = useState(null);

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  const [ventaModalOpen, setVentaModalOpen] = useState(false);
  const [selectedBookForSale, setSelectedBookForSale] = useState(null);

  const [prestamoModalOpen, setPrestamoModalOpen] = useState(false);
  const [selectedBookForLoan, setSelectedBookForLoan] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState(null);

  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [selectedBookForReviews, setSelectedBookForReviews] = useState(null);

  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [bRes, cRes, vRes, pRes, gRes, sRes] = await Promise.all([
        fetchApi('/api/libros'),
        fetchApi('/api/clientes'),
        fetchApi('/api/ventas'),
        fetchApi('/api/prestamos'),
        fetchApi('/api/generos'),
        fetchApi('/api/stats')
      ]);

      if (bRes.success) setLibros(bRes.data);
      if (cRes.success) setClientes(cRes.data);
      if (vRes.success) setVentas(vRes.data);
      if (pRes.success) setPrestamos(pRes.data);
      if (gRes.success) setGeneros(gRes.data);
      if (sRes.success) setStats(sRes.data);
    } catch (err) {
      showToast('Error de Carga', 'No se pudieron sincronizar los datos con el servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Security Enforcement
  const require2FA = (action, title, desc) => {
    setTwoFactorTitle(title || 'Autenticación 2FA (TOTP)');
    setTwoFactorDesc(desc || 'Operación sensible protegida con clave dinámica');
    setTwoFactorAction(() => action);
    setTwoFactorOpen(true);
  };

  const handleRoleChange = (newRole) => {
    if (newRole === 'Bibliotecario' && activeRole !== 'Bibliotecario') {
      require2FA(
        () => {
          setActiveRole('Bibliotecario');
          showToast('Acceso Autorizado', 'Rol de Bibliotecario activado con verificación 2FA.');
        },
        'Acceso de Bibliotecario (2FA)',
        'Valida tu token dinámico para desbloquear permisos administrativos'
      );
      return;
    }
    setActiveRole(newRole);
    showToast('Rol Cambiado', `Ahora estás operando como: ${newRole}`, 'info');
  };

  // Book Handlers (2FA Protected)
  const handleOpenNewBook = () => {
    require2FA(() => {
      setEditingBook(null);
      setBookModalOpen(true);
    }, 'Creación de Obra (2FA)', 'Verificación requerida para catalogar libros');
  };

  const handleOpenEditBook = (book) => {
    require2FA(() => {
      setEditingBook(book);
      setBookModalOpen(true);
    }, 'Edición de Obra (2FA)', `Modificación del registro ${book.isbn}`);
  };

  const handleDeleteBook = (book) => {
    require2FA(async () => {
      try {
        const res = await fetchApi(`/api/libros/${encodeURIComponent(book.isbn)}`, {
          method: 'DELETE'
        });
        if (res.success) {
          showToast('Libro Eliminado', res.message);
          loadAllData();
        }
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    }, 'Eliminación Protegida (2FA)', `Eliminar permanentemente "${book.titulo}"`);
  };

  const handleSaveBook = async (formData) => {
    let res;
    if (editingBook) {
      res = await fetchApi(`/api/libros/${encodeURIComponent(editingBook.isbn)}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
    } else {
      res = await fetchApi('/api/libros', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    }
    if (res.success) {
      showToast('Libro Guardado', res.message);
      loadAllData();
    }
  };

  // Client Handlers
  const handleSaveCliente = async (formData) => {
    let res;
    if (editingCliente) {
      res = await fetchApi(`/api/clientes/${encodeURIComponent(editingCliente.id)}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
    } else {
      res = await fetchApi('/api/clientes', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    }
    if (res.success) {
      showToast('Cliente Registrado', res.message);
      loadAllData();
    }
  };

  const handleDeleteCliente = async (cliente) => {
    try {
      const res = await fetchApi(`/api/clientes/${encodeURIComponent(cliente.id)}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showToast('Cliente Eliminado', res.message);
        loadAllData();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Generador de Respaldo de Factura Fiscal SAR en Frontend
  const numeroALetras = (monto) => {
    const entero = Math.floor(Number(monto || 0));
    const centavos = Math.round((Number(monto || 0) - entero) * 100);
    return `${entero.toLocaleString('es-HN')} LEMPIRAS CON ${String(centavos).padStart(2, '0')}/100 M.N.`;
  };

  const buildSarFactura = (ventaObj) => {
    if (!ventaObj) return null;
    const idVenta = Number(ventaObj.id_venta || 1);
    const clienteEncontrado = clientes.find(
      c => c.id === ventaObj.cliente_id || c.nombre === ventaObj.cliente
    );
    const libroEncontrado = libros.find(
      l => l.isbn === ventaObj.isbn || l.titulo === ventaObj.libro
    );

    const cantidad = Number(ventaObj.cantidad || 1);
    const total = Number(ventaObj.total || (libroEncontrado ? libroEncontrado.precio_venta * cantidad : 0));
    const precioUnitario = cantidad > 0 ? total / cantidad : total;
    const importeGravado = Number((total / 1.15).toFixed(2));
    const isv15 = Number((total - importeGravado).toFixed(2));

    return {
      id_venta: idVenta,
      numero_factura: `001-001-01-${String(idVenta).padStart(8, '0')}`,
      fecha_emision: ventaObj.fecha || new Date().toLocaleDateString('es-HN'),
      cai: '3B4F9A-C87E12-4091A8-9B2100-881201-01',
      rango_autorizado: '001-001-01-00000001 al 001-001-01-00005000 (Límite: 31/12/2026)',
      cliente: {
        id: clienteEncontrado?.id || ventaObj.cliente_id || '0801-9999-00000',
        nombre: clienteEncontrado?.nombre || ventaObj.cliente || 'Consumidor Final',
        correo: clienteEncontrado?.correo || 'cliente@calixo.hn',
        telefono: clienteEncontrado?.telefono || '+504 2234-5678',
        direccion: clienteEncontrado?.direccion || 'Tegucigalpa, M.D.C., Honduras'
      },
      item: {
        isbn: ventaObj.isbn || libroEncontrado?.isbn || 'N/A',
        libro: ventaObj.libro || libroEncontrado?.titulo || 'Obra Literaria',
        cantidad,
        precio_unitario: precioUnitario,
        subtotal: total
      },
      totales: {
        importe_exento: 0.0,
        importe_gravado_15: importeGravado,
        descuento: 0.0,
        isv_15: isv15,
        total: total,
        total_letras: numeroALetras(total)
      }
    };
  };

  // Venta Handlers & Fiscal Invoice
  const handleSaveVenta = async (payload) => {
    const res = await fetchApi('/api/ventas', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.success) {
      showToast('Venta Exitosa', res.message);
      await loadAllData();
      const facturaEmitida = res.factura || buildSarFactura(res.data);
      if (facturaEmitida) {
        setCurrentFactura(facturaEmitida);
        setFacturaOpen(true);
      }
    }
  };

  const handleOpenFactura = async (idVenta) => {
    try {
      const res = await fetchApi(`/api/factura/${idVenta}`);
      if (res && res.success && res.data) {
        setCurrentFactura(res.data);
        setFacturaOpen(true);
        return;
      }
    } catch {
      // Fallback directo si el servidor activo no tiene la ruta /api/factura en memoria
    }

    const ventaLocal = ventas.find(v => Number(v.id_venta) === Number(idVenta));
    if (ventaLocal) {
      setCurrentFactura(buildSarFactura(ventaLocal));
      setFacturaOpen(true);
    } else {
      showToast('Error', `No se encontró la factura #${idVenta}.`, 'error');
    }
  };

  // Prestamo Handlers
  const handleSavePrestamo = async (payload) => {
    const res = await fetchApi('/api/prestamos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.success) {
      showToast('Préstamo Registrado', res.message);
      loadAllData();
    }
  };

  const handleDevolverPrestamo = async (idPrestamo) => {
    try {
      const res = await fetchApi(`/api/prestamos/${encodeURIComponent(idPrestamo)}/devolver`, {
        method: 'POST'
      });
      if (res.success) {
        showToast('Libro Devuelto', res.message);
        loadAllData();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Procesamiento por Lote del Carrito
  const handleBatchSale = async (clienteId, items) => {
    let lastFactura = null;
    for (const item of items) {
      const res = await fetchApi('/api/ventas', {
        method: 'POST',
        body: JSON.stringify({
          cliente_id: clienteId,
          isbn: item.isbn,
          cantidad: item.quantity || 1
        })
      });
      if (res.factura) {
        lastFactura = res.factura;
      } else if (res.data) {
        lastFactura = buildSarFactura(res.data);
      }
    }
    showToast("Ventas Registradas", `${items.length} obras facturadas exitosamente.`);
    setCartItems([]);
    loadAllData();
    if (lastFactura) {
      setCurrentFactura(lastFactura);
      setFacturaOpen(true);
    }
  };

  const handleBatchLoan = async (clienteId, items, dias) => {
    for (const item of items) {
      await fetchApi('/api/prestamos', {
        method: 'POST',
        body: JSON.stringify({
          cliente_id: clienteId,
          isbn: item.isbn,
          dias: dias || 14
        })
      });
    }
    showToast("Préstamos Registrados", `${items.length} obras prestadas exitosamente.`);
    setCartItems([]);
    loadAllData();
  };

  // Reset System
  const handleReset = async () => {
    if (!window.confirm('¿Deseas restaurar la base de datos a los valores originales requeridos (Dune, Juego de Tronos, Andrea Medina, etc.)?')) return;
    try {
      const res = await fetchApi('/api/reset', { method: 'POST' });
      if (res.success) {
        showToast('Sistema Restaurado', res.message);
        loadAllData();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const navItems = [
    { id: 'catalogo', label: 'Catálogo por Géneros', icon: BookOpen, count: libros.length },
    { id: 'prestamos', label: 'Préstamos y Alquileres', icon: Calendar, count: prestamos.filter(p => p.estado?.toLowerCase() !== 'devuelto').length },
    { id: 'ventas', label: 'Ventas de Libros', icon: ShoppingCart, count: ventas.length },
    { id: 'clientes', label: 'Clientes y Roles', icon: Users, count: clientes.length },
    { id: 'reportes', label: 'Centro de Reportes', icon: FileText }
  ];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-250 ${
      isLight ? 'bg-[#F1F5F9] text-[#0F172A]' : 'bg-[#0F172A] text-[#F1F5F9]'
    }`}>
      
      {/* Toast Notification with AnimatePresence */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-2xl border ${
              isLight
                ? 'bg-white border-[#E2E8F0] text-[#0F172A] shadow-lg'
                : toast.type === 'error'
                ? 'bg-[#1E293B]/95 border-rose-500/40 text-rose-200'
                : 'bg-[#1E293B]/95 border-[#D4AF37]/40 text-[#F1F5F9]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
            )}
            <div>
              <div className="font-bold text-xs tracking-wide">{toast.title}</div>
              <div className={`text-xs mt-0.5 ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>{toast.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menú Lateral (Sidebar de 270px sin truncamiento y adaptable a Modo Claro/Oscuro) */}
      <aside
        style={{
          width: sidebarCollapsed ? '80px' : '270px',
          minWidth: sidebarCollapsed ? '80px' : '270px'
        }}
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col justify-between transition-all duration-300 shrink-0 border-r ${
          isLight
            ? 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]'
            : 'bg-[#0B0F17] text-[#F1F5F9] border-[#1E293B]'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${sidebarCollapsed ? 'w-20' : 'w-[270px] min-w-[270px]'}`}
      >
        
        <div>
          {/* Brand Header — BIBLIOTECA CALIXO + SABER DE ALEJANDRÍA completos sin puntos suspensivos */}
          <div className={`px-4 py-5 border-b flex items-center justify-between gap-2 ${
            isLight ? 'border-[#E2E8F0]' : 'border-[#334155]/70'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="w-9 h-9 bg-gradient-to-br from-[#E5C158] via-[#D4AF37] to-[#9A7B1C] rounded-xl flex items-center justify-center text-[#0B0F17] shadow-md">
                  <Landmark className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 rounded-full ${
                  isLight ? 'border-[#F8FAFC]' : 'border-[#0B0F17]'
                }`} />
              </div>
              
              {!sidebarCollapsed && (
                <div className="flex flex-col justify-center">
                  <h1 className={`font-serif-title font-bold text-[14.5px] tracking-[0.03em] uppercase whitespace-nowrap leading-snug ${
                    isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'
                  }`}>
                    BIBLIOTECA CALIXO
                  </h1>
                  <p className={`text-[9.5px] uppercase tracking-[0.16em] font-bold mt-0.5 whitespace-nowrap ${
                    isLight ? 'text-[#9A7415]' : 'text-[#D4AF37]'
                  }`}>
                    SABER DE ALEJANDRÍA
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center shrink-0">
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="md:hidden p-1.5 rounded-lg text-theme-secondary hover:text-theme-main"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`hidden md:flex p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60'
                    : 'text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#1E293B]'
                }`}
                title={sidebarCollapsed ? "Expandir Menú" : "Contraer Menú"}
              >
                <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Etiqueta de Sección */}
          {!sidebarCollapsed && (
            <div className="px-5 pt-5 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748B]">
                Módulos Editoriales
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1.5 text-[13px]">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full group relative flex items-center ${sidebarCollapsed ? 'justify-center py-3' : 'justify-between px-3.5 py-2.5'} rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'nav-item-active font-semibold'
                      : isLight
                      ? 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 font-medium border-l-[3px] border-transparent'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B]/60 font-medium border-l-[3px] border-transparent'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-[17px] h-[17px] shrink-0 transition-colors ${
                      isActive
                        ? isLight ? 'text-[#9A7415]' : 'text-[#D4AF37]'
                        : 'text-[#64748B] group-hover:text-[#D4AF37]'
                    }`} />
                    {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </div>
                  
                  {!sidebarCollapsed && item.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono-code transition-colors ${
                      isActive
                        ? isLight
                          ? 'bg-[#D4AF37]/20 text-[#9A7415] border border-[#D4AF37]/40 font-bold'
                          : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold'
                        : isLight
                        ? 'bg-white text-[#475569] border border-[#E2E8F0]'
                        : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Usuario Activo & Botón Restaurar */}
        <div className={`p-4 border-t space-y-3 ${isLight ? 'border-[#E2E8F0]' : 'border-[#334155]/70'}`}>
          
          {/* Card Usuario Activo */}
          <div 
            onClick={() => setUserProfileModalOpen(true)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-white border-[#E2E8F0] hover:border-[#D4AF37] shadow-xs'
                : 'bg-[#1E293B] border-[#334155] hover:border-[#D4AF37]/40'
            }`}
            title="Ver Historial y Perfil de Usuario"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <User className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-semibold">
                    Sesión Activa
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-xs font-bold truncate ${isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}`}>
                      {activeRole}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <div className={`mt-3 pt-2.5 border-t ${isLight ? 'border-[#E2E8F0]' : 'border-[#334155]/70'}`} onClick={e => e.stopPropagation()}>
                <label className="block text-[9.5px] uppercase tracking-wider text-[#64748B] mb-1 font-semibold">
                  Cambiar Rol Operativo
                </label>
                <select
                  value={activeRole}
                  onChange={e => handleRoleChange(e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer ${
                    isLight
                      ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#9A7415]'
                      : 'bg-[#0B0F17] border-[#334155] text-[#D4AF37]'
                  }`}
                >
                  <option value="Bibliotecario">Bibliotecario (2FA)</option>
                  <option value="Estudiante">Estudiante Universitario</option>
                  <option value="Lector">Lector General</option>
                  <option value="Comprador">Comprador</option>
                </select>
              </div>
            )}
          </div>

          {/* Botón Restaurar Datos */}
          <button
            onClick={handleReset}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] border-[#E2E8F0] shadow-2xs'
                : 'bg-[#1E293B]/60 hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9] border-[#334155]'
            } ${sidebarCollapsed ? 'p-2' : ''}`}
            title="Restaurar Datos Predeterminados"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
            {!sidebarCollapsed && <span>Restaurar Catálogo Base</span>}
          </button>
        </div>

      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Encabezado Superior Adaptable a Modo Claro / Oscuro */}
        <header className={`h-[76px] flex items-center justify-between px-6 z-20 shrink-0 border-b transition-colors duration-250 ${
          isLight
            ? 'bg-white border-[#E2E8F0] text-[#0F172A] shadow-2xs'
            : 'bg-[#0F172A]/95 border-[#334155] text-[#F1F5F9] backdrop-blur-md'
        }`}>
          
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className={`md:hidden p-2 rounded-lg ${isLight ? 'text-[#475569] hover:bg-[#F1F5F9]' : 'text-[#94A3B8] hover:bg-[#1E293B]'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className={`font-serif-title text-lg md:text-xl font-bold tracking-wide truncate ${
                isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'
              }`}>
                {activeTab === 'catalogo' && 'Catálogo Editorial & Acervo Literario'}
                {activeTab === 'prestamos' && 'Control de Préstamos y Alquileres'}
                {activeTab === 'ventas' && 'Facturación Fiscal SAR & Registro de Ventas'}
                {activeTab === 'clientes' && 'Directorio de Lectores y Membresías'}
                {activeTab === 'reportes' && 'Centro Oficial de Reportes y Auditoría'}
              </h2>
              <p className={`text-xs hidden sm:block truncate ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>
                {activeTab === 'catalogo' && 'Colección sincronizada con Open Library · Búsqueda reactiva y filtrado editorial'}
                {activeTab === 'prestamos' && 'Seguimiento de circulación, plazos de entrega y devoluciones de inventario'}
                {activeTab === 'ventas' && 'Emisión de comprobantes SAR en Lempiras (Lps.) con desglose de ISV 15%'}
                {activeTab === 'clientes' && 'Gestión de perfiles académicos, roles de usuario y descuentos preferenciales'}
                {activeTab === 'reportes' && 'Exportación ejecutiva en formatos PDF, Excel (.xlsx) y Word (.docx)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Stats Pills en Desktop */}
            <div className="hidden xl:flex items-center gap-2.5">
              <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border ${
                isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#1E293B] border-[#334155]'
              }`}>
                <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className={`text-[11px] ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>Acervo:</span>
                <span className={`text-xs font-bold font-mono-code ${isLight ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}`}>{libros.length}</span>
              </div>

              <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border ${
                isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#1E293B] border-[#334155]'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className={`text-[11px] ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>Ingresos:</span>
                <span className={`text-xs font-semibold font-mono-code ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  Lps. {(stats.total_ingresos_ventas || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Conmutador Dark / Light Mode con Etiqueta Clara */}
            <button
              onClick={toggleTheme}
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                isLight
                  ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#D4AF37] text-[#0F172A] shadow-2xs'
                  : 'bg-[#1E293B] border-[#334155] hover:border-[#D4AF37]/60 text-[#D4AF37]'
              }`}
              title={isLight ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
            >
              {isLight ? (
                <>
                  <Moon className="w-4 h-4 text-[#0F172A]" />
                  <span className="hidden md:inline">Modo Oscuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-[#D4AF37]" />
                  <span className="hidden md:inline text-[#F1F5F9]">Modo Claro</span>
                </>
              )}
            </button>

            {/* Carrito de Reservas / Compras */}
            <button
              onClick={() => setCartModalOpen(true)}
              className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#D4AF37] text-[#9A7415]'
                  : 'bg-[#1E293B] border-[#334155] hover:border-[#D4AF37]/50 text-[#D4AF37]'
              }`}
              title="Ver Carrito de Reservas"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#D4AF37] text-[#0B0F17] text-[10px] font-bold flex items-center justify-center font-mono-code shadow">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* Acceso a Perfil / Historial */}
            <button
              onClick={() => setUserProfileModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-colors cursor-pointer ${
                isLight
                  ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#D4AF37] text-[#0F172A]'
                  : 'bg-[#1E293B] border-[#334155] hover:border-[#D4AF37]/50 text-[#F1F5F9]'
              }`}
              title="Ver Perfil y Alertas de Vencimiento"
            >
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs font-semibold hidden sm:inline">
                {activeRole}
              </span>
            </button>

          </div>

        </header>

        {/* Dynamic View Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto pb-12">
            
            {activeTab === 'catalogo' && (
              <BooksView
                libros={libros}
                generos={generos}
                activeRole={activeRole}
                theme={theme}
                onOpenBookModal={handleOpenNewBook}
                onOpenEditModal={handleOpenEditBook}
                onDeleteBook={handleDeleteBook}
                onSelectBookDetail={b => { setSelectedBookForDetail(b); setDetailModalOpen(true); }}
                onQuickLoan={b => { setSelectedBookForLoan(b); setPrestamoModalOpen(true); }}
                onQuickSale={b => { setSelectedBookForSale(b); setVentaModalOpen(true); }}
                onAddToCart={handleAddToCart}
                onOpenReviews={b => { setSelectedBookForReviews(b); setReviewsModalOpen(true); }}
              />
            )}

            {activeTab === 'prestamos' && (
              <PrestamosView
                prestamos={prestamos}
                clientes={clientes}
                libros={libros}
                onDevolver={handleDevolverPrestamo}
                onNewPrestamo={() => { setSelectedBookForLoan(null); setPrestamoModalOpen(true); }}
              />
            )}

            {activeTab === 'ventas' && (
              <VentasView
                ventas={ventas}
                clientes={clientes}
                libros={libros}
                onOpenFactura={handleOpenFactura}
                onNewVenta={() => { setSelectedBookForSale(null); setVentaModalOpen(true); }}
              />
            )}

            {activeTab === 'clientes' && (
              <ClientesView
                clientes={clientes}
                activeRole={activeRole}
                onOpenClienteModal={() => { setEditingCliente(null); setClienteModalOpen(true); }}
                onOpenEditCliente={c => { setEditingCliente(c); setClienteModalOpen(true); }}
                onDeleteCliente={handleDeleteCliente}
              />
            )}

            {activeTab === 'reportes' && (
              <ReportsView stats={stats} librosCount={libros.length} ventasCount={ventas.length} prestamosCount={prestamos.length} />
            )}

          </div>
        </main>

      </div>

      {/* Security Modals */}
      <TwoFactorModal
        isOpen={twoFactorOpen}
        onClose={() => setTwoFactorOpen(false)}
        onSuccess={() => {
          if (twoFactorAction) twoFactorAction();
          setTwoFactorAction(null);
        }}
        title={twoFactorTitle}
        actionDesc={twoFactorDesc}
      />

      <FacturaModal
        isOpen={facturaOpen}
        onClose={() => setFacturaOpen(false)}
        factura={currentFactura}
      />

      {/* CRUD Modals */}
      <BookModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onSave={handleSaveBook}
        editingBook={editingBook}
      />

      <ClienteModal
        isOpen={clienteModalOpen}
        onClose={() => setClienteModalOpen(false)}
        onSave={handleSaveCliente}
        editingCliente={editingCliente}
      />

      <VentaModal
        isOpen={ventaModalOpen}
        onClose={() => setVentaModalOpen(false)}
        onSave={handleSaveVenta}
        clientes={clientes}
        libros={libros}
        preselectedBook={selectedBookForSale}
      />

      <PrestamoModal
        isOpen={prestamoModalOpen}
        onClose={() => setPrestamoModalOpen(false)}
        onSave={handleSavePrestamo}
        clientes={clientes}
        libros={libros}
        preselectedBook={selectedBookForLoan}
      />

      <BookDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        book={selectedBookForDetail}
        onLoan={b => { setSelectedBookForLoan(b); setPrestamoModalOpen(true); }}
        onSale={b => { setSelectedBookForSale(b); setVentaModalOpen(true); }}
        onOpenReviews={b => { setSelectedBookForReviews(b); setReviewsModalOpen(true); }}
        onAddToCart={handleAddToCart}
      />

      {/* Nuevos Modales Implementados */}
      <CartModal
        isOpen={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        clientes={clientes}
        onConfirmBatchLoan={handleBatchLoan}
        onConfirmBatchSale={handleBatchSale}
      />

      <BookReviewsModal
        isOpen={reviewsModalOpen}
        onClose={() => setReviewsModalOpen(false)}
        book={selectedBookForReviews}
        activeUser={activeRole}
      />

      <UserProfileModal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        activeRole={activeRole}
        clientes={clientes}
        prestamos={prestamos}
        ventas={ventas}
        onOpenFactura={handleOpenFactura}
      />

    </div>
  );
}
