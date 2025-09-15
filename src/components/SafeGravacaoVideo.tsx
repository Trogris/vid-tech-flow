import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Camera, RotateCcw, ArrowRight } from 'lucide-react';

interface SafeGravacaoVideoProps {
  onNext: (videoBlob: Blob, recordingTime: number) => void;
  onBack: () => void;
  etapa: string;
  descricao: string;
}

const SafeGravacaoVideo: React.FC<SafeGravacaoVideoProps> = ({ onNext, onBack, etapa, descricao }) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'recording' | 'recorded' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Função simplificada de inicialização
  const initCamera = useCallback(async () => {
    try {
      setStatus('loading');
      setError('');

      // Verificações básicas
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices não suportado');
      }

      if (!MediaRecorder) {
        throw new Error('MediaRecorder não suportado');
      }

      // Configuração super simples
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false // Removendo áudio para simplificar
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('ready');
      
    } catch (err) {
      console.error('Erro init camera:', err);
      setError(err instanceof Error ? err.message : 'Erro ao inicializar câmera');
      setStatus('error');
    }
  }, []);

  // Inicializar ao montar
  useEffect(() => {
    initCamera();
    
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initCamera]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || status !== 'ready') return;

    try {
      // Configuração mínima
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm' // Formato mais compatível
      });

      chunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setStatus('recorded');
      };

      recorder.onerror = (event) => {
        console.error('Recorder error:', event);
        setError('Erro durante gravação');
        setStatus('error');
      };

      recorderRef.current = recorder;
      recorder.start();
      setStatus('recording');
      setRecordingTime(0);

      // Timer simples
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Erro start recording:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gravar');
      setStatus('error');
    }
  }, [status]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && status === 'recording') {
      recorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [status]);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setStatus('ready');
  }, []);

  const handleNext = useCallback(() => {
    if (recordedBlob) {
      onNext(recordedBlob, recordingTime);
    }
  }, [recordedBlob, recordingTime, onNext]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 animate-fade-in">
      <div className="max-w-md mx-auto pt-8">
        <div className="card-soft p-6">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{etapa}</h1>
            <p className="text-muted-foreground">{descricao}</p>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive text-sm">{error}</p>
              <button 
                onClick={initCamera}
                className="mt-2 text-destructive underline text-sm hover:no-underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Video container */}
          <div className="relative mb-6">
            <div className="bg-muted rounded-lg overflow-hidden aspect-video">
              
              {/* Loading state */}
              {status === 'loading' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground text-sm">Carregando câmera...</p>
                  </div>
                </div>
              )}

              {/* Video preview */}
              {(status === 'ready' || status === 'recording') && (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}

              {/* Recorded video playback */}
              {status === 'recorded' && recordedBlob && (
                <video
                  src={URL.createObjectURL(recordedBlob)}
                  controls
                  className="w-full h-full object-cover"
                />
              )}

              {/* Recording indicator */}
              {status === 'recording' && (
                <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  REC {formatTime(recordingTime)}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-6">
            {status === 'ready' && (
              <button
                onClick={startRecording}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Iniciar Gravação
              </button>
            )}

            {status === 'recording' && (
              <button
                onClick={stopRecording}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Square className="w-5 h-5" />
                Parar Gravação
              </button>
            )}

            {status === 'recorded' && (
              <button
                onClick={resetRecording}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Gravar Novamente
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="btn-secondary flex-1"
            >
              Voltar
            </button>
            
            <button
              onClick={handleNext}
              disabled={status !== 'recorded'}
              className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
                status !== 'recorded' ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Avançar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Debug info */}
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Status: {status} | Platform: {navigator.platform}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeGravacaoVideo;