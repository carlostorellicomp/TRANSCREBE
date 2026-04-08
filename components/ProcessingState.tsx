import React from 'react';
import { Loader2, FileAudio } from 'lucide-react';

interface ProcessingStateProps {
  fileName: string;
  statusText: string;
  progress?: number;
}

const ProcessingState: React.FC<ProcessingStateProps> = ({ fileName, statusText, progress = 0 }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <div className="w-20 h-20 bg-indigo-100 rounded-full"></div>
        </div>
        <div className="relative z-10 bg-white p-2 rounded-full shadow-sm border border-slate-100">
          <FileAudio size={32} className="text-indigo-600" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        Processando {fileName}
      </h3>
      <p className="text-slate-500 mb-6">{statusText}</p>
      
      <div className="w-full bg-slate-100 rounded-full h-2 max-w-md mx-auto overflow-hidden">
        <div 
            className={`bg-indigo-600 h-2 rounded-full transition-all duration-500 ${progress === 0 ? 'animate-progress origin-left w-full' : ''}`}
            style={{ width: progress > 0 ? `${progress}%` : undefined }}
        ></div>
      </div>
      
      {progress > 0 && (
        <p className="text-xs text-slate-400 mt-2 font-mono">{progress}% concluído</p>
      )}
      
      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(0.95); }
        }
        .animate-progress {
          animation: progress 15s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default ProcessingState;