import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Camera, RotateCcw, ArrowRight } from 'lucide-react';

interface GravacaoVideoProps {
  onNext: (videoBlob: Blob, recordingTime: number) => void;
  onBack: () => void;
  etapa: string;
  descricao: string;
}

const GravacaoVideo: React.FC<GravacaoVideoProps> = ({ onNext, onBack, etapa, descricao }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const initializeCamera = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Câmera não suportada neste navegador');
        return;
      }

      const constraints = {
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      // Aguardar próximo tick para garantir que o componente está montado
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {
            // Auto-play bloqueado, será iniciado na interação do usuário
          });
        }
      }, 100);
      
      setError('');
    } catch (err) {
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(basicStream);
        setTimeout(() => {
          if (videoRef.current && basicStream) {
            videoRef.current.srcObject = basicStream;
            videoRef.current.play().catch(() => {});
          }
        }, 100);
        setError('');
      } catch (basicErr) {
        setError('Não foi possível acessar a câmera');
      }
    }
  }, []);


  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (isMounted) {
        await initializeCamera();
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    setIsExpanded(true);
    if (!stream) {
      setError('Câmera não disponível');
      return;
    }

    try {
      const options: MediaRecorderOptions = {};
      
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options.mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options.mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options.mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { 
          type: recorder.mimeType || 'video/webm' 
        });
        
        setRecordedVideo(videoBlob);
        setIsExpanded(false);
        
        if (recordedVideoRef.current) {
          recordedVideoRef.current.src = URL.createObjectURL(videoBlob);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setError(`Erro ao iniciar gravação: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setIsRecording(false);
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording]);

  const restartRecording = useCallback(() => {
    setRecordedVideo(null);
    setRecordingTime(0);
    setIsExpanded(false);
    if (recordedVideoRef.current) {
      recordedVideoRef.current.src = '';
    }
  }, []);

  const handleNext = useCallback(() => {
    if (recordedVideo) {
      onNext(recordedVideo, recordingTime);
    }
  }, [recordedVideo, recordingTime, onNext]);

  return (
    <div className="bg-background animate-fade-in min-h-screen p-4">
      <div className="mx-auto pt-8 max-w-4xl">
        <div className="card-soft p-6">
          {!isExpanded && (
            <>
              <div className="text-center mb-6">
                <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-primary-foreground w-8 h-8" />
                </div>
                <h1 className="font-bold text-foreground text-2xl mb-2">
                  {etapa || 'Gravação'}
                </h1>
                <p className="text-muted-foreground">
                  {recordedVideo ? 'Vídeo gravado com sucesso' : (descricao || 'Grave seu vídeo')}
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}
            </>
          )}

          <div className="relative mb-6">
            <div className={`bg-muted overflow-hidden relative rounded-lg transition-all duration-300 ${
              isExpanded ? 'h-[80vh]' : 'aspect-video'
            }`}>
              {/* Vídeo ao vivo da câmera */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover absolute inset-0 ${recordedVideo ? 'hidden' : 'block'}`}
                onLoadedMetadata={() => {
                  if (videoRef.current && !recordedVideo) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
              />
              
              {/* Vídeo gravado (preview) */}
              <video
                ref={recordedVideoRef}
                controls
                playsInline
                className={`w-full h-full object-cover absolute inset-0 ${recordedVideo ? 'block' : 'hidden'}`}
              />
              
              {/* Placeholder quando não há stream */}
              {!stream && !recordedVideo && (
                <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center z-10">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Carregando câmera...</p>
                  </div>
                </div>
              )}
            </div>
            
            {isRecording && (
              <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse z-20">
                REC {formatTime(recordingTime)}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 mb-6">
            {!recordedVideo && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!stream || !!error}
                className={`btn-primary flex items-center gap-2 ${
                  isRecording ? 'bg-destructive hover:bg-destructive/90' : ''
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-5 h-5" />
                    Finalizar
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Iniciar Gravação
                  </>
                )}
              </button>
            )}
            
            {recordedVideo && (
              <button
                onClick={restartRecording}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Gravar Novamente
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="btn-secondary flex-1"
            >
              Voltar
            </button>
            
            <button
              onClick={handleNext}
              disabled={!recordedVideo}
              className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
                !recordedVideo ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Processar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GravacaoVideo;