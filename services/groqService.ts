/**
 * Transcribes audio or video file using Groq's Whisper API.
 * @param file The File object from the browser
 * @param onProgress Callback to report progress percentage (0-100)
 * @param userApiKey Optional custom API key provided by the user
 * @returns The transcribed text
 */
export const transcribeWithGroq = async (file: File, onProgress?: (percent: number) => void, userApiKey?: string): Promise<string> => {
  try {
    onProgress?.(10);

    const formData = new FormData();
    formData.append('file', file);
    if (userApiKey) formData.append('apiKey', userApiKey);

    onProgress?.(30);

    const response = await fetch('/api/transcribe/groq', {
      method: 'POST',
      body: formData
    });

    onProgress?.(70);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro Groq: ${response.statusText}`);
    }

    const data = await response.json();
    onProgress?.(100);

    return data.text;
  } catch (error: any) {
    console.error("Groq Service Error:", error);
    throw error;
  }
};
