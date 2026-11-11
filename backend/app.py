"""
Sistema de Biblioteca - Biblioteca Calixo
Servidor Web Flask y API RESTful Exclusiva (JSON REST Backend)
Separación de arquitectura: Funciona 100% como servicio API REST.
Integra Supabase SDK para Base de Datos y Autenticación con fallback transparente.
"""

import os
import io
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from manager import BibliotecaCalixo
from models import ValidationError
import reports
from two_factor import two_factor_auth
from facturacion import GeneradorFactura
import supabase_client

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(os.path.dirname(BASE_DIR), "static")

app = Flask(__name__)
# Habilitar CORS para permitir peticiones desde el frontend en React (ej. Vite en puerto 5173 o cualquier cliente)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Instancia singleton del gestor
biblioteca = BibliotecaCalixo()


# ==========================================================
# API ROOT & ESTADO DEL SERVIDOR REST
# ==========================================================
@app.route("/", methods=["GET"])
def api_root():
    """Endpoint informativo de la API REST."""
    return jsonify({
        "name": "Biblioteca Calixo - API REST",
        "version": "2.0.0",
        "architecture": "Python Flask (REST API) + React (Frontend Client) + Supabase (DB/Auth)",
        "supabase_connected": supabase_client.is_supabase_configured(),
        "status": "online",
        "endpoints": {
            "stats": "/api/stats",
            "libros": "/api/libros",
            "clientes": "/api/clientes",
            "ventas": "/api/ventas",
            "prestamos": "/api/prestamos",
            "2fa": "/api/2fa/status",
            "auth": "/api/auth/login",
            "export_pdf": "/api/export/pdf",
            "export_excel": "/api/export/excel",
            "export_word": "/api/export/word"
        }
    })


# ==========================================================
# API: AUTENTICACIÓN SUPABASE & ROLES DE USUARIO
# ==========================================================
@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    """Registra un usuario en Supabase Auth."""
    data = request.get_json(force=True) or {}
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "Lector")
    
    if not email or not password:
        return jsonify({"success": False, "error": "Email y contraseña requeridos."}), 400

    if supabase_client.is_supabase_configured():
        res = supabase_client.supabase_sign_up(email, password, role)
        if res.get("success"):
            return jsonify({"success": True, "message": "Usuario registrado en Supabase.", "user": str(res.get("user"))})
        return jsonify({"success": False, "error": res.get("error")}), 400
    
    # Fallback si opera en modo local
    return jsonify({
        "success": True, 
        "message": "Modo local: Usuario registrado exitosamente.",
        "user": {"email": email, "role": role}
    })

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    """Inicia sesión con Supabase Auth."""
    data = request.get_json(force=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "error": "Email y contraseña requeridos."}), 400

    if supabase_client.is_supabase_configured():
        res = supabase_client.supabase_sign_in(email, password)
        if res.get("success"):
            return jsonify({
                "success": True,
                "message": "Autenticación exitosa en Supabase.",
                "token": res.get("access_token"),
                "user": str(res.get("user"))
            })
        return jsonify({"success": False, "error": res.get("error")}), 401

    # Fallback modo local
    return jsonify({
        "success": True,
        "message": "Modo local: Sesión autorizada.",
        "token": "local-jwt-token-calixo",
        "user": {"email": email, "role": "Bibliotecario"}
    })


# ==========================================================
# API: ESTADÍSTICAS & RESUMEN
# ==========================================================
@app.route("/api/stats", methods=["GET"])
def get_stats():
    return jsonify({
        "success": True,
        "data": biblioteca.obtener_estadisticas()
    })


# ==========================================================
# API: CATÁLOGO DE LIBROS
# ==========================================================
@app.route("/api/libros", methods=["GET"])
def get_libros():
    query = request.args.get("query", "")
    genero = request.args.get("genero", "")
    libros = biblioteca.buscar_libros(query=query, genero=genero)
    return jsonify({
        "success": True,
        "count": len(libros),
        "data": [l.to_dict() for l in libros]
    })

@app.route("/api/libros/<string:isbn>", methods=["GET"])
def get_libro(isbn):
    libro = biblioteca.obtener_libro(isbn)
    if libro:
        return jsonify({"success": True, "data": libro.to_dict()})
    return jsonify({"success": False, "error": f"No se encontró el libro con ISBN '{isbn}'."}), 404

@app.route("/api/libros", methods=["POST"])
def post_libro():
    try:
        supabase_client.verify_supabase_jwt(request.headers.get("Authorization", ""))
        data = request.get_json(force=True) or {}
        nuevo_libro = biblioteca.agregar_libro(data)
        
        # Sincronización transparente con Supabase
        if supabase_client.is_supabase_configured():
            supabase_client.save_libro_to_supabase(nuevo_libro.to_dict())

        return jsonify({
            "success": True,
            "message": f"Libro '{nuevo_libro.titulo}' registrado exitosamente en el catálogo.",
            "data": nuevo_libro.to_dict()
        }), 201
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error interno del servidor: {str(e)}"}), 500

@app.route("/api/libros/<string:isbn>", methods=["PUT"])
def put_libro(isbn):
    try:
        supabase_client.verify_supabase_jwt(request.headers.get("Authorization", ""))
        data = request.get_json(force=True) or {}
        libro_editado = biblioteca.editar_libro(isbn, data)
        
        # Sincronización con Supabase
        if supabase_client.is_supabase_configured():
            supabase_client.save_libro_to_supabase(libro_editado.to_dict())

        return jsonify({
            "success": True,
            "message": f"Libro '{libro_editado.titulo}' actualizado exitosamente.",
            "data": libro_editado.to_dict()
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error interno: {str(e)}"}), 500

@app.route("/api/libros/<string:isbn>", methods=["DELETE"])
def delete_libro(isbn):
    try:
        supabase_client.verify_supabase_jwt(request.headers.get("Authorization", ""))
        libro = biblioteca.eliminar_libro(isbn)
        
        # Eliminar de Supabase
        if supabase_client.is_supabase_configured():
            supabase_client.delete_libro_from_supabase(isbn)

        return jsonify({
            "success": True,
            "message": f"Libro '{libro.titulo}' eliminado del catálogo.",
            "data": libro.to_dict()
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al eliminar: {str(e)}"}), 500

@app.route("/api/generos", methods=["GET"])
def get_generos():
    generos = biblioteca.obtener_generos()
    return jsonify({
        "success": True,
        "count": len(generos),
        "data": generos
    })


# ==========================================================
# API: CLIENTES / USUARIOS
# ==========================================================
@app.route("/api/clientes", methods=["GET"])
def get_clientes():
    clientes = biblioteca.listar_clientes()
    return jsonify({
        "success": True,
        "count": len(clientes),
        "data": [c.to_dict() for c in clientes]
    })

@app.route("/api/clientes/<string:cid>", methods=["GET"])
def get_cliente(cid):
    cliente = biblioteca.obtener_cliente(cid)
    if cliente:
        return jsonify({"success": True, "data": cliente.to_dict()})
    return jsonify({"success": False, "error": f"No se encontró el cliente con ID '{cid}'."}), 404

@app.route("/api/clientes", methods=["POST"])
def post_cliente():
    try:
        data = request.get_json(force=True) or {}
        nuevo_cliente = biblioteca.agregar_cliente(data)
        
        if supabase_client.is_supabase_configured():
            supabase_client.save_cliente_to_supabase(nuevo_cliente.to_dict())

        return jsonify({
            "success": True,
            "message": f"Cliente '{nuevo_cliente.nombre}' registrado exitosamente.",
            "data": nuevo_cliente.to_dict()
        }), 201
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error interno: {str(e)}"}), 500

@app.route("/api/clientes/<string:cid>", methods=["PUT"])
def put_cliente(cid):
    try:
        data = request.get_json(force=True) or {}
        cliente_editado = biblioteca.editar_cliente(cid, data)
        
        if supabase_client.is_supabase_configured():
            supabase_client.save_cliente_to_supabase(cliente_editado.to_dict())

        return jsonify({
            "success": True,
            "message": f"Cliente '{cliente_editado.nombre}' actualizado exitosamente.",
            "data": cliente_editado.to_dict()
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al editar cliente: {str(e)}"}), 500

@app.route("/api/clientes/<string:cid>", methods=["DELETE"])
def delete_cliente(cid):
    try:
        cliente = biblioteca.eliminar_cliente(cid)
        return jsonify({
            "success": True,
            "message": f"Cliente '{cliente.nombre}' eliminado del sistema.",
            "data": cliente.to_dict()
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al eliminar cliente: {str(e)}"}), 500


# ==========================================================
# API: VENTAS
# ==========================================================
@app.route("/api/ventas", methods=["GET"])
def get_ventas():
    ventas = biblioteca.listar_ventas()
    return jsonify({
        "success": True,
        "count": len(ventas),
        "data": [v.to_dict() for v in ventas]
    })

@app.route("/api/ventas", methods=["POST"])
def post_venta():
    try:
        data = request.get_json(force=True) or {}
        cliente_id = data.get("cliente_id")
        isbn = data.get("isbn")
        try:
            cantidad = int(data.get("cantidad", 1))
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "La cantidad debe ser un número entero."}), 400

        venta = biblioteca.realizar_venta(cliente_id, isbn, cantidad)
        cliente = biblioteca.clientes.get(cliente_id)
        libro_actualizado = biblioteca.libros.get(isbn)
        factura_data = GeneradorFactura.construir_factura_data(venta, cliente)

        if supabase_client.is_supabase_configured():
            supabase_client.save_venta_to_supabase(
                venta.to_dict(),
                libro_actualizado.to_dict() if libro_actualizado else None
            )

        return jsonify({
            "success": True,
            "message": f"Venta #{venta.id_venta} registrada. Total: Lps. {venta.total:.2f}",
            "data": venta.to_dict(),
            "factura": factura_data
        }), 201
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error en venta: {str(e)}"}), 500


# ==========================================================
# API: PRÉSTAMOS
# ==========================================================
@app.route("/api/prestamos", methods=["GET"])
def get_prestamos():
    prestamos = biblioteca.listar_prestamos()
    return jsonify({
        "success": True,
        "count": len(prestamos),
        "data": [p.to_dict() for p in prestamos]
    })

@app.route("/api/prestamos", methods=["POST"])
def post_prestamo():
    try:
        data = request.get_json(force=True) or {}
        cliente_id = data.get("cliente_id")
        isbn = data.get("isbn")
        try:
            dias = int(data.get("dias", 7))
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "Los días deben ser un número válido."}), 400

        prestamo = biblioteca.realizar_prestamo(cliente_id, isbn, dias)
        libro_actualizado = biblioteca.libros.get(isbn)

        if supabase_client.is_supabase_configured():
            supabase_client.save_prestamo_to_supabase(
                prestamo.to_dict(),
                libro_actualizado.to_dict() if libro_actualizado else None
            )

        return jsonify({
            "success": True,
            "message": f"Préstamo registrado exitosamente hasta el {prestamo.fecha_devolucion}.",
            "data": prestamo.to_dict()
        }), 201
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error en préstamo: {str(e)}"}), 500

@app.route("/api/prestamos/<int:pid>/devolver", methods=["POST"])
def post_devolver_prestamo(pid):
    try:
        prestamo = biblioteca.devolver_prestamo(pid)
        libro_actualizado = biblioteca.libros.get(prestamo.isbn)
        
        if supabase_client.is_supabase_configured():
            supabase_client.save_prestamo_to_supabase(
                prestamo.to_dict(),
                libro_actualizado.to_dict() if libro_actualizado else None
            )

        return jsonify({
            "success": True,
            "message": f"El libro '{prestamo.libro}' fue devuelto exitosamente. Stock actualizado.",
            "data": prestamo.to_dict()
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al devolver préstamo: {str(e)}"}), 500


# ==========================================================
# API: EXPORTACIONES (WORD, EXCEL, PDF, JSON)
# ==========================================================
@app.route("/api/reportes/word", methods=["GET"])
@app.route("/api/export/word", methods=["GET"])
def export_word():
    """Genera y descarga el reporte en formato Microsoft Word (.docx)."""
    try:
        data = biblioteca.to_full_dict()
        buffer = reports.generar_reporte_word(data)
        return send_file(
            buffer,
            as_attachment=True,
            download_name="Reporte_Biblioteca_Calixo.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al generar Word: {str(e)}"}), 500

@app.route("/api/reportes/excel", methods=["GET"])
@app.route("/api/export/excel", methods=["GET"])
def export_excel():
    """Genera y descarga el reporte en formato Microsoft Excel (.xlsx)."""
    try:
        data = biblioteca.to_full_dict()
        buffer = reports.generar_reporte_excel(data)
        return send_file(
            buffer,
            as_attachment=True,
            download_name="Reporte_Biblioteca_Calixo.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al generar Excel: {str(e)}"}), 500

@app.route("/api/reportes/pdf", methods=["GET"])
@app.route("/api/export/pdf", methods=["GET"])
def export_pdf():
    """Genera y descarga el reporte en formato Adobe PDF (.pdf)."""
    try:
        data = biblioteca.to_full_dict()
        buffer = reports.generar_reporte_pdf(data)
        return send_file(
            buffer,
            as_attachment=True,
            download_name="Reporte_Biblioteca_Calixo.pdf",
            mimetype="application/pdf"
        )
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al generar PDF: {str(e)}"}), 500

@app.route("/api/export/json", methods=["GET"])
def export_json():
    """Descarga el volcado completo de la base de datos en formato JSON."""
    data = biblioteca.to_full_dict()
    return jsonify(data)

@app.route("/api/reset", methods=["POST"])
def reset_datos():
    """Restaura los datos iniciales predeterminados."""
    biblioteca.inicializar_datos_predeterminados()
    biblioteca.guardar_datos()
    return jsonify({
        "success": True,
        "message": "Sistema restaurado con los datos predeterminados requeridos."
    })


# ==========================================================
# API: AUTENTICACIÓN DE DOS FACTORES (2FA - TOTP)
# ==========================================================
@app.route("/api/2fa/status", methods=["GET"])
def get_2fa_status():
    info = two_factor_auth.get_status_info()
    return jsonify({"success": True, "data": info})

@app.route("/api/2fa/verify", methods=["POST"])
def verify_2fa_code():
    data = request.get_json(force=True) or {}
    code = data.get("code", "")
    is_valid = two_factor_auth.verify_code(code)
    if is_valid:
        return jsonify({
            "success": True,
            "message": "Autenticación 2FA exitosa. Acceso de Bibliotecario autorizado."
        })
    return jsonify({
        "success": False,
        "error": "Código 2FA inválido o expirado. Verifique su app de autenticación o use el código maestro."
    }), 401

@app.route("/api/2fa/generate-temp-code", methods=["POST"])
def generate_temp_code():
    code = two_factor_auth.generate_temp_code()
    return jsonify({
        "success": True,
        "code": code,
        "message": f"Código 2FA generado: {code}. Válido por 60 segundos."
    })


# ==========================================================
# API: FACTURACIÓN & EMISIÓN FISCAL
# ==========================================================
@app.route("/api/factura/<int:id_venta>", methods=["GET"])
def get_factura(id_venta):
    venta = None
    for v in biblioteca.ventas:
        if v.id_venta == id_venta:
            venta = v
            break
            
    if not venta:
        return jsonify({"success": False, "error": f"Venta #{id_venta} no encontrada."}), 404

    cliente = biblioteca.clientes.get(venta.cliente_id)
    factura_data = GeneradorFactura.construir_factura_data(venta, cliente)
    return jsonify({"success": True, "data": factura_data})

@app.route("/api/factura/pdf/<int:id_venta>", methods=["GET"])
def get_factura_pdf(id_venta):
    venta = None
    for v in biblioteca.ventas:
        if v.id_venta == id_venta:
            venta = v
            break
            
    if not venta:
        return jsonify({"success": False, "error": f"Venta #{id_venta} no encontrada."}), 404

    cliente = biblioteca.clientes.get(venta.cliente_id)
    factura_data = GeneradorFactura.construir_factura_data(venta, cliente)
    
    buf = io.BytesIO()
    GeneradorFactura.generar_pdf(factura_data, buf)
    buf.seek(0)
    
    filename = f"Factura_{factura_data['numero_factura']}.pdf"
    return send_file(
        buf,
        as_attachment=True,
        download_name=filename,
        mimetype="application/pdf"
    )


if __name__ == "__main__":
    print("====================================================")
    print("Iniciando Backend REST Exclusivo - Biblioteca Calixo")
    print("API RESTful: http://127.0.0.1:5000/api")
    print("====================================================")
    app.run(host="127.0.0.1", port=5000, debug=False)
