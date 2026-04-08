import React, { useState, useEffect } from 'react';
import { Key, Save, X, ExternalLink, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: { groq: string }) => void;
  currentKeys: { groq: string | null };
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKeys }) => {
  const [groqKey, setGroqKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGroqKey(currentKeys.groq || '');
    }
  }, [isOpen, currentKeys]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      groq: groqKey.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold">
            <Key size={20} />
            <span>Configurar API Key</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Configure sua chave de API do Groq para evitar limites de cota e ter maior velocidade de processamento.
          </p>

          {/* Groq Key */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
              <span>Groq API Key (Whisper)</span>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-600 hover:underline flex items-center gap-1 normal-case font-medium"
              >
                Obter chave <ExternalLink size={10} />
              </a>
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
            />
            {currentKeys.groq && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-green-600">
                <Check size={10} /> <span>Ativa</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Save size={16} />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;