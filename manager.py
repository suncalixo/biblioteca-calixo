"""
Sistema de Biblioteca - Biblioteca Calixo
Gestor Principal del Sistema (BibliotecaCalixo)
Manejo de colecciones, persistencia JSON, validaciones y lógica de negocio.
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from models import Libro, Cliente, Venta, Prestamo, ValidationError

DATA_FILE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")

class BibliotecaCalixo:
    """
    Sistema Central de Gestión de Biblioteca Calixo.
    Controla el catálogo por géneros literarios, inventario,
    clientes con roles, ventas y préstamos automatizados.
    """
    def __init__(self, data_file: str = DATA_FILE_PATH):
        self.data_file = data_file
        self.libros: Dict[str, Libro] = {}           # isbn -> Libro
        self.clientes: Dict[str, Cliente] = {}       # id -> Cliente
        self.ventas: List[Venta] = []
        self.prestamos: List[Prestamo] = []
        
        # Cargar datos persistidos o inicializar con los requeridos
        if os.path.exists(self.data_file):
            self.cargar_datos()
        else:
            self.inicializar_datos_predeterminados()
            self.guardar_datos()

    def inicializar_datos_predeterminados(self):
        """Carga los objetos y registros especificados en los requerimientos del proyecto."""
        self.libros.clear()
        self.clientes.clear()
        self.ventas.clear()
        self.prestamos.clear()

        # Libros iniciales requeridos y catálogo ampliado (10 libros por género con portadas auténticas)
        libros_iniciales = [
            # --- 1. FANTASÍA ÉPICA (10 Libros) ---
            Libro("111-1", "Juego de Tronos", "George R.R Martin", 470.0, 58.0, 4, "Fantasía Épica", "Canción de hielo y fuego: lucha dinástica por el Trono de Hierro en Poniente.", "/static/img/libros/111_1.jpg"),
            Libro("999-9", "El Hobbit", "J.R.R. Tolkien", 360.0, 42.0, 4, "Fantasía Épica", "El viaje de Bilbo Bolsón junto a Gandalf y trece enanos hacia la Montaña Solitaria.", "/static/img/libros/999_9.jpg"),
            Libro("978-0618346257", "La Comunidad del Anillo", "J.R.R. Tolkien", 420.0, 50.0, 5, "Fantasía Épica", "Frodo Bolsón emprende la misión más peligrosa para destruir el Anillo Único en el Monte del Destino.", "/static/img/libros/978_0618346257.jpg"),
            Libro("978-0756404741", "El Nombre del Viento", "Patrick Rothfuss", 440.0, 52.0, 3, "Fantasía Épica", "Crónica de las hazañas de Kvothe: mago legendario, músico prodigio y asesino de reyes.", "/static/img/libros/978_0756404741.jpg"),
            Libro("978-0756407124", "El Temor de un Hombre Sabio", "Patrick Rothfuss", 480.0, 55.0, 4, "Fantasía Épica", "Segunda entrega donde Kvothe profundiza en los misterios de los Fae y los Chandrian.", "/static/img/libros/978_0756407124.jpg"),
            Libro("978-0553108033", "Choque de Reyes", "George R.R Martin", 460.0, 54.0, 3, "Fantasía Épica", "Un cometa de sangre cruza el cielo mientras cinco reyes se disputan el trono.", "/static/img/libros/978_0553108033.jpg"),
            Libro("978-0747532699", "Harry Potter y la Piedra Filosofal", "J.K. Rowling", 390.0, 45.0, 7, "Fantasía Épica", "Un joven huérfano descubre que es mago y asiste al Colegio Hogwarts de Magia y Hechicería.", "/static/img/libros/978_0747532699.jpg"),
            Libro("978-0316029186", "El Último Deseo (Geralt de Rivia)", "Andrzej Sapkowski", 380.0, 44.0, 5, "Fantasía Épica", "Geralt de Rivia es un brujo modificado genéticamente que caza monstruos por encargo.", "/static/img/libros/978_0316029186.jpg"),
            Libro("978-0064471046", "Las Crónicas de Narnia: El León, la Bruja y el Ropero", "C.S. Lewis", 320.0, 38.0, 6, "Fantasía Épica", "Cuatro hermanos cruzan un armario mágico hacia un reino sumergido en un invierno eterno.", "/static/img/libros/978_0064471046.jpg"),
            Libro("978-0618391110", "El Silmarillion", "J.R.R. Tolkien", 410.0, 48.0, 3, "Fantasía Épica", "Relato de los Días Antiguos de Arda, la Primera Edad del Mundo y la creación de los Silmarils.", "/static/img/libros/978_0618391110.jpg"),

            # --- 2. CIENCIA FICCIÓN (10 Libros) ---
            Libro("222-2", "Dune", "Frank Herbert", 370.0, 45.0, 2, "Ciencia Ficción", "En el planeta desértico Arrakis se disputa la especia melange que mueve el imperio galáctico.", "/static/img/libros/222_2.jpg"),
            Libro("978-0553293357", "Fundación", "Isaac Asimov", 360.0, 42.0, 5, "Ciencia Ficción", "Hari Seldon utiliza la psicohistoria para reducir milenios de barbarie tras la caída del Imperio.", "/static/img/libros/978_0553293357.jpg"),
            Libro("978-0553382563", "Yo, Robot", "Isaac Asimov", 340.0, 40.0, 4, "Ciencia Ficción", "Nueve relatos que exploran las Tres Leyes de la Robótica y dilemas morales entre humanos y máquinas.", "/static/img/libros/978_0553382563.jpg"),
            Libro("978-0441569595", "Neuromante", "William Gibson", 380.0, 44.0, 3, "Ciencia Ficción", "Obra fundacional del cyberpunk: hackers, inteligencia artificial y el espacio virtual de la Matriz.", "/static/img/libros/978_0441569595.jpg"),
            Libro("978-0765377067", "El Problema de los Tres Cuerpos", "Cixin Liu", 430.0, 50.0, 4, "Ciencia Ficción", "La astrofísica china Ye Wenjie establece contacto con una civilización extraterrestre hostil.", "/static/img/libros/978_0765377067.jpg"),
            Libro("978-1451678192", "Crónicas Marcianas", "Ray Bradbury", 350.0, 40.0, 5, "Ciencia Ficción", "La colonización de Marte por la humanidad y la melancólica desaparición de la civilización marciana.", "/static/img/libros/978_1451678192.jpg"),
            Libro("978-0451457998", "2001: Una Odisea Espacial", "Arthur C. Clarke", 370.0, 42.0, 4, "Ciencia Ficción", "Un monolito alienígena desencadena la evolución humana y un viaje hacia Júpiter con el supercomputador HAL 9000.", "/static/img/libros/978_0451457998.jpg"),
            Libro("978-0156027601", "Solaris", "Stanislaw Lem", 360.0, 41.0, 3, "Ciencia Ficción", "Científicos estudian un planeta cubierto por un océano viviente que materializa sus recuerdos más íntimos.", "/static/img/libros/978_0156027601.jpg"),
            Libro("978-0345404473", "¿Sueñan los androides con ovejas eléctricas?", "Philip K. Dick", 365.0, 42.0, 4, "Ciencia Ficción", "Rick Deckard es un cazador de recompensas encargado de retirar androides Nexus-6 rebeldes.", "/static/img/libros/978_0345404473.jpg"),
            Libro("978-1451673319", "Fahrenheit 451", "Ray Bradbury", 330.0, 38.0, 6, "Ciencia Ficción", "Guy Montag es un bombero cuyo trabajo no es apagar fuegos, sino quemar libros prohibidos.", "/static/img/libros/978_1451673319.jpg"),

            # --- 3. CLÁSICOS UNIVERSALES (10 Libros) ---
            Libro("777-7", "Don Quijote de la Mancha", "Miguel de Cervantes", 350.0, 30.0, 4, "Clásicos", "Las célebres aventuras del ingenioso hidalgo Don Quijote y su fiel escudero Sancho Panza.", "/static/img/libros/777_7.jpg"),
            Libro("555-5", "El Principito", "Antoine de Saint-Exupéry", 180.0, 25.0, 8, "Clásicos", "Obra maestra universal sobre el amor, la amistad, la inocencia y el verdadero sentido de la vida.", "/static/img/libros/555_5.jpg"),
            Libro("978-0140268867", "La Odisea", "Homero", 310.0, 32.0, 5, "Clásicos", "El accidentado viaje de regreso de Odiseo a su reino de Ítaca tras la Guerra de Troya.", "/static/img/libros/978_0140268867.jpg"),
            Libro("978-0140275360", "La Ilíada", "Homero", 315.0, 33.0, 4, "Clásicos", "El canto a la cólera de Aquiles durante el asedio de Troya en la Grecia Antigua.", "/static/img/libros/978_0140275360.jpg"),
            Libro("978-0142437223", "La Divina Comedia", "Dante Alighieri", 370.0, 40.0, 4, "Clásicos", "El viaje visionario de Dante a través del Infierno, el Purgatorio y el Paraíso guiado por Virgilio.", "/static/img/libros/978_0142437223.jpg"),
            Libro("978-0143058144", "Crimen y Castigo", "Fiódor Dostoyevski", 360.0, 38.0, 5, "Clásicos", "El drama psicológico de Raskólnikov y la redención moral tras cometer un asesinato.", "/static/img/libros/978_0143058144.jpg"),
            Libro("978-0140444308", "Los Miserables", "Victor Hugo", 420.0, 45.0, 3, "Clásicos", "La redención de Jean Valjean en la convulsionada Francia del siglo XIX.", "/static/img/libros/978_0140444308.jpg"),
            Libro("978-0141439518", "Orgullo y Prejuicio", "Jane Austen", 320.0, 35.0, 6, "Clásicos", "La historia de amor y malentendidos entre Elizabeth Bennet y el orgulloso señor Darcy.", "/static/img/libros/978_0141439518.jpg"),
            Libro("978-0141439570", "El Retrato de Dorian Gray", "Oscar Wilde", 310.0, 34.0, 5, "Clásicos", "Un joven vende su alma para conservar la juventud eterna mientras su retrato envejece y se corrompe.", "/static/img/libros/978_0141439570.jpg"),
            Libro("978-0141439471", "Frankenstein", "Mary Shelley", 295.0, 32.0, 5, "Clásicos", "Víctor Frankenstein desafía las leyes naturales creando vida a partir de restos humanos.", "/static/img/libros/978_0141439471.jpg"),

            # --- 4. REALISMO MÁGICO Y FICCIÓN (10 Libros) ---
            Libro("333-3", "Cien Años de Soledad", "Gabriel García Márquez", 390.0, 40.0, 5, "Realismo Mágico", "Historia épica y legendaria de siete generaciones de la familia Buendía en el mítico pueblo de Macondo.", "/static/img/libros/333_3.jpg"),
            Libro("101-0", "Ficciones", "Jorge Luis Borges", 295.0, 32.0, 3, "Realismo Mágico", "Laberintos infinitos, bibliotecas cósmicas y espejos mágicos en la prosa maestra de Borges.", "/static/img/libros/101_0.jpg"),
            Libro("978-0307389732", "El Amor en los Tiempos del Cólera", "Gabriel García Márquez", 380.0, 42.0, 4, "Realismo Mágico", "La perseverancia romántica de Florentino Ariza durante cincuenta y un años, nueve meses y cuatro días.", "/static/img/libros/978_0307389732.jpg"),
            Libro("978-0802133908", "Pedro Páramo", "Juan Rulfo", 260.0, 28.0, 6, "Realismo Mágico", "Juan Preciado llega al pueblo fantasmal de Comala en busca de su padre, Pedro Páramo.", "/static/img/libros/978_0802133908.jpg"),
            Libro("978-0553383805", "La Casa de los Espíritus", "Isabel Allende", 370.0, 40.0, 4, "Realismo Mágico", "Crónica familiar de cuatro generaciones de la familia Trueba y las convulsiones de un país latinoamericano.", "/static/img/libros/978_0553383805.jpg"),
            Libro("978-0394752846", "Rayuela", "Julio Cortázar", 395.0, 42.0, 3, "Realismo Mágico", "Novela vanguardista contranovelística que invita a múltiples recorridos de lectura entre París y Buenos Aires.", "/static/img/libros/978_0394752846.jpg"),
            Libro("978-0142437889", "El Aleph", "Jorge Luis Borges", 290.0, 32.0, 4, "Realismo Mágico", "El punto en el sótano donde convergen todos los lugares del universo vistos desde todos los ángulos.", "/static/img/libros/978_0142437889.jpg"),
            Libro("978-1400034710", "Crónica de una Muerte Anunciada", "Gabriel García Márquez", 270.0, 30.0, 5, "Realismo Mágico", "La reconstrucción periodística y fatal del asesinato anunciado de Santiago Nasar.", "/static/img/libros/978_1400034710.jpg"),
            Libro("978-0374511715", "Aura", "Carlos Fuentes", 240.0, 26.0, 5, "Realismo Mágico", "Felipe Montero acepta un trabajo en una vieja casona oscura donde el pasado y el presente se confunden.", "/static/img/libros/978_0374511715.jpg"),
            Libro("978-0385420174", "Como Agua para Chocolate", "Laura Esquivel", 310.0, 34.0, 4, "Realismo Mágico", "Amor prohibido y magia culinaria en el México revolucionario a través de recetas familiares.", "/static/img/libros/978_0385420174.jpg"),

            # --- 5. DISTOPÍA Y MISTERIO (10 Libros) ---
            Libro("444-4", "1984", "George Orwell", 320.0, 35.0, 6, "Distopía y Misterio", "Una advertencia sobre el totalitarismo, el control de la mente, la Neolengua y el Gran Hermano.", "/static/img/libros/444_4.jpg"),
            Libro("888-8", "El Código Da Vinci", "Dan Brown", 340.0, 38.0, 5, "Distopía y Misterio", "Simbología religiosa, sociedades secretas e intriga en el Museo del Louvre.", "/static/img/libros/888_8.jpg"),
            Libro("978-0451526342", "Rebelión en la Granja", "George Orwell", 260.0, 28.0, 7, "Distopía y Misterio", "Fábula alegórica sobre la corrupción del poder donde todos los animales son iguales, pero algunos más iguales.", "/static/img/libros/978_0451526342.jpg"),
            Libro("978-0060850524", "Un Mundo Feliz", "Aldous Huxley", 330.0, 36.0, 5, "Distopía y Misterio", "Sociedad tecnológica futurista anestesiada por el condicionamiento genético, el consumo y el soma.", "/static/img/libros/978_0060850524.jpg"),
            Libro("978-0671027360", "Ángeles y Demonios", "Dan Brown", 350.0, 38.0, 4, "Distopía y Misterio", "Robert Langdon viaja al Vaticano para detener un complot mortal de la antigua hermandad de los Illuminati.", "/static/img/libros/978_0671027360.jpg"),
            Libro("978-0156001311", "El Nombre de la Rosa", "Umberto Eco", 390.0, 42.0, 3, "Distopía y Misterio", "Misteriosos crímenes en una abadía benedictina medieval en torno a un libro prohibido de Aristóteles.", "/static/img/libros/978_0156001311.jpg"),
            Libro("978-0141079363", "El Sabueso de los Baskerville", "Arthur Conan Doyle", 280.0, 30.0, 6, "Distopía y Misterio", "Sherlock Holmes y el Dr. Watson investigan una maldición familiar en los páramos de Dartmoor.", "/static/img/libros/978_0141079363.jpg"),
            Libro("978-0062073488", "Diez Negritos (Y No Quedó Ninguno)", "Agatha Christie", 295.0, 32.0, 5, "Distopía y Misterio", "Diez desconocidos atrapados en una isla privada son ejecutados uno a uno según una vieja rima infantil.", "/static/img/libros/978_0062073488.jpg"),
            Libro("978-0062073501", "Asesinato en el Orient Express", "Agatha Christie", 300.0, 33.0, 5, "Distopía y Misterio", "Hércules Poirot resuelve un homicidio ocurrido en el tren de lujo atrapado por la nieve en los Balcanes.", "/static/img/libros/978_0062073501.jpg"),
            Libro("978-0307743657", "El Resplandor", "Stephen King", 380.0, 40.0, 4, "Distopía y Misterio", "Jack Torrance y su familia cuidan en soledad el siniestro Hotel Overlook durante la temporada de invierno.", "/static/img/libros/978_0307743657.jpg"),

            # --- 6. HISTORIA Y FILOSOFÍA (10 Libros) ---
            Libro("666-6", "Sapiens: De animales a dioses", "Yuval Noah Harari", 450.0, 50.0, 3, "Historia y Filosofía", "Fascinante recorrido por la historia de la humanidad desde la Edad de Piedra hasta la era del silicio.", "/static/img/libros/666_6.jpg"),
            Libro("978-0062464316", "Homo Deus: Breve historia del mañana", "Yuval Noah Harari", 460.0, 52.0, 3, "Historia y Filosofía", "Exploración de los futuros proyectos de la humanidad: inmortalidad, felicidad y superinteligencia artificial.", "/static/img/libros/978_0062464316.jpg"),
            Libro("978-0140449334", "Meditaciones", "Marco Aurelio", 280.0, 30.0, 6, "Historia y Filosofía", "Reflexiones filosóficas estoicas escritas por el emperador romano durante sus campañas militares.", "/static/img/libros/978_0140449334.jpg"),
            Libro("978-0140449150", "El Príncipe", "Nicolás Maquiavelo", 250.0, 28.0, 7, "Historia y Filosofía", "Tratado clásico de teoría política sobre la conquista, conservación y ejercicio del poder estatal.", "/static/img/libros/978_0140449150.jpg"),
            Libro("978-1590302255", "El Arte de la Guerra", "Sun Tzu", 220.0, 25.0, 8, "Historia y Filosofía", "Tratado militar de estrategia milenaria aplicable al conflicto, el liderazgo y la toma de decisiones.", "/static/img/libros/978_1590302255.jpg"),
            Libro("978-0140441185", "Así Habló Zaratustra", "Friedrich Nietzsche", 350.0, 38.0, 4, "Historia y Filosofía", "Poema filosófico que expone las ideas de la muerte de Dios, la voluntad de poder y el superhombre.", "/static/img/libros/978_0140441185.jpg"),
            Libro("978-0553380163", "Historia del Tiempo: Del Big Bang a los Agujeros Negros", "Stephen Hawking", 370.0, 40.0, 4, "Historia y Filosofía", "El célebre físico explica los secretos del cosmos, la relatividad general y la mecánica cuántica.", "/static/img/libros/978_0553380163.jpg"),
            Libro("978-0374530716", "El Mundo de Sofía", "Jostein Gaarder", 380.0, 41.0, 4, "Historia y Filosofía", "Novela pedagógica sobre la historia de la filosofía occidental a través de cartas anónimas a una joven.", "/static/img/libros/978_0374530716.jpg"),
            Libro("978-0140455113", "La República", "Platón", 340.0, 36.0, 5, "Historia y Filosofía", "Diálogo platónico sobre la justicia, el Estado ideal y la alegoría de la caverna.", "/static/img/libros/978_0140455113.jpg"),
            Libro("978-0345373366", "Breve Historia del Saber", "Charles Van Doren", 410.0, 45.0, 3, "Historia y Filosofía", "Un tributo a la gran Biblioteca de Alejandría y el avance del conocimiento humano a través de los siglos.", "/static/img/libros/978_0345373366.jpg")
        ]
        for l in libros_iniciales:
            self.libros[l.isbn] = l
        for l in libros_iniciales:
            self.libros[l.isbn] = l

        # Clientes iniciales requeridos:
        # cliente1: 0301-2004-08765, Andrea Medina, andrea@gmail.com, 9999-8888
        # cliente2: 0301-2003-04839, Sophia Cerati, sophie@gmail.com, 7777-6666
        clientes_iniciales = [
            Cliente("0301-2004-08765", "Andrea Medina", "andrea@gmail.com", "9999-8888", "Col. Kennedy, Tegucigalpa", "Estudiante"),
            Cliente("0301-2003-04839", "Sophia Cerati", "sophie@gmail.com", "7777-6666", "Col. Palmira, Tegucigalpa", "Comprador"),
            Cliente("0801-1998-12345", "Dylan Calix", "dylan.calix@biblioteca.hn", "8888-1111", "Biblioteca Central, Edificio 1", "Bibliotecario"),
            Cliente("0501-2001-54321", "Carlos Mendoza", "carlos.m@yahoo.com", "9555-4321", "Bo. Guamilito, San Pedro Sula", "Lector"),
            Cliente("0101-2002-33445", "Valeria Castro", "valeria.castro@unah.hn", "9222-3344", "Ciudad Universitaria, Bulevar Suyapa", "Estudiante")
        ]
        for c in clientes_iniciales:
            self.clientes[c.id] = c

        # Ventas iniciales requeridas:
        # venta1: 1, 22/09/26, Andrea Medina, Dune, 3, 1110
        # venta2: 2, 22/09/26, Sophia Cerati, Juego de Tronos, 2, 940
        self.ventas = [
            Venta(1, "22/09/26", "Andrea Medina", "Dune", 3, 1110.0, "0301-2004-08765", "222-2"),
            Venta(2, "22/09/26", "Sophia Cerati", "Juego de Tronos", 2, 940.0, "0301-2003-04839", "111-1")
        ]

        # Préstamos iniciales requeridos:
        # prestamo1: 1, 22/09/26, 29/09/26, Andrea Medina, Dune, No
        # prestamo2: 2, 22/09/26, 29/09/26, Sophia Cerati, Juego de Tronos, No
        self.prestamos = [
            Prestamo(1, "22/09/26", "29/09/26", "Andrea Medina", "Dune", "No", "0301-2004-08765", "222-2"),
            Prestamo(2, "22/09/26", "29/09/26", "Sophia Cerati", "Juego de Tronos", "No", "0301-2003-04839", "111-1")
        ]

    # --- PERSISTENCIA JSON ---
    def guardar_datos(self):
        """Guarda todo el estado del sistema en el archivo JSON."""
        data = {
            "libros": [l.to_dict() for l in self.libros.values()],
            "clientes": [c.to_dict() for c in self.clientes.values()],
            "ventas": [v.to_dict() for v in self.ventas],
            "prestamos": [p.to_dict() for p in self.prestamos]
        }
        with open(self.data_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    def cargar_datos(self):
        """Carga el estado del sistema desde el archivo JSON."""
        try:
            with open(self.data_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            self.libros.clear()
            for l_data in data.get("libros", []):
                libro = Libro.from_dict(l_data)
                self.libros[libro.isbn] = libro

            self.clientes.clear()
            for c_data in data.get("clientes", []):
                cliente = Cliente.from_dict(c_data)
                self.clientes[cliente.id] = cliente

            self.ventas = [Venta.from_dict(v_data) for v_data in data.get("ventas", [])]
            self.prestamos = [Prestamo.from_dict(p_data) for p_data in data.get("prestamos", [])]
        except Exception as e:
            # Si hay error de lectura, cargar defaults para no corromper la app
            self.inicializar_datos_predeterminados()
            self.guardar_datos()

    def to_full_dict(self) -> Dict[str, Any]:
        """Retorna una instantánea completa de la base de datos."""
        return {
            "sistema": "Biblioteca Calixo",
            "version": "2.0",
            "fecha_exportacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "estadisticas": self.obtener_estadisticas(),
            "libros": [l.to_dict() for l in self.libros.values()],
            "clientes": [c.to_dict() for c in self.clientes.values()],
            "ventas": [v.to_dict() for v in self.ventas],
            "prestamos": [p.to_dict() for p in self.prestamos]
        }

    # --- MÓDULO DE LIBROS (CRUD & FILTROS) ---
    def registrar_libro(self, data: Dict[str, Any]) -> Libro:
        isbn = str(data.get("isbn", "")).strip()
        if not isbn:
            raise ValidationError("El ISBN es obligatorio.", "isbn")
        if isbn in self.libros:
            raise ValidationError(f"Ya existe un libro registrado con el ISBN '{isbn}'.", "isbn")
        
        libro = Libro.from_dict(data)
        self.libros[isbn] = libro
        self.guardar_datos()
        return libro

    def editar_libro(self, isbn: str, data: Dict[str, Any]) -> Libro:
        isbn = str(isbn).strip()
        if isbn not in self.libros:
            raise ValidationError(f"No se encontró ningún libro con ISBN '{isbn}'.", "isbn")
        
        # Validar y actualizar
        nuevo_titulo = str(data.get("titulo", "")).strip()
        nuevo_autor = str(data.get("autor", "")).strip()
        nuevo_genero = str(data.get("genero", "")).strip()
        sinopsis = str(data.get("sinopsis", "")).strip()
        portada = str(data.get("portada", "")).strip()
        
        try:
            precio_venta = float(data.get("precio_venta", 0))
            precio_prestamo = float(data.get("precio_prestamo", 0))
            stock = int(data.get("stock", 0))
        except (ValueError, TypeError):
            raise ValidationError("Precios y stock deben ser valores numéricos válidos.")

        libro = Libro(
            isbn=isbn,
            titulo=nuevo_titulo,
            autor=nuevo_autor,
            precio_venta=precio_venta,
            precio_prestamo=precio_prestamo,
            stock=stock,
            genero=nuevo_genero,
            sinopsis=sinopsis,
            portada=portada
        )
        self.libros[isbn] = libro
        self.guardar_datos()
        return libro

    def eliminar_libro(self, isbn: str) -> bool:
        isbn = str(isbn).strip()
        if isbn not in self.libros:
            raise ValidationError(f"No se puede eliminar: el libro '{isbn}' no existe.", "isbn")
        
        # Verificar si tiene préstamos activos pendientes de devolución
        prestamos_activos = [p for p in self.prestamos if p.isbn == isbn and p.devuelto == "No"]
        if prestamos_activos:
            raise ValidationError(f"No se puede eliminar el libro porque tiene {len(prestamos_activos)} préstamo(s) activo(s) sin devolver.")

        del self.libros[isbn]
        self.guardar_datos()
        return True

    def buscar_libros(self, query: str = "", genero: str = "") -> List[Dict[str, Any]]:
        """Búsqueda y filtrado por texto (título, autor, ISBN) y por género literario."""
        query = query.strip().lower()
        genero = genero.strip().lower()
        
        resultados = []
        for l in self.libros.values():
            coincide_genero = True
            if genero and genero != "todos":
                coincide_genero = (genero in l.genero.lower())
            
            coincide_query = True
            if query:
                coincide_query = (
                    query in l.titulo.lower() or
                    query in l.autor.lower() or
                    query in l.isbn.lower() or
                    query in l.genero.lower()
                )
            
            if coincide_genero and coincide_query:
                resultados.append(l.to_dict())
        
        return resultados

    def obtener_generos(self) -> List[str]:
        """Obtiene la lista de géneros literarios únicos presentes en el catálogo."""
        generos = set()
        for l in self.libros.values():
            if l.genero:
                generos.add(l.genero)
        return sorted(list(generos))

    # --- MÓDULO DE CLIENTES (CRUD & VALIDACIONES) ---
    def registrar_cliente(self, data: Dict[str, Any]) -> Cliente:
        cid = str(data.get("id", "")).strip()
        if not cid:
            raise ValidationError("El número de documento/ID es obligatorio.", "id")
        if cid in self.clientes:
            raise ValidationError(f"Ya existe un cliente registrado con el ID '{cid}'.", "id")

        cliente = Cliente.from_dict(data)
        self.clientes[cid] = cliente
        self.guardar_datos()
        return cliente

    def editar_cliente(self, cid: str, data: Dict[str, Any]) -> Cliente:
        cid = str(cid).strip()
        if cid not in self.clientes:
            raise ValidationError(f"No se encontró ningún cliente con ID '{cid}'.", "id")

        cliente = Cliente(
            id=cid,
            nombre=data.get("nombre", ""),
            correo=data.get("correo", ""),
            telefono=data.get("telefono", ""),
            direccion=data.get("direccion", ""),
            rol=data.get("rol", "Lector")
        )
        self.clientes[cid] = cliente
        self.guardar_datos()
        return cliente

    def eliminar_cliente(self, cid: str) -> bool:
        cid = str(cid).strip()
        if cid not in self.clientes:
            raise ValidationError(f"No se puede eliminar: el cliente '{cid}' no existe.", "id")
        
        # Validar si tiene préstamos activos pendientes
        pendientes = [p for p in self.prestamos if p.cliente_id == cid and p.devuelto == "No"]
        if pendientes:
            raise ValidationError(f"No se puede eliminar el cliente: tiene {len(pendientes)} préstamo(s) pendiente(s) de entrega.")

        del self.clientes[cid]
        self.guardar_datos()
        return True

    def buscar_clientes(self, query: str = "") -> List[Dict[str, Any]]:
        query = query.strip().lower()
        if not query:
            return [c.to_dict() for c in self.clientes.values()]
        
        return [
            c.to_dict() for c in self.clientes.values()
            if query in c.nombre.lower() or query in c.id.lower() or query in c.correo.lower() or query in c.rol.lower()
        ]

    # --- MÓDULO DE VENTAS ---
    def realizar_venta(self, cliente_id: str, isbn: str, cantidad: int) -> Venta:
        cliente_id = str(cliente_id).strip()
        isbn = str(isbn).strip()

        if not cliente_id:
            raise ValidationError("Debe seleccionar un cliente para registrar la venta.", "cliente_id")
        if not isbn:
            raise ValidationError("Debe seleccionar un libro para registrar la venta.", "isbn")
        if cantidad <= 0:
            raise ValidationError("La cantidad a vender debe ser un número positivo mayor a 0.", "cantidad")

        if cliente_id not in self.clientes:
            raise ValidationError(f"El cliente con ID '{cliente_id}' no está registrado.", "cliente_id")
        if isbn not in self.libros:
            raise ValidationError(f"El libro con ISBN '{isbn}' no existe en el catálogo.", "isbn")

        cliente = self.clientes[cliente_id]
        libro = self.libros[isbn]

        # Vender y actualizar stock usando métodos de clase
        total = libro.vender(cantidad)

        # Generar nuevo ID secuencial
        nuevo_id = max([v.id_venta for v in self.ventas], default=0) + 1
        fecha_actual = datetime.now().strftime("%d/%m/%y")

        venta = Venta(
            id_venta=nuevo_id,
            fecha=fecha_actual,
            cliente=cliente.nombre,
            libro=libro.titulo,
            cantidad=cantidad,
            total=total,
            cliente_id=cliente.id,
            isbn=libro.isbn
        )
        self.ventas.append(venta)
        self.guardar_datos()
        return venta

    # --- MÓDULO DE PRÉSTAMOS ---
    def realizar_prestamo(self, cliente_id: str, isbn: str, dias: int = 7) -> Prestamo:
        cliente_id = str(cliente_id).strip()
        isbn = str(isbn).strip()

        if not cliente_id:
            raise ValidationError("Debe seleccionar un cliente para el préstamo.", "cliente_id")
        if not isbn:
            raise ValidationError("Debe seleccionar un libro para prestar.", "isbn")
        if dias <= 0 or dias > 90:
            raise ValidationError("El plazo de días debe estar entre 1 y 90 días.", "dias")

        if cliente_id not in self.clientes:
            raise ValidationError(f"El cliente con ID '{cliente_id}' no está registrado.", "cliente_id")
        if isbn not in self.libros:
            raise ValidationError(f"El libro con ISBN '{isbn}' no existe en el catálogo.", "isbn")

        cliente = self.clientes[cliente_id]
        libro = self.libros[isbn]

        # Verificar disponibilidad y descontar 1 unidad
        libro.prestar(1)

        nuevo_id = max([p.id_prestamo for p in self.prestamos], default=0) + 1
        fecha_hoy = datetime.now()
        fecha_prestamo = fecha_hoy.strftime("%d/%m/%y")
        fecha_devolucion = (fecha_hoy + timedelta(days=dias)).strftime("%d/%m/%y")

        prestamo = Prestamo(
            id_prestamo=nuevo_id,
            fecha_prestamo=fecha_prestamo,
            fecha_devolucion=fecha_devolucion,
            cliente=cliente.nombre,
            libro=libro.titulo,
            devuelto="No",
            cliente_id=cliente.id,
            isbn=libro.isbn
        )
        self.prestamos.append(prestamo)
        self.guardar_datos()
        return prestamo

    def devolver_prestamo(self, id_prestamo: int) -> Prestamo:
        id_prestamo = int(id_prestamo)
        prestamo = next((p for p in self.prestamos if p.id_prestamo == id_prestamo), None)
        
        if not prestamo:
            raise ValidationError(f"No existe ningún préstamo con ID '{id_prestamo}'.", "id_prestamo")
        if prestamo.devuelto == "Sí":
            raise ValidationError(f"El préstamo #{id_prestamo} ya fue devuelto previamente.")

        prestamo.marcar_devuelto()

        # Restaurar stock del libro si existe
        if prestamo.isbn and prestamo.isbn in self.libros:
            self.libros[prestamo.isbn].devolver(1)
        else:
            # Buscar por título si el isbn original no está
            libro_match = next((l for l in self.libros.values() if l.titulo.lower() == prestamo.libro.lower()), None)
            if libro_match:
                libro_match.devolver(1)

        self.guardar_datos()
        return prestamo

    # --- ESTADÍSTICAS DEL SISTEMA ---
    def obtener_estadisticas(self) -> Dict[str, Any]:
        total_libros = len(self.libros)
        ejemplares_totales = sum(l.stock for l in self.libros.values())
        total_clientes = len(self.clientes)
        total_ventas = len(self.ventas)
        total_ingresos_ventas = sum(v.total for v in self.ventas)
        total_prestamos = len(self.prestamos)
        prestamos_activos = sum(1 for p in self.prestamos if p.devuelto == "No")
        prestamos_devueltos = sum(1 for p in self.prestamos if p.devuelto == "Sí")
        prestamos_vencidos = sum(1 for p in self.prestamos if p.esta_vencido())

        return {
            "total_libros": total_libros,
            "ejemplares_totales": ejemplares_totales,
            "total_clientes": total_clientes,
            "total_ventas": total_ventas,
            "total_ingresos_ventas": round(total_ingresos_ventas, 2),
            "total_prestamos": total_prestamos,
            "prestamos_activos": prestamos_activos,
            "prestamos_devueltos": prestamos_devueltos,
            "prestamos_vencidos": prestamos_vencidos
        }
