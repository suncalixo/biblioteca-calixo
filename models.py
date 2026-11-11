"""
Sistema de Biblioteca - Biblioteca Calixo
Módulo de Modelos y Clases de Dominio (OOP)
"""

import json
import os
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any

class ValidationError(Exception):
    """Excepción para errores de validación de negocio y campos."""
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.field = field


class Libro:
    """
    CLASE: Libro
    ATRIBUTOS:
        - isbn: Código único del libro
        - titulo: Título del libro
        - autor: Autor de la obra
        - precio_venta: Precio para compra (Lps / $)
        - precio_prestamo: Tarifa para alquiler/préstamo
        - stock: Cantidad disponible física
        - genero: Género literario para catalogación
        - sinopsis: Breve resumen descriptivo
    """
    def __init__(
        self,
        isbn: str,
        titulo: str,
        autor: str,
        precio_venta: float,
        precio_prestamo: float,
        stock: int,
        genero: str = "General",
        sinopsis: str = "",
        portada: str = ""
    ):
        self.isbn = str(isbn).strip()
        self.titulo = str(titulo).strip()
        self.autor = str(autor).strip()
        self.precio_venta = float(precio_venta)
        self.precio_prestamo = float(precio_prestamo)
        self.stock = int(stock)
        self.genero = str(genero).strip() if genero else "General"
        self.sinopsis = str(sinopsis).strip()
        self.portada = str(portada).strip()
        
        self.validar()

    def validar(self):
        """Valida las reglas de negocio del libro."""
        if not self.isbn:
            raise ValidationError("El ISBN es un campo obligatorio.", "isbn")
        if not self.titulo:
            raise ValidationError("El título es un campo obligatorio y no puede estar vacío.", "titulo")
        if not self.autor:
            raise ValidationError("El autor es un campo obligatorio.", "autor")
        if self.precio_venta <= 0:
            raise ValidationError("El precio de venta debe ser un número positivo mayor a 0.", "precio_venta")
        if self.precio_prestamo <= 0:
            raise ValidationError("El precio de préstamo debe ser un número positivo mayor a 0.", "precio_prestamo")
        if self.stock < 0:
            raise ValidationError("El stock no puede ser un número negativo.", "stock")

    # MÉTODOS REQUERIDOS:
    def disponibilidad(self) -> bool:
        """Indica si el libro tiene copias disponibles en stock."""
        return self.stock > 0

    def vender(self, cantidad: int = 1) -> float:
        """
        Reduce el stock por venta si hay disponibilidad.
        Retorna el monto total de la venta.
        """
        if cantidad <= 0:
            raise ValidationError("La cantidad a vender debe ser mayor a 0.", "cantidad")
        if self.stock < cantidad:
            raise ValidationError(
                f"Stock insuficiente. Solo quedan {self.stock} unidades de '{self.titulo}'.",
                "stock"
            )
        self.stock -= cantidad
        return round(self.precio_venta * cantidad, 2)

    def prestar(self, cantidad: int = 1) -> float:
        """
        Reduce el stock por préstamo temporal si hay disponibilidad.
        Retorna el monto del costo de préstamo.
        """
        if cantidad <= 0:
            raise ValidationError("La cantidad a prestar debe ser mayor a 0.", "cantidad")
        if self.stock < cantidad:
            raise ValidationError(
                f"No hay ejemplares suficientes para prestar '{self.titulo}'. Stock actual: {self.stock}.",
                "stock"
            )
        self.stock -= cantidad
        return round(self.precio_prestamo * cantidad, 2)

    def devolver(self, cantidad: int = 1):
        """Incrementa el stock al devolver un libro prestado."""
        if cantidad <= 0:
            raise ValidationError("La cantidad a devolver debe ser mayor a 0.", "cantidad")
        self.stock += cantidad

    def mostrar(self) -> Dict[str, Any]:
        """Retorna una representación legible en diccionario del libro."""
        return self.to_dict()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "isbn": self.isbn,
            "titulo": self.titulo,
            "autor": self.autor,
            "precio_venta": self.precio_venta,
            "precio_prestamo": self.precio_prestamo,
            "stock": self.stock,
            "genero": self.genero,
            "sinopsis": self.sinopsis,
            "portada": self.portada,
            "disponible": self.disponibilidad()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Libro":
        return cls(
            isbn=data.get("isbn", ""),
            titulo=data.get("titulo", ""),
            autor=data.get("autor", ""),
            precio_venta=float(data.get("precio_venta", 0)),
            precio_prestamo=float(data.get("precio_prestamo", 0)),
            stock=int(data.get("stock", 0)),
            genero=data.get("genero", "General"),
            sinopsis=data.get("sinopsis", ""),
            portada=data.get("portada", "")
        )


class Cliente:
    """
    CLASE: Cliente
    ATRIBUTOS:
        - id: Identidad o DNI
        - nombre: Nombre completo del cliente
        - correo: Correo electrónico de contacto
        - telefono: Número telefónico
        - direccion: Dirección física
        - rol: Rol del usuario (Estudiante, Lector, Comprador, Bibliotecario)
    """
    EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$")

    def __init__(
        self,
        id: str,
        nombre: str,
        correo: str,
        telefono: str,
        direccion: str = "",
        rol: str = "Lector"
    ):
        self.id = str(id).strip()
        self.nombre = str(nombre).strip()
        self.correo = str(correo).strip()
        self.telefono = str(telefono).strip()
        self.direccion = str(direccion).strip()
        self.rol = str(rol).strip() if rol else "Lector"
        
        self.validar()

    def validar(self):
        """Valida que los campos no estén vacíos y el correo sea válido."""
        if not self.id:
            raise ValidationError("El ID o documento de identidad es obligatorio.", "id")
        if not self.nombre:
            raise ValidationError("El nombre del cliente no puede estar vacío.", "nombre")
        if not self.correo:
            raise ValidationError("El correo electrónico es un campo obligatorio.", "correo")
        if not self.EMAIL_REGEX.match(self.correo):
            raise ValidationError(
                f"El correo '{self.correo}' no tiene un formato válido (ejemplo: usuario@dominio.com).",
                "correo"
            )
        if not self.telefono:
            raise ValidationError("El número de teléfono es un campo obligatorio.", "telefono")

    # MÉTODOS REQUERIDOS:
    def comprar(self, libro: Libro, cantidad: int = 1) -> "Venta":
        """El cliente realiza la compra de un libro."""
        total = libro.vender(cantidad)
        fecha_actual = datetime.now().strftime("%d/%m/%y")
        return Venta(
            id_venta=0,  # Se asignará por el gestor de la biblioteca
            fecha=fecha_actual,
            cliente=self.nombre,
            libro=libro.titulo,
            cantidad=cantidad,
            total=total,
            cliente_id=self.id,
            isbn=libro.isbn
        )

    def pedir_prestado(self, libro: Libro, dias: int = 7) -> "Prestamo":
        """El cliente solicita un préstamo temporal de un libro."""
        libro.prestar(1)
        fecha_hoy = datetime.now()
        fecha_prestamo = fecha_hoy.strftime("%d/%m/%y")
        fecha_devolucion = (fecha_hoy + timedelta(days=dias)).strftime("%d/%m/%y")
        return Prestamo(
            id_prestamo=0,  # Se asignará por el gestor
            fecha_prestamo=fecha_prestamo,
            fecha_devolucion=fecha_devolucion,
            cliente=self.nombre,
            libro=libro.titulo,
            devuelto="No",
            cliente_id=self.id,
            isbn=libro.isbn
        )

    def devolver(self, prestamo: "Prestamo", libro: Libro):
        """Devuelve un préstamo activo."""
        prestamo.marcar_devuelto()
        libro.devolver(1)

    def ver_catalogo(self, catalogo: List[Libro]) -> List[Dict[str, Any]]:
        """Permite al cliente consultar el catálogo de libros."""
        return [l.to_dict() for l in catalogo]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "nombre": self.nombre,
            "correo": self.correo,
            "telefono": self.telefono,
            "direccion": self.direccion,
            "rol": self.rol
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Cliente":
        return cls(
            id=data.get("id", ""),
            nombre=data.get("nombre", ""),
            correo=data.get("correo", ""),
            telefono=data.get("telefono", ""),
            direccion=data.get("direccion", ""),
            rol=data.get("rol", "Lector")
        )


class Venta:
    """
    CLASE: Venta
    ATRIBUTOS:
        - id_venta: Identificador numérico o alfanumérico
        - fecha: Fecha de emisión (DD/MM/AA)
        - cliente: Nombre del cliente comprador
        - libro: Título del libro vendido
        - cantidad: Unidades vendidas
        - total: Monto total cobrado
        - cliente_id: ID del cliente
        - isbn: ISBN del libro
    """
    def __init__(
        self,
        id_venta: int,
        fecha: str,
        cliente: str,
        libro: str,
        cantidad: int,
        total: float,
        cliente_id: str = "",
        isbn: str = ""
    ):
        self.id_venta = int(id_venta)
        self.fecha = str(fecha).strip()
        self.cliente = str(cliente).strip()
        self.libro = str(libro).strip()
        self.cantidad = int(cantidad)
        self.total = float(total)
        self.cliente_id = str(cliente_id).strip()
        self.isbn = str(isbn).strip()
        
        self.validar()

    def validar(self):
        if not self.cliente:
            raise ValidationError("El cliente de la venta es obligatorio.", "cliente")
        if not self.libro:
            raise ValidationError("El libro de la venta es obligatorio.", "libro")
        if self.cantidad <= 0:
            raise ValidationError("La cantidad vendida debe ser mayor a 0.", "cantidad")
        if self.total <= 0:
            raise ValidationError("El total de la venta debe ser mayor a 0.", "total")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id_venta": self.id_venta,
            "fecha": self.fecha,
            "cliente": self.cliente,
            "libro": self.libro,
            "cantidad": self.cantidad,
            "total": round(self.total, 2),
            "cliente_id": self.cliente_id,
            "isbn": self.isbn
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Venta":
        return cls(
            id_venta=int(data.get("id_venta", 0)),
            fecha=data.get("fecha", ""),
            cliente=data.get("cliente", ""),
            libro=data.get("libro", ""),
            cantidad=int(data.get("cantidad", 1)),
            total=float(data.get("total", 0.0)),
            cliente_id=data.get("cliente_id", ""),
            isbn=data.get("isbn", "")
        )


class Prestamo:
    """
    CLASE: Préstamo
    ATRIBUTOS:
        - id_prestamo: Identificador único del préstamo
        - fecha_prestamo: Fecha de salida (DD/MM/AA)
        - fecha_devolucion: Fecha límite convenida (DD/MM/AA)
        - cliente: Nombre del cliente
        - libro: Título del libro
        - devuelto: Estado ("No" o "Sí")
        - cliente_id: ID del cliente
        - isbn: ISBN del libro
        - multa: Monto de recargo por retraso si aplica
    """
    def __init__(
        self,
        id_prestamo: int,
        fecha_prestamo: str,
        fecha_devolucion: str,
        cliente: str,
        libro: str,
        devuelto: str = "No",
        cliente_id: str = "",
        isbn: str = "",
        multa: float = 0.0
    ):
        self.id_prestamo = int(id_prestamo)
        self.fecha_prestamo = str(fecha_prestamo).strip()
        self.fecha_devolucion = str(fecha_devolucion).strip()
        self.cliente = str(cliente).strip()
        self.libro = str(libro).strip()
        self.devuelto = "Sí" if str(devuelto).strip().lower() in ["si", "sí", "true", "1"] else "No"
        self.cliente_id = str(cliente_id).strip()
        self.isbn = str(isbn).strip()
        self.multa = float(multa)
        
        self.validar()

    def validar(self):
        if not self.cliente:
            raise ValidationError("El cliente del préstamo es obligatorio.", "cliente")
        if not self.libro:
            raise ValidationError("El libro del préstamo es obligatorio.", "libro")
        if not self.fecha_prestamo:
            raise ValidationError("La fecha de préstamo es obligatoria.", "fecha_prestamo")
        if not self.fecha_devolucion:
            raise ValidationError("La fecha de devolución es obligatoria.", "fecha_devolucion")

    def marcar_devuelto(self):
        """Marca el préstamo como devuelto."""
        self.devuelto = "Sí"

    def esta_vencido(self) -> bool:
        """Determina si el préstamo no ha sido devuelto y ya venció la fecha convenida."""
        if self.devuelto == "Sí":
            return False
        try:
            # Intenta parsear formatos comunes DD/MM/AA o DD/MM/AAAA
            partes = self.fecha_devolucion.split("/")
            if len(partes) == 3:
                d, m, y = int(partes[0]), int(partes[1]), int(partes[2])
                if y < 100:
                    y += 2000
                fecha_limite = datetime(y, m, d)
                return datetime.now() > fecha_limite
        except Exception:
            pass
        return False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id_prestamo": self.id_prestamo,
            "fecha_prestamo": self.fecha_prestamo,
            "fecha_devolucion": self.fecha_devolucion,
            "cliente": self.cliente,
            "libro": self.libro,
            "devuelto": self.devuelto,
            "cliente_id": self.cliente_id,
            "isbn": self.isbn,
            "multa": round(self.multa, 2),
            "vencido": self.esta_vencido()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Prestamo":
        return cls(
            id_prestamo=int(data.get("id_prestamo", 0)),
            fecha_prestamo=data.get("fecha_prestamo", ""),
            fecha_devolucion=data.get("fecha_devolucion", ""),
            cliente=data.get("cliente", ""),
            libro=data.get("libro", ""),
            devuelto=data.get("devuelto", "No"),
            cliente_id=data.get("cliente_id", ""),
            isbn=data.get("isbn", ""),
            multa=float(data.get("multa", 0.0))
        )
