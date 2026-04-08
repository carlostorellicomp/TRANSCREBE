import React from 'react';
import { Mic, FileAudio, Settings, Zap } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
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
              Powered by Groq Whisper V3
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-1 sm:gap-4">
            <button className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium">
              <FileAudio size={18} />
              <span>Histórico</span>
            </button>
            <button 
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-50 transition-colors"
              title="Configurar API Key"
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