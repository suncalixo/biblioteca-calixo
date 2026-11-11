"""
Sistema de Biblioteca - Biblioteca Calixo
Script de Inicio y Ejecución Principal
"""

import sys
import os
import webbrowser
import threading
import time

# Configurar encoding utf-8 para Windows console
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Asegurar ruta local en sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, biblioteca

def abrir_navegador():
    time.sleep(1.2)
    webbrowser.open("http://127.0.0.1:5000")

if __name__ == "__main__":
    banner = """
    =========================================================================
                           BIBLIOTECA CALIXO v2.0
            Inspirada en el Saber de la Gran Biblioteca de Alejandria
              Sistema de Ventas, Prestamos y Catalogo por Generos
    =========================================================================
    
    [OK] Base de Datos Inicializada con Exito
    [OK] Libros Cargados: {total_libros} titulos ({ejemplares} ejemplares en stock)
    [OK] Clientes Registrados: {total_clientes} usuarios
    [OK] Ventas Registradas: {total_ventas} transacciones (Total: Lps. {ingresos:,.2f})
    [OK] Prestamos Activos: {prestamos_activos} en curso
    
    [URL] Servidor Web Activo: http://127.0.0.1:5000
    [INFO] Presione Ctrl+C en esta consola para detener el servidor.
    =========================================================================
    """.format(
        total_libros=len(biblioteca.libros),
        ejemplares=sum(l.stock for l in biblioteca.libros.values()),
        total_clientes=len(biblioteca.clientes),
        total_ventas=len(biblioteca.ventas),
        ingresos=sum(v.total for v in biblioteca.ventas),
        prestamos_activos=sum(1 for p in biblioteca.prestamos if p.devuelto == "No")
    )
    print(banner)

    # Abrir el navegador automáticamente en segundo plano
    threading.Thread(target=abrir_navegador, daemon=True).start()

    # Iniciar servidor Flask
    app.run(host="127.0.0.1", port=5000, debug=False)
