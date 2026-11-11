"""
Sistema de Biblioteca - Biblioteca Calixo
Módulo de Facturación Fiscal, Emisión de Facturas e Impresión
"""

import io
import os
import base64
from typing import Dict, Any, Optional
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def numero_a_letras(numero: float) -> str:
    """Convierte un monto numérico a su representación en letras en español."""
    unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
    decenas_especiales = {
        10: "DIEZ", 11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
        16: "DIECISÉIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
        20: "VEINTE", 21: "VEINTIÚN", 22: "VEINTIDÓS", 23: "VEINTITRÉS", 24: "VEINTICUATRO",
        25: "VEINTICINCO", 26: "VEINTISÉIS", 27: "VEINTISIETE", 28: "VEINTIOCHO", 29: "VEINTINUEVE"
    }
    decenas = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
    centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", 
                "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]

    def convertir_grupo(n):
        if n == 0:
            return ""
        if n == 100:
            return "CIEN"
        
        texto = ""
        c = n // 100
        d = (n % 100) // 10
        u = n % 10
        du = n % 100

        if c > 0:
            texto += centenas[c] + " "

        if du in decenas_especiales:
            texto += decenas_especiales[du]
        elif d > 0:
            texto += decenas[d]
            if u > 0:
                texto += " Y " + unidades[u]
        elif u > 0:
            texto += unidades[u]

        return texto.strip()

    entero = int(numero)
    centavos = int(round((numero - entero) * 100))

    if entero == 0:
        texto_entero = "CERO"
    elif entero == 1000:
        texto_entero = "UN MIL"
    else:
        partes = []
        millones = entero // 1000000
        miles = (entero % 1000000) // 1000
        resto = entero % 1000

        if millones > 0:
            partes.append("UN MILLÓN" if millones == 1 else f"{convertir_grupo(millones)} MILLONES")
        if miles > 0:
            partes.append("UN MIL" if miles == 1 else f"{convertir_grupo(miles)} MIL")
        if resto > 0:
            partes.append(convertir_grupo(resto))

        texto_entero = " ".join(partes)

    return f"{texto_entero} LEMPIRAS CON {centavos:02d}/100 CTVS."


class GeneradorFactura:
    """Maneja la generación y emisión de facturas fiscales de venta de libros."""
    
    EMPRESA_RTN = "0801-1990-123456"
    EMPRESA_NOMBRE = "BIBLIOTECA CALIXO S.A."
    EMPRESA_DIRECCION = "Bulevar Suyapa, Edificio Histórico de Letras, Tegucigalpa, Honduras"
    EMPRESA_TEL = "+504 2235-8899 / +504 9999-8888"
    EMPRESA_EMAIL = "facturacion@bibliotecacalixo.hn"
    
    CAI = "3A8C9B-7210EF-45D3B2-89A1C4-6729B1-04"
    RANGO_AUTORIZADO = "000-001-01-00000001 al 000-001-01-00005000"
    FECHA_LIMITE = "31/12/2026"

    @classmethod
    def construir_factura_data(cls, venta, cliente=None) -> Dict[str, Any]:
        """Construye un diccionario fiscal detallado con todos los datos de la factura."""
        num_factura = f"FAC-2026-{venta.id_venta:04d}"
        
        # Desglose fiscal (Honduras ISV 15% incluido en el total)
        total = float(venta.total)
        subtotal_gravado = round(total / 1.15, 2)
        isv_15 = round(total - subtotal_gravado, 2)
        
        c_id = cliente.id if cliente else (venta.cliente_id or "0301-2004-08765")
        c_nombre = cliente.nombre if cliente else venta.cliente
        c_tel = cliente.telefono if cliente else "9999-8888"
        c_email = cliente.correo if cliente else "cliente@correo.hn"
        c_dir = cliente.direccion if cliente else "Ciudad de Tegucigalpa, M.D.C."
        c_rol = cliente.rol if cliente else "Comprador"
        
        precio_unitario = round(total / max(1, venta.cantidad), 2)
        
        # Generar QR fiscal base64
        qr_text = f"RTN:{cls.EMPRESA_RTN}|FAC:{num_factura}|TOTAL:{total:.2f}|CLIENTE:{c_id}|CAI:{cls.CAI}"
        qr = qrcode.QRCode(version=1, box_size=4, border=1)
        qr.add_data(qr_text)
        qr.make(fit=True)
        img_qr = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF")
        buf = io.BytesIO()
        img_qr.save(buf, format="PNG")
        qr_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
        
        return {
            "numero_factura": num_factura,
            "id_venta": venta.id_venta,
            "cai": cls.CAI,
            "rango_autorizado": cls.RANGO_AUTORIZADO,
            "fecha_limite": cls.FECHA_LIMITE,
            "fecha_emision": venta.fecha,
            "emisor": {
                "nombre": cls.EMPRESA_NOMBRE,
                "rtn": cls.EMPRESA_RTN,
                "direccion": cls.EMPRESA_DIRECCION,
                "telefono": cls.EMPRESA_TEL,
                "correo": cls.EMPRESA_EMAIL
            },
            "cliente": {
                "nombre": c_nombre,
                "id": c_id,
                "telefono": c_tel,
                "correo": c_email,
                "direccion": c_dir,
                "rol": c_rol
            },
            "item": {
                "libro": venta.libro,
                "isbn": venta.isbn,
                "cantidad": venta.cantidad,
                "precio_unitario": precio_unitario,
                "subtotal": total
            },
            "totales": {
                "importe_exento": 0.00,
                "importe_gravado_15": subtotal_gravado,
                "descuento": 0.00,
                "isv_15": isv_15,
                "total": total,
                "total_letras": numero_a_letras(total)
            },
            "qr_code_base64": qr_b64
        }

    @classmethod
    def generar_pdf(cls, factura_data: Dict[str, Any], output_stream):
        """Genera un archivo PDF formal de la factura fiscal usando ReportLab."""
        doc = SimpleDocTemplate(
            output_stream,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        style_title = ParagraphStyle(
            'FacTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=18,
            textColor=colors.HexColor('#0F172A')
        )
        style_company = ParagraphStyle(
            'FacCompany',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#475569')
        )
        style_invoice_num = ParagraphStyle(
            'FacNum',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=14,
            textColor=colors.HexColor('#DC2626'),
            alignment=2 # Right
        )
        style_meta = ParagraphStyle(
            'FacMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#0F172A')
        )
        style_header_th = ParagraphStyle(
            'FacTH',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            textColor=colors.white,
            alignment=1
        )
        style_body_td = ParagraphStyle(
            'FacTD',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#0F172A')
        )
        style_body_td_right = ParagraphStyle(
            'FacTDRight',
            parent=style_body_td,
            alignment=2
        )
        style_legal = ParagraphStyle(
            'FacLegal',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#64748B'),
            alignment=1
        )

        elements = []

        # 1. Cabecera (Empresa vs Datos de Factura)
        emisor = factura_data['emisor']
        cliente = factura_data['cliente']
        item = factura_data['item']
        totales = factura_data['totales']

        col_izq = [
            Paragraph(f"<b>{emisor['nombre']}</b>", style_title),
            Paragraph(f"RTN: {emisor['rtn']}", style_company),
            Paragraph(f"{emisor['direccion']}", style_company),
            Paragraph(f"Tel: {emisor['telefono']} | {emisor['correo']}", style_company),
        ]
        
        col_der = [
            Paragraph(f"<b>FACTURA FISCAL</b>", style_invoice_num),
            Paragraph(f"<b>No: {factura_data['numero_factura']}</b>", style_invoice_num),
            Spacer(1, 4),
            Paragraph(f"<b>CAI:</b> {factura_data['cai']}", style_company),
            Paragraph(f"<b>Fecha Emisión:</b> {factura_data['fecha_emision']}", style_company),
            Paragraph(f"<b>Fecha Límite:</b> {factura_data['fecha_limite']}", style_company),
            Paragraph(f"<b>Rango:</b> {factura_data['rango_autorizado']}", style_company)
        ]

        t_head = Table([[col_izq, col_der]], colWidths=[3.8 * inch, 3.8 * inch])
        t_head.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#D4AF37')),
        ]))
        elements.append(t_head)
        elements.append(Spacer(1, 10))

        # 2. Datos del Adquiriente (Cliente)
        box_cliente = [
            [
                Paragraph(f"<b>CLIENTE:</b> {cliente['nombre']}", style_meta),
                Paragraph(f"<b>DNI/RTN:</b> {cliente['id']}", style_meta)
            ],
            [
                Paragraph(f"<b>DIRECCIÓN:</b> {cliente['direccion']}", style_meta),
                Paragraph(f"<b>TELÉFONO:</b> {cliente['telefono']}", style_meta)
            ],
            [
                Paragraph(f"<b>CORREO:</b> {cliente['correo']}", style_meta),
                Paragraph(f"<b>ROL:</b> {cliente['rol']}", style_meta)
            ]
        ]
        t_cli = Table(box_cliente, colWidths=[4.2 * inch, 3.4 * inch])
        t_cli.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F5F9')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(t_cli)
        elements.append(Spacer(1, 12))

        # 3. Tabla de Artículos
        table_items_data = [
            [
                Paragraph("<b>CANT.</b>", style_header_th),
                Paragraph("<b>DESCRIPCIÓN DE LA OBRA</b>", style_header_th),
                Paragraph("<b>ISBN</b>", style_header_th),
                Paragraph("<b>PRECIO UNIT.</b>", style_header_th),
                Paragraph("<b>TOTAL</b>", style_header_th)
            ],
            [
                Paragraph(str(item['cantidad']), ParagraphStyle('c', parent=style_body_td, alignment=1)),
                Paragraph(f"<b>{item['libro']}</b>", style_body_td),
                Paragraph(item['isbn'], ParagraphStyle('isbn', parent=style_body_td, alignment=1)),
                Paragraph(f"Lps. {item['precio_unitario']:,.2f}", style_body_td_right),
                Paragraph(f"Lps. {item['subtotal']:,.2f}", style_body_td_right),
            ]
        ]
        t_items = Table(table_items_data, colWidths=[0.8 * inch, 3.3 * inch, 1.2 * inch, 1.1 * inch, 1.2 * inch])
        t_items.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ]))
        elements.append(t_items)
        elements.append(Spacer(1, 10))

        # 4. Total en letras y Desglose Financiero
        letras_p = Paragraph(f"<b>SON:</b> {totales['total_letras']}", style_meta)
        
        t_totales_data = [
            [Paragraph("Importe Exento:", style_body_td), Paragraph(f"Lps. {totales['importe_exento']:,.2f}", style_body_td_right)],
            [Paragraph("Importe Gravado 15%:", style_body_td), Paragraph(f"Lps. {totales['importe_gravado_15']:,.2f}", style_body_td_right)],
            [Paragraph("Descuentos y Rebajas:", style_body_td), Paragraph(f"Lps. {totales['descuento']:,.2f}", style_body_td_right)],
            [Paragraph("I.S.V. 15%:", style_body_td), Paragraph(f"Lps. {totales['isv_15']:,.2f}", style_body_td_right)],
            [
                Paragraph("<b>TOTAL A PAGAR:</b>", ParagraphStyle('tot', parent=style_body_td, fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#059669'))), 
                Paragraph(f"<b>Lps. {totales['total']:,.2f}</b>", ParagraphStyle('totr', parent=style_body_td_right, fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#059669')))
            ]
        ]
        t_calc = Table(t_totales_data, colWidths=[1.8 * inch, 1.4 * inch])
        t_calc.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#ECFDF5')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))

        t_resumen = Table([[letras_p, t_calc]], colWidths=[4.4 * inch, 3.2 * inch])
        t_resumen.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(t_resumen)
        elements.append(Spacer(1, 14))

        # 5. Código QR Fiscal y Leyenda Legal
        qr_bytes = base64.b64decode(factura_data['qr_code_base64'].split(',')[1])
        qr_img = RLImage(io.BytesIO(qr_bytes), width=1.1 * inch, height=1.1 * inch)

        legal_text = [
            Paragraph("<b>LA FACTURA ES BENEFICIO DE TODOS, EXÍJALA</b>", style_legal),
            Spacer(1, 3),
            Paragraph("ORIGINAL: CLIENTE &bull; COPIA: EMISOR", style_legal),
            Spacer(1, 3),
            Paragraph("Garantía: Todo libro cuenta con 15 días para cambio por defecto físico presentando esta factura.", style_legal)
        ]

        t_footer = Table([[qr_img, legal_text]], colWidths=[1.3 * inch, 6.3 * inch])
        t_footer.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_footer)

        doc.build(elements)
