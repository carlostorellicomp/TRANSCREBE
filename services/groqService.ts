/**
 * Transcribes audio or video file using Groq's Whisper API.
 * @param file The File object from the browser
 * @param onProgress Callback to report progress percentage (0-100)
 * @param userApiKey Optional custom API key provided by the user
 * @returns The transcribed text
 */
export const transcribeWithGroq = async (file: File, onProgress?: (percent: number) => void, userApiKey?: string): Promise<string> => {
  try {
    const apiKey = userApiKey || process.env.GROQ_API_KEY;
    
    if (!apiKey) {
        throw new Error("Chave da API Groq não encontrada. Por favor, configure sua chave nas configurações.");
    }

    onProgress?.(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');
    formData.append('language', 'pt'); // Default to Portuguese as requested by user context

    onProgress?.(30);

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    onProgress?.(70);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error:", errorData);
      
      if (response.status === 429) {
        throw new Error("429: Limite de cota do Groq atingido.");
      }
      
      throw new Error(errorData.error?.message || `Erro na API Groq: ${response.statusText}`);
    }

    const data = await response.json();
    onProgress?.(100);

    if (data.text) {
      return data.text;
    } else {
      throw new Error("Não foi possível gerar a transcrição com Groq. Resposta vazia.");
    }

  } catch (error: any) {
    console.error("Groq Transcription Error:", error);
    const msg = error.message || "Falha ao conectar com o serviço de transcrição Groq.";
    throw new Error(msg);
  }
};
