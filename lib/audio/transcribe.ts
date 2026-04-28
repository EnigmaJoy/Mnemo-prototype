// Whisper-tiny via Transformers.js. Lazy-loaded so the model code never lands
// in the initial bundle - only fetched when the user actually records something.

const MODEL = 'Xenova/whisper-tiny';

type ProgressEvent = {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready';
  progress?: number;
  file?: string;
};

type AsrPipeline = (
  audio: Float32Array,
  options?: { language?: string; task?: string; chunk_length_s?: number; return_timestamps?: boolean },
) => Promise<{ text: string }>;

let pipelinePromise: Promise<AsrPipeline> | null = null;

async function getPipeline(
  onProgress?: (percent: number) => void,
): Promise<AsrPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const transformers = await import('@xenova/transformers');
      // Skip the local /models/... probe we never self-host weights, so
      // letting it 404 first just generates noise in the network panel.
      transformers.env.allowLocalModels = false;
      return (await transformers.pipeline(
        'automatic-speech-recognition',
        MODEL,
        {
          progress_callback: (e: ProgressEvent) => {
            if (e.status === 'progress' && typeof e.progress === 'number') {
              onProgress?.(Math.round(e.progress));
            }
          },
        },
      )) as unknown as AsrPipeline;
    })();
  }
  return pipelinePromise;
}

// Whisper expects 16kHz mono float32. We decode the recorder's native blob
// (typically WebM/Opus) via OfflineAudioContext to get exactly that.
async function blobToFloat32At16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const decoderCtx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await decoderCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await decoderCtx.close();
  }

  const targetRate = 16000;
  const targetLength = Math.ceil((decoded.duration * targetRate));
  const offline = new OfflineAudioContext(1, targetLength, targetRate);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

// Whisper.js expects English-language NAMES (not ISO codes) when a hint is given.
// Empty string / undefined means "auto-detect", safer default.
const WHISPER_LANGUAGE: Record<string, string> = {
  en: 'english',
  it: 'italian',
  de: 'german',
  fr: 'french',
  zh: 'chinese',
};

function whisperLanguage(locale: string): string | undefined {
  const base = locale.toLowerCase().split('-')[0];
  return WHISPER_LANGUAGE[base];
}

export async function transcribeBlob(
  blob: Blob,
  locale: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const audio = await blobToFloat32At16k(blob);
  const pipe = await getPipeline(onProgress);
  const language = whisperLanguage(locale);
  const result = await pipe(audio, {
    ...(language ? { language, task: 'transcribe' } : {}),
  });
  return (result.text ?? '').trim();
}
