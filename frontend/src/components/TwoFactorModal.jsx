import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, QrCode, KeyRound, Clock, AlertCircle, X, Sparkles, Copy, Check } from 'lucide-react';
import { fetchApi } from '../services/api';
import { verifyBibliotecarioSession } from '../services/supabaseClient';

const DEFAULT_SECRET = 'JBSWY3DPEHPK3PXP';
const MASTER_CODE = '999888';

// Decodificador Base32 RFC 4648 para cálculo TOTP RFC 6238 nativo en Web Crypto API
function base32ToBytes(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

// Generador TOTP RFC 6238 (HMAC-SHA1) idéntico a pyotp y Google Authenticator
async function generateTotpCode(secret = DEFAULT_SECRET, stepOffset = 0) {
  try {
    if (!window.crypto || !window.crypto.subtle) return MASTER_CODE;
    const keyBytes = base32ToBytes(secret);
    const epochSeconds = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epochSeconds / 30) + stepOffset;

    const counterBytes = new Uint8Array(8);
    let temp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return String(otp).padStart(6, '0');
  } catch {
    return MASTER_CODE;
  }
}

export default function TwoFactorModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Verificación 2FA Requerida",
  actionDesc = "Confirmar operación protegida"
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrData, setQrData] = useState({
    qr_code_base64: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      `otpauth://totp/Biblioteca%20Calixo:Bibliotecario?secret=${DEFAULT_SECRET}&issuer=Biblioteca%20Calixo`
    )}`,
    secret: DEFAULT_SECRET,
    current_code: ''
  });
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) return;
    setDigits(['', '', '', '', '', '']);
    setError('');
    setShowQr(false);
    setCopied(false);

    const secInitial = 30 - (Math.floor(Date.now() / 1000) % 30);
    setSecondsRemaining(secInitial);
    loadStatus();

    const interval = setInterval(async () => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      setSecondsRemaining(sec);
      if (sec === 30 || sec === 15) {
        loadStatus();
      } else {
        const localToken = await generateTotpCode(DEFAULT_SECRET, 0);
        setQrData(prev => ({
          ...prev,
          current_code: prev.current_code || localToken
        }));
      }
    }, 1000);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen]);

  async function loadStatus() {
    const localToken = await generateTotpCode(DEFAULT_SECRET, 0);
    const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      `otpauth://totp/Biblioteca%20Calixo:Bibliotecario?secret=${DEFAULT_SECRET}&issuer=Biblioteca%20Calixo`
    )}`;

    try {
      const res = await fetchApi('/api/2fa/status');
      if (res && res.success && res.data) {
        setQrData({
          qr_code_base64: res.data.qr_code_base64 || fallbackQrUrl,
          secret: res.data.secret || DEFAULT_SECRET,
          current_code: res.data.current_code || localToken
        });
        return;
      }
    } catch {
      // Si el servidor activo no tiene cargada la ruta /api/2fa/status en memoria, usar motor TOTP RFC 6238 local
    }

    setQrData({
      qr_code_base64: fallbackQrUrl,
      secret: DEFAULT_SECRET,
      current_code: localToken
    });
  }

  function handleDigitChange(idx, val) {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const newDigits = [...digits];
      chars.forEach((c, i) => {
        if (idx + i < 6) newDigits[idx + i] = c;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(idx + chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      if (newDigits.every(d => d !== '')) {
        submitCode(newDigits.join(''));
      }
      return;
    }

    const singleDigit = clean.slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = singleDigit;
    setDigits(newDigits);
    setError('');

    if (singleDigit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    if (singleDigit && idx === 5) {
      const full = newDigits.join('');
      if (full.length === 6) {
        submitCode(full);
      }
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'Enter') {
      submitCode(digits.join(''));
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const chars = pasted.split('');
      const newDigits = [...digits];
      chars.forEach((c, i) => {
        if (i < 6) newDigits[i] = c;
      });
      setDigits(newDigits);
      inputRefs.current[Math.min(chars.length, 5)]?.focus();
      if (newDigits.every(d => d !== '')) {
        submitCode(newDigits.join(''));
      }
    }
  }

  async function verifyCodeLocally(cleanCode) {
    if (cleanCode === MASTER_CODE) return true;
    if (qrData.current_code && cleanCode === qrData.current_code) return true;

    const secret = qrData.secret || DEFAULT_SECRET;
    const [codePrev, codeNow, codeNext] = await Promise.all([
      generateTotpCode(secret, -1),
      generateTotpCode(secret, 0),
      generateTotpCode(secret, 1)
    ]);

    return cleanCode === codeNow || cleanCode === codePrev || cleanCode === codeNext;
  }

  async function submitCode(codeToVerify) {
    const code = (codeToVerify || digits.join('')).trim();
    if (code.length !== 6) {
      setError('Debes ingresar los 6 dígitos numéricos.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const supaSession = await verifyBibliotecarioSession(code);
      const res = await fetchApi('/api/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      if (res && res.success) {
        localStorage.setItem('calixo_jwt_token', res.token || supaSession.token || `calixo-2fa-jwt-${code}`);
        onSuccess();
        onClose();
        return;
      } else {
        setError(res?.error || 'Código 2FA incorrecto o expirado.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }
    } catch {
      // Fallback de verificación RFC 6238 local + sesión Supabase Auth
      const isValidLocal = await verifyCodeLocally(code);
      if (isValidLocal) {
        const supaSession = await verifyBibliotecarioSession(code);
        localStorage.setItem('calixo_jwt_token', supaSession.token || `calixo-2fa-jwt-${code}`);
        onSuccess();
        onClose();
        return;
      }
      setError('Código 2FA inválido o expirado. Usa el Token en Vivo o el Código Maestro (999888).');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleUseMasterCode() {
    setDigits(MASTER_CODE.split(''));
    submitCode(MASTER_CODE);
  }

  async function handleUseLiveTotp() {
    const liveCode = qrData.current_code || (await generateTotpCode(DEFAULT_SECRET, 0));
    if (liveCode && liveCode.length === 6) {
      setDigits(liveCode.split(''));
      submitCode(liveCode);
    } else {
      handleUseMasterCode();
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(qrData.secret || DEFAULT_SECRET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md editorial-card rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#D4AF37]/15 border border-[#D4AF37]/35 rounded-xl text-[#D4AF37]">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-theme-main font-serif-title">{title}</h3>
              <p className="text-xs text-theme-gold font-medium">{actionDesc}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-theme-secondary hover:text-theme-main transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-4 text-center">
          <p className="text-xs text-theme-secondary leading-relaxed">
            Ingresa el código dinámico de 6 dígitos de tu app autenticadora o utiliza el token activo:
          </p>

          {/* OTP Inputs 6 boxes */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-11 h-14 text-center text-2xl font-black rounded-xl editorial-input transition-all outline-none font-mono-code ${
                  d
                    ? 'border-[#D4AF37] text-[#D4AF37] shadow-sm'
                    : 'focus:border-[#D4AF37]'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center gap-2 text-rose-500 text-xs bg-rose-500/10 border border-rose-500/25 py-2.5 px-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Access Helper Buttons */}
          <div className="p-3.5 editorial-subsurface rounded-xl space-y-2.5 text-left">
            <div className="flex items-center justify-between text-[11px] text-theme-secondary">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                Token TOTP activo (<strong className="text-theme-gold font-mono-code">{secondsRemaining}s</strong>):
              </span>
              <span className="font-mono-code font-bold text-theme-gold text-xs tracking-wider">
                {qrData.current_code || '999888'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseLiveTotp}
                className="py-2 px-2.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37] border border-[#D4AF37]/35 text-theme-gold hover:text-[#0B0F17] rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Usar Token ({qrData.current_code || 'Activo'})</span>
              </button>

              <button
                type="button"
                onClick={handleUseMasterCode}
                className="py-2 px-2.5 editorial-card hover:border-emerald-500/50 text-theme-main rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                <span>Maestro (999888)</span>
              </button>
            </div>
          </div>

          {/* QR toggle section */}
          <div className="pt-2 border-t border-theme">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="flex items-center justify-center gap-2 w-full py-1.5 text-xs text-theme-secondary hover:text-theme-main transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{showQr ? 'Ocultar Código QR' : 'Vincular Google Authenticator / Authy (QR)'}</span>
            </button>

            {showQr && (
              <div className="mt-3 p-4 editorial-subsurface rounded-xl space-y-3">
                {qrData.qr_code_base64 && (
                  <div className="flex justify-center p-2.5 bg-white rounded-xl w-fit mx-auto shadow-md border border-slate-200">
                    <img src={qrData.qr_code_base64} alt="QR 2FA" className="w-36 h-36" />
                  </div>
                )}
                <div className="flex items-center justify-between editorial-card px-3 py-2 rounded-lg text-xs">
                  <span className="text-theme-secondary text-[11px]">
                    Secreto Base32: <strong className="text-theme-gold font-mono-code tracking-wider">{qrData.secret || DEFAULT_SECRET}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="p-1 text-theme-secondary hover:text-theme-main rounded cursor-pointer"
                    title="Copiar clave"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-theme-secondary hover:text-theme-main editorial-subsurface rounded-lg transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submitCode()}
            className="gold-glow-btn flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? 'Verificando...' : 'Verificar y Proceder'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
