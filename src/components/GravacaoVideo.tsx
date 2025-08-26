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
    console.log('🎬 START RECORDING CALLED');
    console.log('🎬 Stream available:', !!stream);
    console.log('🎬 IsMobile:', isMobile);
    console.log('🎬 Platform:', navigator.platform);
    console.log('🎬 UserAgent:', navigator.userAgent);
    
    if (!stream) {
      console.error('❌ CRITICAL: No stream available');
      setError('Camera não está disponível. Recarregue a página.');
      return;
    }

    try {
      console.log('🎬 Starting recording process...');
      
      // Expandir tela APENAS no mobile (dispositivos reais)
      const isRealMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      console.log('📱 Device detection:', { isMobile, isRealMobile });
      
      if (isMobile && isRealMobile) {
        console.log('📱 Expanding for mobile device');
        setIsExpanded(true);
      } else {
        console.log('🖥️ Not expanding - PC or tablet');
        setIsExpanded(false);
      }
      
      // Configurações específicas para iOS compatibilidade
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      console.log('🍎 iOS detected:', isIOS);
      
      const options: MediaRecorderOptions = {};
      
      if (isIOS) {
        console.log('🍎 Setting up iOS-specific MIME types');
        // Tentar MP4 primeiro no iOS
        const supportedTypes = [
          'video/mp4',
          'video/mp4;codecs=h264',
          'video/webm;codecs=vp8',
          'video/webm'
        ];
        
        for (const type of supportedTypes) {
          console.log('🔍 Testing MIME type:', type, 'Supported:', MediaRecorder.isTypeSupported(type));
          if (MediaRecorder.isTypeSupported(type)) {
            options.mimeType = type;
            console.log('✅ Selected MIME type:', type);
            break;
          }
        }
      } else {
        // Test common web formats
        const webTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
        ];
        
        for (const type of webTypes) {
          console.log('🔍 Testing web MIME type:', type, 'Supported:', MediaRecorder.isTypeSupported(type));
          if (MediaRecorder.isTypeSupported(type)) {
            options.mimeType = type;
            console.log('✅ Selected web MIME type:', type);
            break;
          }
        }
      }

      console.log('📹 Final MediaRecorder options:', options);
      console.log('📹 Creating MediaRecorder...');
      
      const recorder = new MediaRecorder(stream, options);
      console.log('✅ MediaRecorder created successfully');
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        console.log('📊 Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log('🛑 Recording stopped');
        console.log('📦 Total chunks:', chunksRef.current.length);
        
        // Usar o tipo correto baseado na gravação
        const mimeType = recorder.mimeType || 'video/mp4';
        console.log('🎞️ Creating blob with type:', mimeType);
        
        const videoBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log('✅ Video blob created:', videoBlob.size, 'bytes');
        
        setRecordedVideo(videoBlob);
        
        if (recordedVideoRef.current) {
          recordedVideoRef.current.src = URL.createObjectURL(videoBlob);
          console.log('🎥 Video preview set');
        }
      };

      recorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        setError('Erro durante a gravação');
        setIsRecording(false);
      };

      console.log('📹 Starting MediaRecorder...');
      recorder.start();
      console.log('✅ MediaRecorder started successfully');
      
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
      
      console.log('⏱️ Starting timer...');
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          console.log('⏱️ Recording time:', newTime);
          return newTime;
        });
      }, 1000);
      
      console.log('✅ Recording setup complete');
      
    } catch (err) {
      console.error('❌ CRITICAL ERROR in startRecording:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      setError(`Erro ao iniciar gravação: ${err.message}`);
      setIsRecording(false);
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
        <div className="card-soft p-6">
          <div className="text-center mb-6">
            <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Camera className="text-primary-foreground w-8 h-8" />
            </div>
            <h1 className="font-bold text-foreground text-2xl mb-2">
              {etapa}
            </h1>
            <p className="text-muted-foreground">
              {recordedVideo ? 'Vídeo gravado com sucesso' : descricao}
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Preview da câmera ou vídeo gravado */}
          <div className="relative mb-6">
            <div className="bg-muted rounded-lg overflow-hidden aspect-video">
              {!recordedVideo && (
                <video
                  key="camera-preview"
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              {recordedVideo && (
                <video
                  key="recorded-video"
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
                  <React.Fragment>
                    <Square className="w-5 h-5" />
                    Finalizar
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Play className="w-5 h-5" />
                    Iniciar Gravação
                  </React.Fragment>
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