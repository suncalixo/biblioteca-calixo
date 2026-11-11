import React, { useState } from 'react';
import { 
  FileDown, FileSpreadsheet, FileText, Download, 
  TrendingUp, BookOpen, ShoppingCart, Calendar
} from 'lucide-react';

export default function ReportsView({ stats = {}, librosCount = 0, ventasCount = 0, prestamosCount = 0 }) {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = (type, url, filename) => {
    setDownloading(type);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Principal Adaptable a Modo Claro / Oscuro */}
      <div className="editorial-card p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#D4AF37]/15 text-theme-gold border border-[#D4AF37]/30 font-mono-code">
            Auditoría & Balances Patrimoniales
          </span>
          <h2 className="font-serif-title text-2xl md:text-3xl font-bold text-theme-main mt-2.5">
            Centro de Reportes Oficiales & Auditoría
          </h2>
          <p className="text-xs text-theme-secondary mt-1.5 leading-relaxed">
            Generación y descarga de expedientes certificados con el sello de la Biblioteca de Alejandría. Exporta datos de inventario, circulación y arqueo de caja fiscal en PDF, Excel y Word.
          </p>
        </div>
      </div>

      {/* Tarjetas Estadísticas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="editorial-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-theme-secondary text-xs">
            <span>Obras Catalogadas</span>
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-bold text-theme-main font-mono-code mt-2">{librosCount}</div>
          <div className="text-[10px] text-emerald-500 font-medium mt-1">100% disponibles en sistema</div>
        </div>

        <div className="editorial-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-theme-secondary text-xs">
            <span>Préstamos Activos</span>
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-bold text-theme-main font-mono-code mt-2">{prestamosCount}</div>
          <div className="text-[10px] text-theme-secondary mt-1">Control de retorno automático</div>
        </div>

        <div className="editorial-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-theme-secondary text-xs">
            <span>Transacciones SAR</span>
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-theme-main font-mono-code mt-2">{ventasCount}</div>
          <div className="text-[10px] text-emerald-500 font-medium mt-1">Facturas con CAI e ISV 15%</div>
        </div>

        <div className="editorial-card p-4 rounded-xl">
          <div className="flex items-center justify-between text-theme-secondary text-xs">
            <span>Arqueo de Ventas</span>
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-bold text-emerald-500 font-mono-code mt-2">
            Lps. {(stats.total_ingresos_ventas || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-theme-secondary mt-1">Ingresos acumulados</div>
        </div>

      </div>

      {/* Reports Grid - PDF, Excel (XLSX), Word */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* PDF (.pdf) */}
        <div className="editorial-card p-6 rounded-2xl flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <FileDown className="w-6 h-6" />
            </div>
            <h3 className="font-serif-title text-lg font-bold text-theme-main">Dossier Auditoría PDF (.pdf)</h3>
            <p className="text-xs text-theme-secondary mt-2 leading-relaxed">
              Certificación digital de inventario de las obras y balances financieros de Alejandría, formateado formalmente para firma y archivo legal.
            </p>
          </div>
          <button
            onClick={() => handleDownload('pdf', '/api/export/pdf', 'Dossier_Auditoria_Biblioteca_Calixo.pdf')}
            disabled={downloading === 'pdf'}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 gold-glow-btn rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'pdf' ? 'Generando PDF...' : 'Descargar en PDF'}</span>
          </button>
        </div>

        {/* Excel (.xlsx) */}
        <div className="editorial-card p-6 rounded-2xl flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-serif-title text-lg font-bold text-theme-main">Libro Contable Excel (.xlsx)</h3>
            <p className="text-xs text-theme-secondary mt-2 leading-relaxed">
              Hojas de cálculo con pestañas independientes para Inventario de Libros, Préstamos, Ventas y Resumen de Flujo de Caja con fórmulas analíticas.
            </p>
          </div>
          <button
            onClick={() => handleDownload('excel', '/api/export/excel', 'Libro_Contable_Biblioteca_Calixo.xlsx')}
            disabled={downloading === 'excel'}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'excel' ? 'Generando Excel...' : 'Descargar en Excel'}</span>
          </button>
        </div>

        {/* Word (.docx) */}
        <div className="editorial-card p-6 rounded-2xl flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-serif-title text-lg font-bold text-theme-main">Documento Ejecutivo Word (.docx)</h3>
            <p className="text-xs text-theme-secondary mt-2 leading-relaxed">
              Expediente estructurado con membrete de Alejandría y tablas tabuladas de libros, lectores y préstamos para entrega académica formal.
            </p>
          </div>
          <button
            onClick={() => handleDownload('word', '/api/export/word', 'Reporte_Biblioteca_Calixo.docx')}
            disabled={downloading === 'word'}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'word' ? 'Generando Word...' : 'Descargar en Word'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
