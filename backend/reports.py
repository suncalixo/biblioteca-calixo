"""
Sistema de Biblioteca - Biblioteca Calixo
Módulo de Exportación de Reportes:
1. Word (.docx)
2. Excel (.xlsx)
3. PDF (.pdf)
4. JSON (.json)
"""

import io
import os
from datetime import datetime
from typing import Dict, Any

# python-docx para documentos Word
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# openpyxl para hojas de cálculo Excel
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# reportlab para documentos PDF
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


# ==========================================================
# 1. GENERADOR DE DOCUMENTOS WORD (.DOCX)
# ==========================================================
def generar_reporte_word(sistema_data: Dict[str, Any]) -> io.BytesIO:
    """Genera un archivo Word profesional con todo el contenido del sistema."""
    doc = Document()

    # Ajuste de márgenes
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # Encabezado Principal
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = title_p.add_run("BIBLIOTECA CALIXO")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(30, 58, 138)  # Azul oscuro institucional

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = sub_p.add_run("Reporte Oficial Integral: Catálogo, Ventas, Préstamos y Usuarios")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    date_p = doc.add_paragraph()
    date_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fecha_str = datetime.now().strftime("%d/%m/%Y %I:%M %p")
    run_date = date_p.add_run(f"Generado el: {fecha_str}")
    run_date.font.size = Pt(10)
    run_date.font.italic = True
    run_date.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 1. Resumen Ejecutivo / Estadísticas
    h1 = doc.add_heading("1. Resumen Ejecutivo del Sistema", level=1)
    h1.runs[0].font.color.rgb = RGBColor(30, 58, 138)
    stats = sistema_data.get("estadisticas", {})
    
    t_stats = doc.add_table(rows=1, cols=4)
    t_stats.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = t_stats.rows[0].cells
    hdr_cells[0].text = "Títulos en Catálogo"
    hdr_cells[1].text = "Total Clientes"
    hdr_cells[2].text = "Ventas Totales"
    hdr_cells[3].text = "Préstamos Activos"
    
    # Estilo cabecera
    for cell in hdr_cells:
        shading = parse_xml(r'<w:shd {} w:fill="1E3A8A"/>'.format(nsdecls('w')))
        cell._tc.get_or_add_tcPr().append(shading)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    row_cells = t_stats.add_row().cells
    row_cells[0].text = str(stats.get("total_libros", 0))
    row_cells[1].text = str(stats.get("total_clientes", 0))
    row_cells[2].text = f"Lps. {stats.get('total_ingresos_ventas', 0):,.2f} ({stats.get('total_ventas', 0)} ventas)"
    row_cells[3].text = f"{stats.get('prestamos_activos', 0)} de {stats.get('total_prestamos', 0)}"
    for cell in row_cells:
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        cell.paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 2. Catálogo de Libros por Género
    h2 = doc.add_heading("2. Catálogo de Libros y Stock", level=1)
    h2.runs[0].font.color.rgb = RGBColor(30, 58, 138)
    
    libros = sistema_data.get("libros", [])
    t_libros = doc.add_table(rows=1, cols=7)
    t_libros.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_lib = t_libros.rows[0].cells
    cols_lib = ["ISBN", "Título", "Autor", "Género", "P. Venta", "P. Préstamo", "Stock"]
    for i, col in enumerate(cols_lib):
        hdr_lib[i].text = col
        shading = parse_xml(r'<w:shd {} w:fill="0F766E"/>'.format(nsdecls('w')))  # Verde azulado
        hdr_lib[i]._tc.get_or_add_tcPr().append(shading)
        p = hdr_lib[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    for l in libros:
        row = t_libros.add_row().cells
        row[0].text = str(l.get("isbn", ""))
        row[1].text = str(l.get("titulo", ""))
        row[2].text = str(l.get("autor", ""))
        row[3].text = str(l.get("genero", ""))
        row[4].text = f"Lps. {l.get('precio_venta', 0):.2f}"
        row[5].text = f"Lps. {l.get('precio_prestamo', 0):.2f}"
        row[6].text = str(l.get("stock", 0))
        for idx, cell in enumerate(row):
            if idx in [0, 4, 5, 6]:
                cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT if idx in [4, 5, 6] else WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 3. Registro de Ventas
    h3 = doc.add_heading("3. Registro de Ventas Realizadas", level=1)
    h3.runs[0].font.color.rgb = RGBColor(30, 58, 138)
    ventas = sistema_data.get("ventas", [])
    t_ventas = doc.add_table(rows=1, cols=6)
    t_ventas.alignment = WD_TABLE_ALIGNMENT.CENTER
    cols_ven = ["ID", "Fecha", "Cliente", "Libro", "Cantidad", "Total"]
    for i, col in enumerate(cols_ven):
        t_ventas.rows[0].cells[i].text = col
        shading = parse_xml(r'<w:shd {} w:fill="1E3A8A"/>'.format(nsdecls('w')))
        t_ventas.rows[0].cells[i]._tc.get_or_add_tcPr().append(shading)
        p = t_ventas.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    for v in ventas:
        row = t_ventas.add_row().cells
        row[0].text = str(v.get("id_venta", ""))
        row[1].text = str(v.get("fecha", ""))
        row[2].text = str(v.get("cliente", ""))
        row[3].text = str(v.get("libro", ""))
        row[4].text = str(v.get("cantidad", ""))
        row[5].text = f"Lps. {v.get('total', 0):.2f}"
        row[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[4].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[5].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 4. Registro de Préstamos
    h4 = doc.add_heading("4. Registro y Control de Préstamos", level=1)
    h4.runs[0].font.color.rgb = RGBColor(30, 58, 138)
    prestamos = sistema_data.get("prestamos", [])
    t_prest = doc.add_table(rows=1, cols=6)
    t_prest.alignment = WD_TABLE_ALIGNMENT.CENTER
    cols_pres = ["ID", "F. Salida", "F. Límite", "Cliente", "Libro", "¿Devuelto?"]
    for i, col in enumerate(cols_pres):
        t_prest.rows[0].cells[i].text = col
        shading = parse_xml(r'<w:shd {} w:fill="7C3AED"/>'.format(nsdecls('w')))  # Violeta
        t_prest.rows[0].cells[i]._tc.get_or_add_tcPr().append(shading)
        p = t_prest.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    for p in prestamos:
        row = t_prest.add_row().cells
        row[0].text = str(p.get("id_prestamo", ""))
        row[1].text = str(p.get("fecha_prestamo", ""))
        row[2].text = str(p.get("fecha_devolucion", ""))
        row[3].text = str(p.get("cliente", ""))
        row[4].text = str(p.get("libro", ""))
        row[5].text = str(p.get("devuelto", "No"))
        row[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[5].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 5. Clientes y Usuarios
    h5 = doc.add_heading("5. Directorio de Usuarios y Clientes", level=1)
    h5.runs[0].font.color.rgb = RGBColor(30, 58, 138)
    clientes = sistema_data.get("clientes", [])
    t_cli = doc.add_table(rows=1, cols=5)
    t_cli.alignment = WD_TABLE_ALIGNMENT.CENTER
    cols_cli = ["ID / DNI", "Nombre", "Rol", "Correo", "Teléfono"]
    for i, col in enumerate(cols_cli):
        t_cli.rows[0].cells[i].text = col
        shading = parse_xml(r'<w:shd {} w:fill="0F766E"/>'.format(nsdecls('w')))
        t_cli.rows[0].cells[i]._tc.get_or_add_tcPr().append(shading)
        p = t_cli.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    for c in clientes:
        row = t_cli.add_row().cells
        row[0].text = str(c.get("id", ""))
        row[1].text = str(c.get("nombre", ""))
        row[2].text = str(c.get("rol", ""))
        row[3].text = str(c.get("correo", ""))
        row[4].text = str(c.get("telefono", ""))
        row[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[4].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer


# ==========================================================
# 2. GENERADOR DE HOJAS EXCEL (.XLSX)
# ==========================================================
def generar_reporte_excel(sistema_data: Dict[str, Any]) -> io.BytesIO:
    """Genera un libro Excel con pestañas formateadas profesionalmente."""
    wb = Workbook()
    
    # Fuentes y estilos
    font_header = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Segoe UI", size=10, bold=True)
    font_normal = Font(name="Segoe UI", size=10)
    
    fill_navy = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    fill_teal = PatternFill(start_color="0F766E", end_color="0F766E", fill_type="solid")
    fill_purple = PatternFill(start_color="7C3AED", end_color="7C3AED", fill_type="solid")
    fill_alt = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    # --- Hoja 1: Catálogo Libros ---
    ws_lib = wb.active
    ws_lib.title = "Catálogo de Libros"
    ws_lib.views.sheetView[0].showGridLines = True
    
    headers_lib = ["ISBN", "Título", "Autor", "Género Literario", "Precio Venta (Lps)", "Precio Préstamo (Lps)", "Stock Físico", "¿Disponible?"]
    ws_lib.append(headers_lib)
    for col_num, h in enumerate(headers_lib, 1):
        cell = ws_lib.cell(row=1, column=col_num)
        cell.font = font_header
        cell.fill = fill_teal
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    libros = sistema_data.get("libros", [])
    for row_idx, l in enumerate(libros, 2):
        row_data = [
            l.get("isbn", ""),
            l.get("titulo", ""),
            l.get("autor", ""),
            l.get("genero", ""),
            float(l.get("precio_venta", 0)),
            float(l.get("precio_prestamo", 0)),
            int(l.get("stock", 0)),
            "Sí" if l.get("stock", 0) > 0 else "Agotado"
        ]
        ws_lib.append(row_data)
        for col_idx in range(1, len(row_data) + 1):
            cell = ws_lib.cell(row=row_idx, column=col_idx)
            cell.font = font_normal
            cell.border = thin_border
            if row_idx % 2 == 1:
                cell.fill = fill_alt
            if col_idx in [5, 6]:
                cell.number_format = '"Lps. "#,##0.00'
                cell.alignment = Alignment(horizontal="right")
            elif col_idx in [1, 7, 8]:
                cell.alignment = Alignment(horizontal="center")

    # --- Hoja 2: Ventas ---
    ws_ven = wb.create_sheet(title="Ventas Realizadas")
    ws_ven.views.sheetView[0].showGridLines = True
    headers_ven = ["ID Venta", "Fecha", "Cliente", "Libro", "Cantidad", "Total (Lps)"]
    ws_ven.append(headers_ven)
    for col_num, h in enumerate(headers_ven, 1):
        cell = ws_ven.cell(row=1, column=col_num)
        cell.font = font_header
        cell.fill = fill_navy
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    ventas = sistema_data.get("ventas", [])
    for row_idx, v in enumerate(ventas, 2):
        row_data = [
            v.get("id_venta", ""),
            v.get("fecha", ""),
            v.get("cliente", ""),
            v.get("libro", ""),
            int(v.get("cantidad", 1)),
            float(v.get("total", 0))
        ]
        ws_ven.append(row_data)
        for col_idx in range(1, len(row_data) + 1):
            cell = ws_ven.cell(row=row_idx, column=col_idx)
            cell.font = font_normal
            cell.border = thin_border
            if row_idx % 2 == 1:
                cell.fill = fill_alt
            if col_idx == 6:
                cell.number_format = '"Lps. "#,##0.00'
                cell.alignment = Alignment(horizontal="right")
            elif col_idx in [1, 2, 5]:
                cell.alignment = Alignment(horizontal="center")

    # --- Hoja 3: Préstamos ---
    ws_pres = wb.create_sheet(title="Préstamos")
    ws_pres.views.sheetView[0].showGridLines = True
    headers_pres = ["ID Préstamo", "Fecha Salida", "Fecha Límite", "Cliente", "Libro", "¿Devuelto?", "Estado"]
    ws_pres.append(headers_pres)
    for col_num, h in enumerate(headers_pres, 1):
        cell = ws_pres.cell(row=1, column=col_num)
        cell.font = font_header
        cell.fill = fill_purple
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    prestamos = sistema_data.get("prestamos", [])
    for row_idx, p in enumerate(prestamos, 2):
        row_data = [
            p.get("id_prestamo", ""),
            p.get("fecha_prestamo", ""),
            p.get("fecha_devolucion", ""),
            p.get("cliente", ""),
            p.get("libro", ""),
            p.get("devuelto", "No"),
            "Completado" if p.get("devuelto") == "Sí" else "En Alquiler"
        ]
        ws_pres.append(row_data)
        for col_idx in range(1, len(row_data) + 1):
            cell = ws_pres.cell(row=row_idx, column=col_idx)
            cell.font = font_normal
            cell.border = thin_border
            if row_idx % 2 == 1:
                cell.fill = fill_alt
            if col_idx in [1, 2, 3, 6, 7]:
                cell.alignment = Alignment(horizontal="center")

    # --- Hoja 4: Clientes ---
    ws_cli = wb.create_sheet(title="Clientes y Usuarios")
    ws_cli.views.sheetView[0].showGridLines = True
    headers_cli = ["ID / Identidad", "Nombre Completo", "Rol", "Correo Electrónico", "Teléfono", "Dirección"]
    ws_cli.append(headers_cli)
    for col_num, h in enumerate(headers_cli, 1):
        cell = ws_cli.cell(row=1, column=col_num)
        cell.font = font_header
        cell.fill = fill_teal
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    clientes = sistema_data.get("clientes", [])
    for row_idx, c in enumerate(clientes, 2):
        row_data = [
            c.get("id", ""),
            c.get("nombre", ""),
            c.get("rol", ""),
            c.get("correo", ""),
            c.get("telefono", ""),
            c.get("direccion", "")
        ]
        ws_cli.append(row_data)
        for col_idx in range(1, len(row_data) + 1):
            cell = ws_cli.cell(row=row_idx, column=col_idx)
            cell.font = font_normal
            cell.border = thin_border
            if row_idx % 2 == 1:
                cell.fill = fill_alt
            if col_idx in [1, 3, 5]:
                cell.alignment = Alignment(horizontal="center")

    # Autoajuste de anchos en todas las hojas
    for ws in wb.worksheets:
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                val_str = str(cell.value or "")
                max_len = max(max_len, len(val_str))
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


# ==========================================================
# 3. GENERADOR DE DOCUMENTOS PDF (.PDF)
# ==========================================================
def generar_reporte_pdf(sistema_data: Dict[str, Any]) -> io.BytesIO:
    """Genera un reporte PDF con diseño formal y limpio usando ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1, # Center
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=12
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=10,
        spaceAfter=6
    )

    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )

    cell_header = ParagraphStyle(
        'TableHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1
    )

    story = []

    # Encabezado
    story.append(Paragraph("BIBLIOTECA CALIXO", title_style))
    fecha_str = datetime.now().strftime("%d/%m/%Y %I:%M %p")
    story.append(Paragraph(f"Reporte General del Sistema | Emitido: {fecha_str}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceAfter=10))

    # Estadísticas resumen
    stats = sistema_data.get("estadisticas", {})
    stats_data = [
        [
            Paragraph("<b>Total Libros:</b> " + str(stats.get("total_libros", 0)), cell_style),
            Paragraph("<b>Total Clientes:</b> " + str(stats.get("total_clientes", 0)), cell_style),
            Paragraph("<b>Total Ventas:</b> " + f"Lps. {stats.get('total_ingresos_ventas', 0):,.2f}", cell_style),
            Paragraph("<b>Préstamos Activos:</b> " + str(stats.get("prestamos_activos", 0)), cell_style)
        ]
    ]
    t_stats = Table(stats_data, colWidths=[135, 135, 135, 135])
    t_stats.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))
    story.append(t_stats)
    story.append(Spacer(1, 10))

    # 1. Catálogo
    story.append(Paragraph("1. Catálogo de Libros Registrados", section_style))
    libros = sistema_data.get("libros", [])
    data_lib = [[
        Paragraph("ISBN", cell_header),
        Paragraph("Título", cell_header),
        Paragraph("Autor", cell_header),
        Paragraph("Género", cell_header),
        Paragraph("P. Venta", cell_header),
        Paragraph("P. Préstamo", cell_header),
        Paragraph("Stock", cell_header)
    ]]
    for l in libros:
        data_lib.append([
            Paragraph(str(l.get("isbn")), cell_style),
            Paragraph(str(l.get("titulo")), cell_style),
            Paragraph(str(l.get("autor")), cell_style),
            Paragraph(str(l.get("genero")), cell_style),
            Paragraph(f"Lps. {l.get('precio_venta',0):.2f}", cell_style),
            Paragraph(f"Lps. {l.get('precio_prestamo',0):.2f}", cell_style),
            Paragraph(str(l.get("stock")), cell_style)
        ])
    t_lib = Table(data_lib, colWidths=[55, 130, 110, 85, 60, 60, 40])
    t_lib.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F766E')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (4, 1), (6, -1), 'RIGHT'),
        ('ALIGN', (6, 1), (6, -1), 'CENTER')
    ]))
    story.append(t_lib)
    story.append(Spacer(1, 10))

    # 2. Ventas
    story.append(Paragraph("2. Registro Histórico de Ventas", section_style))
    ventas = sistema_data.get("ventas", [])
    data_ven = [[
        Paragraph("ID", cell_header),
        Paragraph("Fecha", cell_header),
        Paragraph("Cliente", cell_header),
        Paragraph("Libro", cell_header),
        Paragraph("Cantidad", cell_header),
        Paragraph("Total Cobrado", cell_header)
    ]]
    for v in ventas:
        data_ven.append([
            Paragraph(str(v.get("id_venta")), cell_style),
            Paragraph(str(v.get("fecha")), cell_style),
            Paragraph(str(v.get("cliente")), cell_style),
            Paragraph(str(v.get("libro")), cell_style),
            Paragraph(str(v.get("cantidad")), cell_style),
            Paragraph(f"Lps. {v.get('total',0):.2f}", cell_style)
        ])
    t_ven = Table(data_ven, colWidths=[35, 60, 150, 160, 45, 90])
    t_ven.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ALIGN', (4, 1), (5, -1), 'RIGHT')
    ]))
    story.append(t_ven)
    story.append(Spacer(1, 10))

    # 3. Préstamos
    story.append(Paragraph("3. Control de Préstamos", section_style))
    prestamos = sistema_data.get("prestamos", [])
    data_pres = [[
        Paragraph("ID", cell_header),
        Paragraph("F. Salida", cell_header),
        Paragraph("F. Límite", cell_header),
        Paragraph("Cliente", cell_header),
        Paragraph("Libro", cell_header),
        Paragraph("¿Devuelto?", cell_header)
    ]]
    for p in prestamos:
        data_pres.append([
            Paragraph(str(p.get("id_prestamo")), cell_style),
            Paragraph(str(p.get("fecha_prestamo")), cell_style),
            Paragraph(str(p.get("fecha_devolucion")), cell_style),
            Paragraph(str(p.get("cliente")), cell_style),
            Paragraph(str(p.get("libro")), cell_style),
            Paragraph(str(p.get("devuelto")), cell_style)
        ])
    t_pres = Table(data_pres, colWidths=[35, 60, 60, 150, 165, 70])
    t_pres.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7C3AED')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ALIGN', (5, 1), (5, -1), 'CENTER')
    ]))
    story.append(t_pres)

    doc.build(story)
    buffer.seek(0)
    return buffer
