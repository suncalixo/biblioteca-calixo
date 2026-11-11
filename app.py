"""
Sistema de Biblioteca - Biblioteca Calixo
Servidor Web Flask y API RESTful
Backend en Python con soporte de exportación Word, Excel, PDF y persistencia JSON.
"""

import os
import io
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from manager import BibliotecaCalixo
from models import ValidationError
import reports
from two_factor import two_factor_auth
from facturacion import GeneradorFactura
import supabase_client

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
REACT_DIST_DIR = os.path.join(BASE_DIR, "static_dist")

app = Flask(__name__, static_folder=STATIC_DIR)
CORS(app)

# Instancia singleton del gestor
biblioteca = BibliotecaCalixo()


# ==========================================================
# RUTAS DE INTERFAZ DE USUARIO (FRONTEND REACT + FALLBACK)
# ==========================================================
@app.route("/")
def index():
    if os.path.exists(os.path.join(REACT_DIST_DIR, "index.html")):
        return send_from_directory(REACT_DIST_DIR, "index.html")
    return send_from_directory(STATIC_DIR, "index.html")

@app.route("/assets/<path:path>")
def react_assets(path):
    assets_dir = os.path.join(REACT_DIST_DIR, "assets")
    if os.path.exists(os.path.join(assets_dir, path)):
        return send_from_directory(assets_dir, path)
    return send_from_directory(STATIC_DIR, path)

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory(STATIC_DIR, path)

@app.route("/<path:path>")
def catch_all(path):
    # Check react dist first
    if os.path.exists(os.path.join(REACT_DIST_DIR, path)):
        return send_from_directory(REACT_DIST_DIR, path)
    if os.path.exists(os.path.join(STATIC_DIR, path)):
        return send_from_directory(STATIC_DIR, path)
    # SPA fallback for React Router if needed
    if os.path.exists(os.path.join(REACT_DIST_DIR, "index.html")):
        return send_from_directory(REACT_DIST_DIR, "index.html")
    return send_from_directory(STATIC_DIR, "index.html")


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
        "data": libros
    })

@app.route("/api/generos", methods=["GET"])
def get_generos():
    return jsonify({
        "success": True,
        "data": biblioteca.obtener_generos()
    })

@app.route("/api/libros", methods=["POST"])
def add_libro():
    try:
        supabase_client.verify_supabase_jwt(request.headers.get("Authorization", ""))
        data = request.get_json(force=True) or {}
        libro = biblioteca.registrar_libro(data)
        if supabase_client.is_supabase_configured():
            supabase_client.save_libro_to_supabase(libro.to_dict())
        return jsonify({
            "success": True,
            "message": f"Libro '{libro.titulo}' registrado con éxito.",
            "data": libro.to_dict()
        }), 201
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error inesperado: {str(e)}"}), 500

@app.route("/api/libros/<isbn>", methods=["PUT"])
def update_libro(isbn):
    try:
        supabase_client.verify_supabase_jwt(request.headers.get("Authorization", ""))
        data = request.get_json(force=True) or {}
        libro = biblioteca.editar_libro(isbn, data)
        if supabase_client.is_supabase_configured():
            supabase_client.save_libro_to_supabase(libro.to_dict())
        return jsonify({
            "success": True,
            "message": f"Libro '{libro.titulo}' actualizado correctamente.",
            "data": libro.to_dict()
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error inesperado: {str(e)}"}), 500

@app.route("/api/libros/<isbn>", methods=["DELETE"])
def delete_libro(isbn):
    try:
        supabase_client.verify_supabase_jwt(request.headers.get("Authorization", ""))
        biblioteca.eliminar_libro(isbn)
        if supabase_client.is_supabase_configured():
            supabase_client.delete_libro_from_supabase(isbn)
        return jsonify({
            "success": True,
            "message": f"El libro con ISBN '{isbn}' fue eliminado correctamente."
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al eliminar: {str(e)}"}), 500


# ==========================================================
# API: CLIENTES Y USUARIOS
# ==========================================================
@app.route("/api/clientes", methods=["GET"])
def get_clientes():
    query = request.args.get("query", "")
    clientes = biblioteca.buscar_clientes(query=query)
    return jsonify({
        "success": True,
        "count": len(clientes),
        "data": clientes
    })

@app.route("/api/clientes", methods=["POST"])
def add_cliente():
    try:
        data = request.get_json(force=True) or {}
        cliente = biblioteca.registrar_cliente(data)
        return jsonify({
            "success": True,
            "message": f"Cliente '{cliente.nombre}' registrado con éxito.",
            "data": cliente.to_dict()
        }), 201
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error inesperado: {str(e)}"}), 500

@app.route("/api/clientes/<cid>", methods=["PUT"])
def update_cliente(cid):
    try:
        data = request.get_json(force=True) or {}
        cliente = biblioteca.editar_cliente(cid, data)
        return jsonify({
            "success": True,
            "message": f"Cliente '{cliente.nombre}' actualizado correctamente.",
            "data": cliente.to_dict()
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error inesperado: {str(e)}"}), 500

@app.route("/api/clientes/<cid>", methods=["DELETE"])
def delete_cliente(cid):
    try:
        biblioteca.eliminar_cliente(cid)
        return jsonify({
            "success": True,
            "message": f"Cliente '{cid}' eliminado correctamente."
        })
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al eliminar: {str(e)}"}), 500


# ==========================================================
# API: VENTAS
# ==========================================================
@app.route("/api/ventas", methods=["GET"])
def get_ventas():
    return jsonify({
        "success": True,
        "count": len(biblioteca.ventas),
        "data": [v.to_dict() for v in biblioteca.ventas]
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
            return jsonify({"success": False, "error": "La cantidad debe ser un número entero válido."}), 400

        venta = biblioteca.realizar_venta(cliente_id, isbn, cantidad)
        cliente_obj = biblioteca.clientes.get(venta.cliente_id)
        libro_actualizado = biblioteca.libros.get(isbn)
        factura_data = GeneradorFactura.construir_factura_data(venta, cliente_obj)
        if supabase_client.is_supabase_configured():
            supabase_client.save_venta_to_supabase(
                venta.to_dict(),
                libro_actualizado.to_dict() if libro_actualizado else None
            )
        return jsonify({
            "success": True,
            "message": f"Venta registrada con éxito. Total: Lps. {venta.total:.2f}",
            "data": venta.to_dict(),
            "factura": factura_data
        }), 201
    except ValidationError as ve:
        return jsonify({"success": False, "error": ve.message, "field": ve.field}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error en la venta: {str(e)}"}), 500


# ==========================================================
# API: PRÉSTAMOS
# ==========================================================
@app.route("/api/prestamos", methods=["GET"])
def get_prestamos():
    return jsonify({
        "success": True,
        "count": len(biblioteca.prestamos),
        "data": [p.to_dict() for p in biblioteca.prestamos]
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
    """Retorna el estado de 2FA, secreto, URI otpauth y QR base64."""
    info = two_factor_auth.get_status_info()
    return jsonify({"success": True, "data": info})

@app.route("/api/2fa/verify", methods=["POST"])
def verify_2fa_code():
    """Verifica un código TOTP de 6 dígitos ingresado por el usuario."""
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
    """Genera y retorna un código temporal para demostración/evaluación."""
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
    """Retorna los datos fiscales de la factura para una venta específica."""
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
    """Genera y descarga el PDF fiscal oficial de la factura para imprimir o guardar."""
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
    print("Iniciando Biblioteca Calixo - Servidor Flask")
    print("Acceso Local: http://127.0.0.1:5000")
    print("====================================================")
    app.run(host="127.0.0.1", port=5000, debug=False)
