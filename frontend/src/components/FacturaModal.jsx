import React from 'react';
import { Printer, Download, X, CheckCircle2, QrCode } from 'lucide-react';

export default function FacturaModal({ isOpen, onClose, factura }) {
  if (!isOpen || !factura) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (factura.id_venta) {
      try {
        const res = await fetch(`/api/factura/pdf/${factura.id_venta}`, { method: 'HEAD' });
        if (res.ok) {
          window.open(`/api/factura/pdf/${factura.id_venta}`, '_blank');
          return;
        }
      } catch {
        // Fallback to print-to-PDF if endpoint is not active in memory
      }
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 my-8 border border-slate-300">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Factura Fiscal SAR Emitida</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Guardar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Factura Sheet (visible in screen and print) */}
        <div id="factura-imprimible" className="text-xs leading-relaxed space-y-4 text-slate-900">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 font-serif">BIBLIOTECA CALIXO S.A. DE C.V.</h2>
              <p className="text-slate-600 text-xs">RTN: 08011990123456 &bull; PBX: +504 2234-5678</p>
              <p className="text-slate-600 text-xs">Boulevard Morazán, Edificio Alejandría, Nivel 4</p>
              <p className="text-slate-600 text-xs">Tegucigalpa, M.D.C., Francisco Morazán, Honduras</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-amber-100 border border-amber-300 rounded text-amber-800 font-bold text-xs">
                FACTURA FISCAL SAR
              </span>
              <p className="text-sm font-black text-slate-900 mt-1 font-mono">{factura.numero_factura || 'FAC-001-001-01-00000001'}</p>
              <p className="text-slate-500 text-[10px]">Fecha de Emisión: {factura.fecha_emision || new Date().toLocaleDateString('es-HN')}</p>
            </div>
          </div>

          {/* CAI Details */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-sans">Código CAI Autorizado:</span>
              <span className="font-bold text-slate-800">{factura.cai || '3B4F9A-C87E12-4091A8-9B2100-881201-01'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-sans">Rango Autorizado / Fecha Límite:</span>
              <span className="text-slate-700">{factura.rango_autorizado || '001-001-01-00000001 al 001-001-01-00005000 (31/12/2026)'}</span>
            </div>
          </div>

          {/* Client Details */}
          <div className="border border-slate-200 rounded p-3 text-xs bg-slate-50/50">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-500 mb-1.5">Datos del Cliente Adquiriente</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 text-[10px] block">Nombre / Razón Social:</span>
                <span className="font-semibold text-slate-800">{factura.cliente?.nombre || 'Consumidor Final'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">RTN / DNI / ID:</span>
                <span className="font-semibold text-slate-800 font-mono">{factura.cliente?.id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Teléfono / Correo:</span>
                <span className="text-slate-700">{factura.cliente?.telefono || factura.cliente?.correo || '+504 2234-5678'}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3 text-center w-12">Cant.</th>
                  <th className="py-2 px-3">Descripción de la Obra</th>
                  <th className="py-2 px-3">ISBN / Código</th>
                  <th className="py-2 px-3 text-right">Precio Unitario</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">{factura.item?.cantidad || 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{factura.item?.libro || 'Libro Literario'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{factura.item?.isbn || '---'}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800">Lps. {Number(factura.item?.precio_unitario || 0).toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">Lps. {Number(factura.item?.subtotal || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Fiscal Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <div className="text-[11px] p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase">Monto Total en Letras:</span>
                <span className="font-semibold text-slate-800 italic">{factura.totales?.total_letras || 'LEMPIRAS EXACTOS'}</span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                {factura.qr_code_base64 ? (
                  <img src={factura.qr_code_base64} alt="QR Fiscal" className="w-16 h-16 border border-slate-300 p-1 rounded shrink-0" />
                ) : (
                  <div className="w-14 h-14 border border-slate-300 bg-slate-50 rounded flex items-center justify-center text-slate-700 shrink-0">
                    <QrCode className="w-9 h-9" />
                  </div>
                )}
                <div className="text-[10px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-700">Verificación Fiscal SAR Honduras</p>
                  <p>Comprobante válido conforme al Régimen de Facturación de la República de Honduras.</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-right text-xs border border-slate-200 p-3 rounded bg-slate-50">
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Importe Exento:</span>
                <span className="font-mono">Lps. {Number(factura.totales?.importe_exento || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Importe Gravado (15%):</span>
                <span className="font-mono">Lps. {Number(factura.totales?.importe_gravado_15 || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Descuentos y Rebajas:</span>
                <span className="font-mono">Lps. {Number(factura.totales?.descuento || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>I.S.V. (15%):</span>
                <span className="font-mono font-semibold text-slate-800">Lps. {Number(factura.totales?.isv_15 || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-300 font-bold text-sm text-slate-900">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono text-emerald-700">Lps. {Number(factura.totales?.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer SAR Disclaimer */}
          <div className="text-[9px] text-center text-slate-400 border-t border-slate-200 pt-3">
            "La factura es beneficio de todos, exíjala. Original: Cliente, Copia: Obligado Tributario."
          </div>

        </div>
      </div>
    </div>
  );
}
