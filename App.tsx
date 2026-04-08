import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import ProcessingState from './components/ProcessingState';
import Editor from './components/Editor';
import BatchSidebar from './components/BatchSidebar';
import ApiKeyModal from './components/ApiKeyModal';
import { transcribeMedia } from './services/geminiService';
import { transcribeWithGroq } from './services/groqService';
import { BatchItem, TranscriptionProvider } from './types';
import { AlertCircle, ArrowLeft, RefreshCw, Timer, Brain, Zap } from 'lucide-react';

const MAX_CONCURRENT_UPLOADS = 1;

const App: React.FC = () => {
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCountdown, setPauseCountdown] = useState<number>(0);
  
  // API Key State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ gemini: string | null; groq: string | null }>({
    gemini: null,
    groq: null
  });
  const [currentProvider, setCurrentProvider] = useState<TranscriptionProvider>('GEMINI');

  // Load API Keys
  useEffect(() => {
    const savedGemini = localStorage.getItem('gemini_api_key');
    const savedGroq = localStorage.getItem('groq_api_key');
    const savedProvider = localStorage.getItem('preferred_provider') as TranscriptionProvider;
    
    setApiKeys({
      gemini: savedGemini,
      groq: savedGroq
    });
    
    if (savedProvider) setCurrentProvider(savedProvider);
  }, []);

  const handleSaveApiKeys = (keys: { gemini: string; groq: string }) => {
    localStorage.setItem('gemini_api_key', keys.gemini);
    localStorage.setItem('groq_api_key', keys.groq);
    
    setApiKeys(keys);
    
    // UX: Se estivermos pausados devido a erro de cota e o usuário fornecer novas chaves,
    // removemos a pausa imediatamente.
    if (isPaused) {
        setIsPaused(false);
        setGlobalError(null);
        setPauseCountdown(0);
    }
  };

  const handleProviderChange = (provider: TranscriptionProvider) => {
    setCurrentProvider(provider);
    localStorage.setItem('preferred_provider', provider);
  };

  const updateItemStatus = useCallback((id: string, status: BatchItem['status'], result?: any, errorMsg?: string, progress?: number) => {
    setBatchQueue(prev => prev.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          status, 
          transcription: result,
          error: errorMsg,
          progress: progress !== undefined ? progress : item.progress
        };
      }
      return item;
    }));
  }, []);

  const processItem = useCallback(async (item: BatchItem) => {
    updateItemStatus(item.id, 'PROCESSING', undefined, undefined, 0);
    if (!selectedItemId) setSelectedItemId(item.id);

    try {
      let text = '';
      const provider = item.provider;
      
      if (provider === 'GEMINI') {
        text = await transcribeMedia(
          item.file, 
          (percent) => updateItemStatus(item.id, 'PROCESSING', undefined, undefined, percent),
          apiKeys.gemini || undefined
        );
      } else {
        text = await transcribeWithGroq(
          item.file,
          (percent) => updateItemStatus(item.id, 'PROCESSING', undefined, undefined, percent),
          apiKeys.groq || undefined
        );
      }
      
      const transcriptionResult = {
        text: text,
        fileName: item.file.name,
        date: new Date().toLocaleDateString('pt-BR'),
        model: provider === 'GEMINI' ? 'Gemini 2.5 Flash' : 'Groq Whisper V3',
        provider: provider
      };

      updateItemStatus(item.id, 'COMPLETED', transcriptionResult, undefined, 100);
      
    } catch (error: any) {
      console.error(`Error processing ${item.file.name}:`, error);
      const errorMsg = error.message || "Erro desconhecido";
      
      // Detect Quota Error (429)
      const isQuotaError = errorMsg.includes('429') || 
                           errorMsg.includes('quota') || 
                           errorMsg.includes('exhausted') ||
                           errorMsg.includes('Resource has been exhausted');

      if (isQuotaError) {
        // Smart Pause Logic
        updateItemStatus(item.id, 'PENDING', undefined, undefined, 0); // Devolve para a fila
        setIsPaused(true);
        
        const waitTimeSeconds = 30;
        setPauseCountdown(waitTimeSeconds);
        setGlobalError(`Limite de cota atingido. Pausando fila por ${waitTimeSeconds}s...`);

        // Timer regressivo para auto-retomada
        const timer = setInterval(() => {
            setPauseCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Timeout para liberar a fila
        setTimeout(() => {
            // Verifica se ainda está pausado (o usuário pode ter destravado manualmente trocando a key)
            setIsPaused(prevIsPaused => {
                if (prevIsPaused) {
                    setGlobalError(null);
                    return false;
                }
                return prevIsPaused;
            });
            clearInterval(timer);
        }, waitTimeSeconds * 1000);

      } else {
        // Erro fatal (não é cota)
        updateItemStatus(item.id, 'ERROR', undefined, errorMsg, 0);
      }
    }
  }, [updateItemStatus, selectedItemId, apiKeys]);

  // Queue Management Effect
  useEffect(() => {
    if (isPaused) return;

    const processingCount = batchQueue.filter(item => item.status === 'PROCESSING').length;
    const pendingItems = batchQueue.filter(item => item.status === 'PENDING');

    if (processingCount < MAX_CONCURRENT_UPLOADS && pendingItems.length > 0) {
      processItem(pendingItems[0]);
    }
  }, [batchQueue, processItem, isPaused]);

  const handleFilesSelect = (files: File[]) => {
    const newItems: BatchItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      status: 'PENDING',
      originalSize: file.size,
      progress: 0,
      provider: currentProvider
    }));

    setBatchQueue(prev => [...prev, ...newItems]);
    if (!selectedItemId && newItems.length > 0) setSelectedItemId(newItems[0].id);
    
    // Se adicionar arquivos e não estiver pausado, limpa erros residuais
    if (!isPaused) setGlobalError(null);
  };

  const resetApp = () => {
    setBatchQueue([]);
    setSelectedItemId(null);
    setGlobalError(null);
    setIsPaused(false);
    setPauseCountdown(0);
  };

  const retryItem = (id: string) => {
    updateItemStatus(id, 'PENDING', undefined, undefined, 0);
    // UX: Se o usuário clicar manualmente em tentar novamente, forçamos a saída do modo de pausa
    if (isPaused) {
        setIsPaused(false);
        setGlobalError(null);
        setPauseCountdown(0);
    }
  };

  const selectedItem = batchQueue.find(i => i.id === selectedItemId);
  const hasItems = batchQueue.length > 0;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        currentProvider={currentProvider}
        onProviderChange={handleProviderChange}
      />
      
      <ApiKeyModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveApiKeys}
        currentKeys={apiKeys}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {/* Global Alert */}
        {globalError && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-lg flex items-center gap-3 shadow-lg border transition-all duration-300
            ${isPaused ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-700'}
          `}>
            {isPaused ? <Timer className="animate-pulse" size={20} /> : <AlertCircle size={20} />}
            <div>
                <p className="font-medium">{isPaused ? 'Pausa para Recuperação de Cota' : 'Aviso'}</p>
                <p className="text-sm opacity-90">{globalError}</p>
            </div>
            {!isPaused && (
                <button onClick={() => setGlobalError(null)} className="ml-4 text-sm font-bold hover:underline">
                  Fechar
                </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasItems && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-3xl w-full animate-in fade-in zoom-in duration-500">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                  Transforme Vídeos em Texto
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Carregue seus arquivos para transcrição automática.
                  <br/>
                  <span className="text-sm opacity-75">Utilize sua própria chave API (Gemini ou Groq) para maior velocidade e limites.</span>
                </p>
                {(!apiKeys.gemini && !apiKeys.groq) && (
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="mt-6 px-5 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors flex items-center gap-2 mx-auto"
                    >
                        Configurar Chave API Agora
                    </button>
                )}
              </div>
              <UploadArea onFilesSelect={handleFilesSelect} isLoading={false} />
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        {hasItems && (
          <div className="w-full flex h-full">
            <div className={`${selectedItemId ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
               <BatchSidebar 
                items={batchQueue} 
                selectedId={selectedItemId} 
                onSelect={setSelectedItemId}
                onClearCompleted={resetApp}
              />
            </div>

            <div className={`${!selectedItemId ? 'hidden md:flex' : 'flex'} flex-1 bg-slate-100 flex-col h-full relative`}>
              <div className="md:hidden bg-white border-b border-slate-200 p-2">
                <button onClick={() => setSelectedItemId(null)} className="flex items-center gap-2 text-slate-600 px-3 py-2">
                  <ArrowLeft size={18} /> Voltar
                </button>
              </div>

              {selectedItem ? (
                <div className="flex-1 h-full overflow-hidden p-0 md:p-6">
                  <div className="h-full w-full bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 overflow-hidden">
                    {selectedItem.status === 'COMPLETED' && selectedItem.transcription ? (
                      <Editor data={selectedItem.transcription} />
                    ) : selectedItem.status === 'ERROR' ? (
                       <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-300">
                         <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4">
                           <AlertCircle size={40} />
                         </div>
                         <h3 className="text-xl font-bold text-slate-800 mb-2">Falha na Transcrição</h3>
                         <p className="text-slate-500 mb-6 max-w-lg break-words text-xs font-mono bg-slate-50 p-3 rounded border border-slate-200">
                            {selectedItem.error}
                         </p>
                         <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={() => retryItem(selectedItem.id)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} /> Tentar Novamente
                            </button>
                            <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Trocar API Key
                            </button>
                         </div>
                       </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8">
                         <ProcessingState 
                            fileName={selectedItem.file.name} 
                            statusText={
                                isPaused 
                                ? `Pausado: recuperando cota da API (${pauseCountdown}s)...` 
                                : selectedItem.status === 'PENDING' 
                                    ? "Aguardando na fila..." 
                                    : "IA analisando e transcrevendo..."
                            }
                            progress={selectedItem.progress || 0}
                         />
                         {isPaused && (
                            <div className="mt-6 flex flex-col items-center gap-2 animate-pulse">
                                <p className="text-sm text-amber-600 font-medium">A cota gratuita pode ter sido atingida.</p>
                                <button 
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="text-xs text-indigo-600 underline hover:text-indigo-800"
                                >
                                    Usar chave personalizada para evitar isso
                                </button>
                            </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-400">
                  <p>Selecione um arquivo para ver os detalhes</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;