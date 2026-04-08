export enum AppStatus {
  IDLE = 'IDLE',
  BATCH_PROCESSING = 'BATCH_PROCESSING',
}

export type TranscriptionProvider = 'GROQ';

export type BatchItemStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

export interface TranscriptionData {
  text: string;
  fileName: string;
  date: string;
  model: string;
  provider: TranscriptionProvider;
}

export interface BatchItem {
  id: string;
  file: File;
  status: BatchItemStatus;
  originalSize: number;
  transcription?: TranscriptionData;
  error?: string;
  progress?: number;
  provider: TranscriptionProvider;
}

export interface FileData {
  name: string;
  type: string;
  size: number;
  base64: string;
}