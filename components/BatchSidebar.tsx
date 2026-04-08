import React from 'react';
import { BatchItem } from '../types';
import { FileAudio, CheckCircle, AlertCircle, Loader2, Play, Clock, Brain, Zap } from 'lucide-react';
import { formatFileSize } from '../utils/fileHelpers';

interface BatchSidebarProps {
  items: BatchItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearCompleted: () => void;
}

const BatchSidebar: React.FC<BatchSidebarProps> = ({ items, selectedId, onSelect, onClearCompleted }) => {
  const completedCount = items.filter(i => i.status === 'COMPLETED').length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 flex justify-between items-center">
          Fila de Arquivos
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
            {completedCount}/{totalCount}
          </span>
        </h2>
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 flex items-start gap-3
              ${selectedId === item.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}
            `}
          >
            <div className={`mt-0.5 min-w-[20px]
              ${item.status === 'COMPLETED' ? 'text-green-500' : 
                item.status === 'ERROR' ? 'text-red-500' : 
                item.status === 'PROCESSING' ? 'text-indigo-500' : 'text-slate-300'}
            `}>
              {item.status === 'COMPLETED' && <CheckCircle size={20} />}
              {item.status === 'ERROR' && <AlertCircle size={20} />}
              {item.status === 'PROCESSING' && <Loader2 size={20} className="animate-spin" />}
              {item.status === 'PENDING' && <Clock size={20} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <p className={`text-sm font-medium truncate ${selectedId === item.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {item.file.name}
                </p>
                <div className="text-slate-400">
                  {item.provider === 'GEMINI' ? <Brain size={12} /> : <Zap size={12} />}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-400">
                  {formatFileSize(item.originalSize)}
                </p>
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  {item.status === 'PROCESSING' ? 'Transcrevendo...' : 
                   item.status === 'PENDING' ? 'Aguardando' : 
                   item.status === 'ERROR' ? 'Erro' : 'Pronto'}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={onClearCompleted}
          className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Novo Lote
        </button>
      </div>
    </div>
  );
};

export default BatchSidebar;