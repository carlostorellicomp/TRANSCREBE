import React, { useRef } from 'react';
import { UploadCloud, FileVideo, Music, Layers } from 'lucide-react';

interface UploadAreaProps {
  onFilesSelect: (files: File[]) => void;
  isLoading: boolean;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('audio/') || f.type.startsWith('video/'));
    
    if (validFiles.length === 0) {
      alert('Por favor, envie apenas arquivos de áudio ou vídeo.');
      return;
    }

    if (validFiles.length > 50) {
      alert('O limite é de 50 arquivos por vez.');
      onFilesSelect(validFiles.slice(0, 50));
    } else {
      onFilesSelect(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className={`
        border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer relative overflow-hidden
        ${isLoading 
          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed' 
          : 'border-indigo-200 bg-indigo-50/30 hover:border-indigo-400 hover:bg-indigo-50'
        }
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => !isLoading && fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="audio/*,video/*"
        multiple // Habilita seleção múltipla
      />
      
      <div className="flex justify-center mb-4 relative z-10">
        <div className="bg-indigo-100 p-4 rounded-full text-indigo-600 shadow-sm">
          <UploadCloud size={40} />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-2 relative z-10">
        Selecione até 50 arquivos
      </h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto relative z-10">
        Arraste e solte seus arquivos aqui ou clique para navegar.
        <br/><span className="text-xs text-slate-400">(MP3, MP4, WAV, M4A - Máx 3GB/arquivo)</span>
      </p>
      
      <div className="flex justify-center gap-6 text-xs text-slate-400 uppercase tracking-wider font-semibold relative z-10">
        <div className="flex items-center gap-1">
          <Music size={14} /> Áudio
        </div>
        <div className="flex items-center gap-1">
          <FileVideo size={14} /> Vídeo
        </div>
        <div className="flex items-center gap-1">
          <Layers size={14} /> Lote 50
        </div>
      </div>
    </div>
  );
};

export default UploadArea;