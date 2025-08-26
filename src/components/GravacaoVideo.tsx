import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Camera, RotateCcw, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExitConfirmation } from '@/hooks/useExitConfirmation';

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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isMobile = useIsMobile();
  
  console.log('🎥 GravacaoVideo rendered:', { 
    isMobile, 
    platform: navigator.platform, 
    userAgent: navigator.userAgent.substring(0, 50) 
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Sempre usar API web para gravação de vídeo (funciona melhor no iOS)
    initializeCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      // Configuração mais flexível para web e mobile
      const constraints = {
        video: {
          // Tentar câmera traseira primeiro, fallback para qualquer câmera
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Garantir que o vídeo seja reproduzido
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      setError('');
    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      // Tentar novamente com configurações mais básicas
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(basicStream);
        if (videoRef.current) {
          videoRef.current.srcObject = basicStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
          };
        }
        setError('');
      } catch (basicErr) {
        console.error('Erro ao acessar câmera com configurações básicas:', basicErr);
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!stream) return;

    try {
      console.log('Starting recording, isMobile:', isMobile, 'userAgent:', navigator.userAgent)
      
      // Expandir tela APENAS no mobile (dispositivos reais)
      const isRealMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobile && isRealMobile) {
        console.log('Expanding for mobile device')
        setIsExpanded(true);
      } else {
        console.log('Not expanding - PC or tablet')
        setIsExpanded(false);
      }
      
      // Configurações específicas para iOS compatibilidade
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const options: MediaRecorderOptions = {};
      
      if (isIOS) {
        // Tentar MP4 primeiro no iOS
        const supportedTypes = [
          'video/mp4',
          'video/mp4;codecs=h264',
          'video/webm;codecs=vp8',
          'video/webm'
        ];
        
        for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            options.mimeType = type;
            break;
          }
        }
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
        // Usar o tipo correto baseado na gravação
        const mimeType = recorder.mimeType || 'video/mp4';
        const videoBlob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedVideo(videoBlob);
        
        if (recordedVideoRef.current) {
          recordedVideoRef.current.src = URL.createObjectURL(videoBlob);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      setError('Erro ao iniciar a gravação.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Retornar ao tamanho normal
      setIsExpanded(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const restartRecording = () => {
    setRecordedVideo(null);
    setRecordingTime(0);
    if (recordedVideoRef.current) {
      recordedVideoRef.current.src = '';
    }
  };

  const handleNext = () => {
    if (recordedVideo) {
      onNext(recordedVideo, recordingTime);
    }
  };

  // Confirmação de saída durante gravação ou se há vídeo gravado
  const hasWork = isRecording || recordedVideo !== null || recordingTime > 0;
  useExitConfirmation({ 
    when: hasWork,
    message: 'Você tem certeza que deseja sair? A gravação será perdida.'
  });

  return (
    <div className="min-h-screen bg-background animate-fade-in p-4">
      <div className="mx-auto pt-4 max-w-md">
        <div className={`card-soft ${isMobile && isExpanded ? 'transition-all duration-500 p-3' : 'p-6'}`}>
          <div className={`text-center ${isMobile && isExpanded ? 'transition-all duration-500 mb-3' : 'mb-6'}`}>
            <div className={`bg-primary rounded-full flex items-center justify-center mx-auto ${
              isMobile && isExpanded ? 'transition-all duration-500 w-12 h-12 mb-2' : 'w-16 h-16 mb-4'
            }`}>
              <Camera className={`text-primary-foreground ${
                isMobile && isExpanded ? 'transition-all duration-500 w-6 h-6' : 'w-8 h-8'
              }`} />
            </div>
            <h1 className={`font-bold text-foreground ${
              isMobile && isExpanded ? 'transition-all duration-500 text-lg mb-1' : 'text-2xl mb-2'
            }`}>
              {etapa}
            </h1>
            <p className={`text-muted-foreground ${
              isMobile && isExpanded ? 'transition-all duration-500 text-sm' : ''
            }`}>
              {recordedVideo ? 'Vídeo gravado com sucesso' : descricao}
            </p>
          </div>

          {error && (
            <div className={`bg-destructive/10 border border-destructive/20 rounded-lg p-4 ${
              isMobile && isExpanded ? 'transition-all duration-500 mb-3' : 'mb-6'
            }`}>
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Preview da câmera ou vídeo gravado */}
          <div className={`relative ${isMobile && isExpanded ? 'transition-all duration-500 mb-3' : 'mb-6'}`}>
            <div className={`bg-muted rounded-lg overflow-hidden ${
              isMobile && isExpanded ? 'transition-all duration-500 aspect-[4/3] h-[60vh]' : 'aspect-video'
            }`}>
               {!recordedVideo ? (
                 <video
                   ref={videoRef}
                   autoPlay
                   muted
                   playsInline
                   className="w-full h-full object-cover"
                 />
               ) : (
               <video
                 ref={recordedVideoRef}
                 controls
                 playsInline
                 className="w-full h-full object-cover"
               />
             )}
            </div>
            
            {/* Timer de gravação */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                REC {formatTime(recordingTime)}
              </div>
            )}
          </div>

          {/* Controles de gravação */}
          {!recordedVideo ? (
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!stream || !!error}
                className={`btn-primary flex items-center gap-2 ${
                  isRecording ? 'bg-destructive hover:bg-destructive-hover' : ''
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
            </div>
          ) : (
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={restartRecording}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Gravar Novamente
              </button>
            </div>
          )}

          {/* Botões de navegação */}
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