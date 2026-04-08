import React from 'react';
import { Mic, FileAudio, Settings, Brain, Zap } from 'lucide-react';
import { TranscriptionProvider } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
  currentProvider: TranscriptionProvider;
  onProviderChange: (provider: TranscriptionProvider) => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, currentProvider, onProviderChange }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Mic size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">TranscreveAI</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {currentProvider === 'GEMINI' ? 'Gemini 2.5 Flash' : 'Groq Whisper V3'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Provider Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => onProviderChange('GEMINI')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentProvider === 'GEMINI' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Usar Google Gemini"
            >
              <Brain size={14} />
              <span className="hidden xs:inline">Gemini</span>
            </button>
            <button 
              onClick={() => onProviderChange('GROQ')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentProvider === 'GROQ' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Usar Groq Whisper"
            >
              <Zap size={14} />
              <span className="hidden xs:inline">Groq</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          
          <div className="flex items-center gap-1 sm:gap-4">
            <button className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium">
              <FileAudio size={18} />
              <span>Histórico</span>
            </button>
            <button 
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-50 transition-colors"
              title="Configurar API Keys"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;