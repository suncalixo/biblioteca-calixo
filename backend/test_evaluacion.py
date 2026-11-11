"""
Sistema de Biblioteca - Biblioteca Calixo
Suite Automatizada de Pruebas de Calidad y Evaluación (100 Puntos)
Verifica cada criterio de la hoja de evaluación del usuario.
"""

import os
import sys
import json
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import Libro, Cliente, Venta, Prestamo, ValidationError
from manager import BibliotecaCalixo
import reports

class TestEvaluacionBibliotecaCalixo(unittest.TestCase):
    
    def setUp(self):
        # Crear instancia de prueba con archivo JSON temporal
        self.test_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_data.json")
        if os.path.exists(self.test_json):
            os.remove(self.test_json)
        self.biblioteca = BibliotecaCalixo(data_file=self.test_json)

    def tearDown(self):
        if os.path.exists(self.test_json):
            try:
                os.remove(self.test_json)
            except Exception:
                pass

    # ==========================================================
    # SECCIÓN 1: OBJETOS Y CLASES OOP REQUERIDAS
    # ==========================================================
    def test_01_objetos_requeridos_libro(self):
        """Verifica que existan los libros requeridos con sus valores exactos."""
        # Libro 1: 111-1, Juego de Tronos, George R.R Martin, 470, 58, 4
        self.assertIn("111-1", self.biblioteca.libros)
        l1 = self.biblioteca.libros["111-1"]
        self.assertEqual(l1.titulo, "Juego de Tronos")
        self.assertEqual(l1.autor, "George R.R Martin")
        self.assertEqual(l1.precio_venta, 470.0)
        self.assertEqual(l1.precio_prestamo, 58.0)
        self.assertEqual(l1.stock, 4)

        # Libro 2: 222-2, Dune, Frank Herbert, 370, 45, 2
        self.assertIn("222-2", self.biblioteca.libros)
        l2 = self.biblioteca.libros["222-2"]
        self.assertEqual(l2.titulo, "Dune")
        self.assertEqual(l2.autor, "Frank Herbert")
        self.assertEqual(l2.precio_venta, 370.0)
        self.assertEqual(l2.precio_prestamo, 45.0)
        self.assertEqual(l2.stock, 2)

    def test_02_metodos_clase_libro(self):
        """Verifica los métodos requeridos: disponibilidad, vender, prestar, devolver, mostrar."""
        libro = Libro("999-TEST", "Libro Test", "Autor Test", 100.0, 15.0, 3, "General")
        self.assertTrue(libro.disponibilidad())
        
        # Probar vender
        total_venta = libro.vender(2)
        self.assertEqual(total_venta, 200.0)
        self.assertEqual(libro.stock, 1)

        # Probar prestar
        costo_prestamo = libro.prestar(1)
        self.assertEqual(costo_prestamo, 15.0)
        self.assertEqual(libro.stock, 0)
        self.assertFalse(libro.disponibilidad())

        # Probar devolver
        libro.devolver(1)
        self.assertEqual(libro.stock, 1)
        self.assertTrue(libro.disponibilidad())

        # Probar mostrar
        info = libro.mostrar()
        self.assertEqual(info["titulo"], "Libro Test")

    def test_03_objetos_requeridos_cliente(self):
        """Verifica que existan los clientes requeridos con sus valores exactos."""
        # cliente1: 0301-2004-08765, Andrea Medina, andrea@gmail.com, 9999-8888
        self.assertIn("0301-2004-08765", self.biblioteca.clientes)
        c1 = self.biblioteca.clientes["0301-2004-08765"]
        self.assertEqual(c1.nombre, "Andrea Medina")
        self.assertEqual(c1.correo, "andrea@gmail.com")
        self.assertEqual(c1.telefono, "9999-8888")

        # cliente2: 0301-2003-04839, Sophia Cerati, sophie@gmail.com, 7777-6666
        self.assertIn("0301-2003-04839", self.biblioteca.clientes)
        c2 = self.biblioteca.clientes["0301-2003-04839"]
        self.assertEqual(c2.nombre, "Sophia Cerati")
        self.assertEqual(c2.correo, "sophie@gmail.com")
        self.assertEqual(c2.telefono, "7777-6666")

    def test_04_metodos_clase_cliente(self):
        """Verifica los métodos requeridos: comprar, pedir_prestado, devolver, ver_catalogo."""
        c = self.biblioteca.clientes["0301-2004-08765"]
        libro = Libro("T1", "Obra", "Escritor", 100.0, 20.0, 5)
        
        # Método comprar
        venta = c.comprar(libro, 1)
        self.assertEqual(venta.total, 100.0)
        self.assertEqual(libro.stock, 4)

        # Método pedir prestado
        prestamo = c.pedir_prestado(libro, 7)
        self.assertEqual(prestamo.devuelto, "No")
        self.assertEqual(libro.stock, 3)

        # Método devolver
        c.devolver(prestamo, libro)
        self.assertEqual(prestamo.devuelto, "Sí")
        self.assertEqual(libro.stock, 4)

        # Método ver catálogo
        cat = c.ver_catalogo([libro])
        self.assertEqual(len(cat), 1)

    def test_05_objetos_requeridos_ventas_y_prestamos(self):
        """Verifica los registros iniciales de ventas y préstamos."""
        # venta1, 1, 22/09/26, Andrea Medina, Dune, 3, 1110
        # venta2, 2, 22/09/26, Sophia Cerati, Juego de Tronos, 2, 940
        self.assertEqual(len(self.biblioteca.ventas), 2)
        v1 = self.biblioteca.ventas[0]
        self.assertEqual(v1.id_venta, 1)
        self.assertEqual(v1.cliente, "Andrea Medina")
        self.assertEqual(v1.libro, "Dune")
        self.assertEqual(v1.cantidad, 3)
        self.assertEqual(v1.total, 1110.0)

        # prestamo1, 1, 22/09/26, 29/09/26, Andrea Medina, Dune, No
        # prestamo2, 2, 22/09/26, 29/09/26, Sophia Cerati, Juego de Tronos, No
        self.assertEqual(len(self.biblioteca.prestamos), 2)
        p1 = self.biblioteca.prestamos[0]
        self.assertEqual(p1.id_prestamo, 1)
        self.assertEqual(p1.cliente, "Andrea Medina")
        self.assertEqual(p1.libro, "Dune")
        self.assertEqual(p1.devuelto, "No")


    # ==========================================================
    # SECCIÓN 2: III. VALIDACIONES DEL SISTEMA (RÚBRICA DE 20 PTS)
    # ==========================================================
    def test_06_validacion_nombre_vacio(self):
        """Prueba: Nombre vacío -> Mostrar mensaje de error y no permitir guardar."""
        with self.assertRaises(ValidationError) as ctx:
            self.biblioteca.registrar_cliente({
                "id": "0801-1999-00001",
                "nombre": "",
                "correo": "correo@gmail.com",
                "telefono": "9999-0000"
            })
        self.assertIn("nombre", str(ctx.exception).lower())

    def test_07_validacion_campo_obligatorio_vacio(self):
        """Prueba: Campo obligatorio vacío -> No permitir guardar."""
        # ISBN vacío
        with self.assertRaises(ValidationError):
            self.biblioteca.registrar_libro({
                "isbn": "",
                "titulo": "Título Válido",
                "autor": "Autor Válido",
                "precio_venta": 200,
                "precio_prestamo": 20,
                "stock": 5
            })

    def test_08_validacion_numero_fuera_de_rango(self):
        """Prueba: Número fuera del rango permitido -> Mostrar mensaje de error."""
        # Precio de venta <= 0
        with self.assertRaises(ValidationError) as ctx1:
            self.biblioteca.registrar_libro({
                "isbn": "NEG-001",
                "titulo": "Libro Negativo",
                "autor": "Autor",
                "precio_venta": -100,
                "precio_prestamo": 20,
                "stock": 5
            })
        self.assertIn("positivo", str(ctx1.exception).lower())

        # Stock negativo
        with self.assertRaises(ValidationError) as ctx2:
            self.biblioteca.registrar_libro({
                "isbn": "NEG-002",
                "titulo": "Libro Stock Negativo",
                "autor": "Autor",
                "precio_venta": 100,
                "precio_prestamo": 20,
                "stock": -3
            })
        self.assertIn("negativo", str(ctx2.exception).lower())

    def test_09_validacion_correo_invalido(self):
        """Prueba: Correo electrónico inválido -> Mostrar mensaje de error."""
        with self.assertRaises(ValidationError) as ctx:
            self.biblioteca.registrar_cliente({
                "id": "0801-1999-00002",
                "nombre": "Juan Pérez",
                "correo": "correo_sin_arroba_ni_dominio",
                "telefono": "9999-0000"
            })
        self.assertIn("formato válido", str(ctx.exception).lower())

    def test_10_validacion_registro_duplicado(self):
        """Prueba: Registro duplicado -> No permitir guardar."""
        # Duplicar ISBN existente ("111-1")
        with self.assertRaises(ValidationError) as ctx1:
            self.biblioteca.registrar_libro({
                "isbn": "111-1",
                "titulo": "Intento de Duplicado",
                "autor": "Autor",
                "precio_venta": 300,
                "precio_prestamo": 30,
                "stock": 2
            })
        self.assertIn("ya existe", str(ctx1.exception).lower())

        # Duplicar DNI existente ("0301-2004-08765")
        with self.assertRaises(ValidationError) as ctx2:
            self.biblioteca.registrar_cliente({
                "id": "0301-2004-08765",
                "nombre": "Andrea Clon",
                "correo": "clon@gmail.com",
                "telefono": "9999-0000"
            })
        self.assertIn("ya existe", str(ctx2.exception).lower())

    def test_11_validacion_datos_validos(self):
        """Prueba: Datos válidos -> Guardar correctamente."""
        libro = self.biblioteca.registrar_libro({
            "isbn": "VALIDO-100",
            "titulo": "El Arte de la Guerra",
            "autor": "Sun Tzu",
            "precio_venta": 250.0,
            "precio_prestamo": 30.0,
            "stock": 10,
            "genero": "Filosofía y Estrategia"
        })
        self.assertIsNotNone(libro)
        self.assertIn("VALIDO-100", self.biblioteca.libros)


    # ==========================================================
    # SECCIÓN 3: IV. FUNCIONALIDAD (RÚBRICA DE 20 PTS)
    # ==========================================================
    def test_12_funcionalidad_buscar(self):
        """Función: Buscar registros (por título, autor, ISBN y género)."""
        # Búsqueda por título
        res_dune = self.biblioteca.buscar_libros(query="Dune")
        self.assertTrue(any(l["isbn"] == "222-2" for l in res_dune))

        # Búsqueda por autor
        res_martin = self.biblioteca.buscar_libros(query="Martin")
        self.assertTrue(any(l["isbn"] == "111-1" for l in res_martin))

        # Filtrar por género literario
        res_fantasia = self.biblioteca.buscar_libros(genero="Fantasía Épica")
        self.assertTrue(len(res_fantasia) >= 1)

    def test_13_funcionalidad_editar(self):
        """Función: Editar registros."""
        self.biblioteca.editar_libro("111-1", {
            "titulo": "Juego de Tronos (Edición Ilustrada)",
            "autor": "George R.R Martin",
            "genero": "Fantasía Épica",
            "precio_venta": 520.0,
            "precio_prestamo": 65.0,
            "stock": 6
        })
        self.assertEqual(self.biblioteca.libros["111-1"].titulo, "Juego de Tronos (Edición Ilustrada)")
        self.assertEqual(self.biblioteca.libros["111-1"].stock, 6)

    def test_14_funcionalidad_eliminar(self):
        """Función: Eliminar registros."""
        # Crear libro temporal para eliminar
        self.biblioteca.registrar_libro({
            "isbn": "DEL-999",
            "titulo": "Libro para Borrar",
            "autor": "Autor",
            "precio_venta": 100,
            "precio_prestamo": 15,
            "stock": 2
        })
        self.assertIn("DEL-999", self.biblioteca.libros)
        
        # Eliminar
        eliminado = self.biblioteca.eliminar_libro("DEL-999")
        self.assertTrue(eliminado)
        self.assertNotIn("DEL-999", self.biblioteca.libros)

    def test_15_funcionalidad_guardar_json(self):
        """Función: Guardar datos en JSON y recargar."""
        self.biblioteca.guardar_datos()
        self.assertTrue(os.path.exists(self.test_json))
        
        # Leer archivo JSON directamente
        with open(self.test_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertIn("libros", data)
        self.assertIn("clientes", data)
        self.assertIn("ventas", data)
        self.assertIn("prestamos", data)

    def test_16_funcionalidad_exportar_word(self):
        """Función: Exportar a Word (.docx) formateado."""
        data = self.biblioteca.to_full_dict()
        buffer = reports.generar_reporte_word(data)
        self.assertGreater(buffer.getbuffer().nbytes, 1000)

    def test_17_funcionalidad_exportar_excel(self):
        """Función: Exportar a Excel (.xlsx) con pestañas y estilos."""
        data = self.biblioteca.to_full_dict()
        buffer = reports.generar_reporte_excel(data)
        self.assertGreater(buffer.getbuffer().nbytes, 1000)

    def test_18_funcionalidad_exportar_pdf(self):
        """Función: Exportar a PDF (.pdf) formal."""
        data = self.biblioteca.to_full_dict()
        buffer = reports.generar_reporte_pdf(data)
        self.assertGreater(buffer.getbuffer().nbytes, 1000)

    def test_19_control_prestamos_y_devolucion_stock(self):
        """Detección de bugs: Verificar que devolver un libro restaure el stock físico."""
        stock_inicial = self.biblioteca.libros["222-2"].stock
        
        # Realizar préstamo
        prestamo = self.biblioteca.realizar_prestamo("0301-2004-08765", "222-2", dias=7)
        self.assertEqual(self.biblioteca.libros["222-2"].stock, stock_inicial - 1)
        self.assertEqual(prestamo.devuelto, "No")

        # Devolver préstamo
        self.biblioteca.devolver_prestamo(prestamo.id_prestamo)
        self.assertEqual(prestamo.devuelto, "Sí")
        self.assertEqual(self.biblioteca.libros["222-2"].stock, stock_inicial)


if __name__ == "__main__":
    print("======================================================================")
    print("EJECUTANDO SUITE DE PRUEBAS AUTOMATIZADAS - BIBLIOTECA CALIXO (100 PTS)")
    print("======================================================================")
    suite = unittest.TestLoader().loadTestsFromTestCase(TestEvaluacionBibliotecaCalixo)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n[RESULTADO OFICIAL]: TODAS LAS PRUEBAS PASARON AL 100% (100 / 100 PUNTOS)")
    else:
        sys.exit(1)
