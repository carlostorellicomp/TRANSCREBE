import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { fileToBase64 } from "../utils/fileHelpers";

// Constants
const MAX_INLINE_SIZE = 18 * 1024 * 1024; // ~18MB safe limit for inline base64
const MODEL_NAME = 'gemini-2.5-flash';

// Helper for Exponential Backoff Retry
const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delayMs = 4000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // Check for Resource Exhausted (429) or Server Errors (5xx)
    const isQuotaError = error.message?.includes('429') || error.message?.includes('Resource has been exhausted') || error.status === 'RESOURCE_EXHAUSTED';
    const isServerError = error.message?.includes('500') || error.message?.includes('503');

    if ((isQuotaError || isServerError) && retries > 0) {
      console.warn(`Retrying operation due to error: ${error.message}. Attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return retryOperation(operation, retries - 1, delayMs * 2); // Exponential backoff
    }
    throw error;
  }
};

/**
 * Transcribes audio or video file using Gemini 2.5 Flash.
 * Automatically handles large files by uploading them to the Files API if needed.
 * @param file The File object from the browser
 * @param onProgress Callback to report progress percentage (0-100)
 * @param userApiKey Optional custom API key provided by the user
 * @returns The transcribed text
 */
export const transcribeMedia = async (file: File, onProgress?: (percent: number) => void, userApiKey?: string): Promise<string> => {
  try {
    // Priority: User Provided Key > Environment Variable Key
    const apiKey = userApiKey || process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error("Chave da API não encontrada. Por favor, configure sua chave nas configurações.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    let contentPart;

    // Report Start
    onProgress?.(5);

    // Strategy: Check file size to decide method
    if (file.size < MAX_INLINE_SIZE) {
      onProgress?.(20);
      // METHOD 1: Inline Base64 (Faster for small files, no upload wait)
      const base64Data = await fileToBase64(file);
      onProgress?.(40);
      
      // Clean base64 string if it contains headers
      const cleanBase64 = base64Data.includes('base64,') 
        ? base64Data.split('base64,')[1] 
        : base64Data;
        
      contentPart = {
        inlineData: {
          mimeType: file.type,
          data: cleanBase64
        }
      };
    } else {
      // METHOD 2: Files API (For large files up to 2GB/20GB)
      onProgress?.(10);
      
      // Upload the file with Retry
      const uploadResult = await retryOperation(() => ai.files.upload({
        file: file,
        config: { 
          displayName: file.name,
          mimeType: file.type 
        }
      }));

      onProgress?.(30);

      // Handle response structure
      // @ts-ignore
      let remoteFile = uploadResult.file || uploadResult;
      
      if (!remoteFile) {
        throw new Error("Falha ao iniciar upload. Resposta inválida da API.");
      }

      // Poll until the file is active
      let fileStatus = remoteFile.state;
      let progressCounter = 30;
      
      while (fileStatus === 'PROCESSING') {
        // Increment progress artificially while processing to give feedback
        if (progressCounter < 80) {
            progressCounter += 5;
            onProgress?.(progressCounter);
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
        
        try {
            const getResult = await retryOperation(() => ai.files.get({ name: remoteFile.name }));
            // @ts-ignore
            remoteFile = getResult.file || getResult;
            fileStatus = remoteFile.state;
        } catch (pollError) {
            console.error("Polling error:", pollError);
            throw pollError;
        }
        
        if (fileStatus === 'FAILED') {
          throw new Error("O processamento do arquivo falhou nos servidores do Google.");
        }
      }

      contentPart = {
        fileData: {
          fileUri: remoteFile.uri,
          mimeType: remoteFile.mimeType
        }
      };
    }

    onProgress?.(85);

    // Generate Content with Retry
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          contentPart,
          {
            text: `
            Atue como um transcritor profissional experiente. 
            Sua tarefa é transcrever o arquivo de áudio/vídeo fornecido para Português (ou o idioma original, se for diferente).
            
            Diretrizes:
            1. Transcreva com precisão, corrigindo gagueiras leves ou hesitações irrelevantes (limpeza "verbatim").
            2. Se houver múltiplos falantes, tente identificá-los como "Falante 1:", "Falante 2:", etc., se possível.
            3. Organize o texto em parágrafos claros para facilitar a leitura.
            4. Não adicione nenhum texto introdutório ou conclusivo (como "Aqui está a transcrição"). Apenas forneça a transcrição pura.
            5. Se o áudio for muito longo, forneça um resumo detalhado no final, separado por "--- RESUMO ---".
            `
          }
        ]
      },
      config: {
        temperature: 0.2, // Low temperature for higher accuracy/determinism
      }
    }));

    onProgress?.(100);

    if (response.text) {
      return response.text;
    } else {
      throw new Error("Não foi possível gerar a transcrição. Resposta vazia da IA.");
    }

  } catch (error: any) {
    console.error("Gemini Transcription Error:", error);
    const msg = error.message || "Falha ao conectar com o serviço de transcrição.";
    throw new Error(msg);
  }
};