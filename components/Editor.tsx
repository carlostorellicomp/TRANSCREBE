import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, FileCheck, RefreshCw } from 'lucide-react';
import { TranscriptionData } from '../types';
import { generatePDF, downloadTXT } from '../utils/fileHelpers';

interface EditorProps {
  data: TranscriptionData;
  // Removed onReset as it is handled by the sidebar now mostly, but kept optional if needed later
}

const Editor: React.FC<EditorProps> = ({ data }) => {
  const [text, setText] = useState(data.text);
  const [copied, setCopied] = useState(false);

  // Sync text when data changes (e.g. user selects a different file in sidebar)
  useEffect(() => {
    setText(data.text);
  }, [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    generatePDF({ ...data, text });
  };

  const handleDownloadTXT = () => {
    downloadTXT(data.fileName, text);
  };

  return (
    <div className="bg-white flex flex-col h-full min-h-[500px]">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
          <div className="bg-green-100 p-2 rounded-lg text-green-700 flex-shrink-0">
            <FileCheck size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Transcrição Concluída</h2>
            <p className="text-xs text-slate-500 truncate" title={data.fileName}>
              {data.fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all"
            title="Copiar texto"
          >
            {copied ? <span className="text-green-600 font-bold">Copiado!</span> : <Copy size={16} />}
          </button>
          
          <button 
            onClick={handleDownloadTXT}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">TXT</span>
          </button>

          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm hover:shadow transition-all whitespace-nowrap"
          >
            <Download size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-6 bg-slate-50 overflow-auto relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full p-8 bg-white rounded-lg shadow-sm border-none resize-none focus:ring-2 focus:ring-indigo-200 text-slate-700 leading-relaxed font-normal outline-none text-base sm:text-lg"
          spellCheck={false}
          placeholder="A transcrição aparecerá aqui..."
        />
      </div>
      
      {/* Stats Footer */}
      <div className="bg-white border-t border-slate-200 px-6 py-2 text-right">
         <span className="text-xs text-slate-400">
           {text.length} caracteres • {text.split(/\s+/).filter(Boolean).length} palavras
        </span>
      </div>
    </div>
  );
};

export default Editor;