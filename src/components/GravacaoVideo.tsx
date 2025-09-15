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

  const initializeCamera = useCallback(async () => {
    console.log('📷 Inicializando câmera...');
    
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.error('❌ getUserMedia não suportado');
        setError('Câmera não suportada neste navegador');
        return;
      }

      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('📷 Solicitando acesso à câmera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('📷 Stream obtido com sucesso');
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('✅ Vídeo conectado ao stream');
        
        // Força o play do vídeo para garantir que apareça
        try {
          await videoRef.current.play();
          console.log('✅ Vídeo iniciado');
        } catch (playError) {
          console.log('⚠️ Auto-play bloqueado, será iniciado na interação do usuário');
        }
      }
      setError('');
    } catch (err) {
      console.error('❌ Erro ao acessar câmera:', err);
      try {
        console.log('🔄 Tentando configuração básica...');
        const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(basicStream);
        if (videoRef.current) {
          videoRef.current.srcObject = basicStream;
          await videoRef.current.play().catch(() => {});
        }
        setError('');
      } catch (basicErr) {
        console.error('❌ Falha total ao acessar câmera:', basicErr);
        setError('Não foi possível acessar a câmera');
      }
    }
  }, []);

  useEffect(() => {
    initializeCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initializeCamera]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    console.log('🎬 Iniciando gravação...');
    
    if (!stream) {
      console.error('❌ Stream não disponível');
      setError('Câmera não disponível');
      return;
    }

    try {
      console.log('🔧 Configurando MediaRecorder...');
      const options: MediaRecorderOptions = {};
      
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options.mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options.mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options.mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, options);
      console.log('✅ MediaRecorder criado com sucesso');
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        console.log('📊 Dados disponíveis:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log('⏹️ Gravação finalizada');
        const videoBlob = new Blob(chunksRef.current, { 
          type: recorder.mimeType || 'video/webm' 
        });
        setRecordedVideo(videoBlob);
        
        if (recordedVideoRef.current) {
          recordedVideoRef.current.src = URL.createObjectURL(videoBlob);
        }
      };

      console.log('🚀 Iniciando gravação...');
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('✅ Gravação iniciada com sucesso');
      
    } catch (err) {
      console.error('❌ Erro ao iniciar gravação:', err);
      setError(`Erro ao iniciar gravação: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
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

  return (
    <div className="min-h-screen bg-background animate-fade-in p-4">
      <div className="mx-auto pt-4 max-w-md">
        <div className="card-soft p-6">
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

          <div className="relative mb-6">
            <div className="bg-muted rounded-lg overflow-hidden aspect-video">
              {/* Vídeo em tempo real - sempre visível durante preview e gravação */}
              {!recordedVideo && (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: 'block' }}
                  onLoadedMetadata={() => {
                    console.log('📺 Vídeo carregado e pronto');
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.error);
                    }
                  }}
                />
              )}
              
              {/* Vídeo gravado para playback */}
              {recordedVideo && (
                <video
                  ref={recordedVideoRef}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: 'block' }}
                />
              )}
              
              {/* Placeholder quando não há stream */}
              {!stream && !recordedVideo && (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Carregando câmera...</p>
                  </div>
                </div>
              )}
            </div>
            
            {isRecording && (
              <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse">
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