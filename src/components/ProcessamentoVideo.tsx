import React, { useState, useEffect } from 'react';
import { Upload, Image, BarChart3, FileDown, CheckCircle } from 'lucide-react';

interface ProcessamentoVideoProps {
  videoBlobAberto: Blob;
  videoBlobFechado: Blob;
  onComplete: (results: ProcessingResults) => void;
}

interface ProcessingResults {
  framesAberto: string[];
  framesFechado: string[];
  analysis: {
    durationAberto: number;
    durationFechado: number;
    frameCountAberto: number;
    frameCountFechado: number;
    resolution: string;
    fileSizeAberto: string;
    fileSizeFechado: string;
  };
}

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

const ProcessamentoVideo: React.FC<ProcessamentoVideoProps> = ({ videoBlobAberto, videoBlobFechado, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);

  const steps: ProcessingStep[] = [
    { id: 'upload', label: 'Enviando vídeos', icon: Upload, completed: false },
    { id: 'frames-aberto', label: 'Extraindo frames - Aberto', icon: Image, completed: false },
    { id: 'frames-fechado', label: 'Extraindo frames - Fechado', icon: Image, completed: false },
    { id: 'analysis', label: 'Analisando conteúdo', icon: BarChart3, completed: false },
    { id: 'report', label: 'Gerando relatório', icon: FileDown, completed: false }
  ];

  const [processSteps, setProcessSteps] = useState(steps);

  useEffect(() => {
    simulateProcessing();
  }, []);

  const simulateProcessing = async () => {
    try {
      // Simula o processamento do vídeo
      for (let i = 0; i < steps.length; i++) {
        // Atualiza o passo atual
        setCurrentStep(i);
        
        // Simula o progresso do passo atual
        for (let progress = 0; progress <= 100; progress += 10) {
          setProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100)); // Reduzido para iOS
        }
        
        // Marca o passo como completo
        setProcessSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, completed: true } : step
        ));
        
        await new Promise(resolve => setTimeout(resolve, 300)); // Reduzido para iOS
      }

      // Extrai frames reais dos dois vídeos
      const framesAberto = await extractRealFrames(videoBlobAberto, 'Aberto');
      const framesFechado = await extractRealFrames(videoBlobFechado, 'Fechado');
      
      // Cria elementos de vídeo temporários para obter metadados - Versão iOS-friendly
      const [metadataAberto, metadataFechado] = await Promise.all([
        getVideoMetadata(videoBlobAberto),
        getVideoMetadata(videoBlobFechado)
      ]);
      
      const results: ProcessingResults = {
        framesAberto,
        framesFechado,
        analysis: {
          durationAberto: metadataAberto.duration,
          durationFechado: metadataFechado.duration,
          frameCountAberto: framesAberto.length,
          frameCountFechado: framesFechado.length,
          resolution: `${metadataAberto.width}x${metadataAberto.height}`,
          fileSizeAberto: `${(videoBlobAberto.size / (1024 * 1024)).toFixed(2)} MB`,
          fileSizeFechado: `${(videoBlobFechado.size / (1024 * 1024)).toFixed(2)} MB`
        }
      };

      setIsProcessing(false);
      
      // Aguarda um pouco antes de mostrar os resultados
      setTimeout(() => {
        onComplete(results);
      }, 1000);
      
    } catch (error) {
      console.error('Erro durante o processamento:', error);
      
      // Fallback em caso de erro - especialmente para iOS
      const fallbackResults: ProcessingResults = {
        framesAberto: [],
        framesFechado: [],
        analysis: {
          durationAberto: 30,
          durationFechado: 30,
          frameCountAberto: 0,
          frameCountFechado: 0,
          resolution: '1920x1080',
          fileSizeAberto: `${(videoBlobAberto.size / (1024 * 1024)).toFixed(2)} MB`,
          fileSizeFechado: `${(videoBlobFechado.size / (1024 * 1024)).toFixed(2)} MB`
        }
      };
      
      setIsProcessing(false);
      onComplete(fallbackResults);
    }
  };

  const getVideoMetadata = (videoBlob: Blob): Promise<{duration: number, width: number, height: number}> => {
    return new Promise((resolve) => {
      const tempVideo = document.createElement('video');
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.preload = 'metadata';
      tempVideo.crossOrigin = 'anonymous';
      
      const videoURL = URL.createObjectURL(videoBlob);
      tempVideo.src = videoURL;
      
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(videoURL);
        resolve({ duration: 30, width: 1920, height: 1080 }); // Fallback para iOS
      }, 5000);
      
      const onLoadedMetadata = () => {
        clearTimeout(timeout);
        let duration = tempVideo.duration;
        
        // Tratamento especial para iOS onde duration pode ser Infinity/NaN
        if (!Number.isFinite(duration) || duration <= 0) {
          duration = 30; // Fallback duration
        }
        
        const result = {
          duration: duration,
          width: tempVideo.videoWidth || 1920,
          height: tempVideo.videoHeight || 1080
        };
        
        URL.revokeObjectURL(videoURL);
        resolve(result);
      };
      
      tempVideo.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      tempVideo.load(); // Force load for iOS
    });
  };

  const extractRealFrames = async (videoBlob: Blob, etapa: string): Promise<string[]> => {
    try {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.muted = true
      video.preload = 'metadata'
      video.playsInline = true

      const videoURL = URL.createObjectURL(videoBlob)
      video.src = videoURL

      // Helper: wait for a single event with timeout - Otimizado para iOS
      const waitForEvent = (el: HTMLMediaElement, event: keyof HTMLMediaElementEventMap, timeout = 5000) =>
        new Promise<void>((resolve) => {
          const on = () => { cleanup(); resolve() }
          const to = setTimeout(() => { cleanup(); resolve() }, timeout)
          const cleanup = () => {
            clearTimeout(to)
            el.removeEventListener(event, on as any)
          }
          el.addEventListener(event, on as any, { once: true })
        })

      await waitForEvent(video, 'loadedmetadata', 5000)

      // Resolve duration robustly - Versão iOS-friendly
      let duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0) {
        // Tentativa mais suave para iOS sem usar valores extremos
        await new Promise<void>((resolve) => {
          const onSeeked = () => { 
            duration = video.duration; 
            resolve() 
          }
          const timeout = setTimeout(() => resolve(), 2000)
          
          video.addEventListener('seeked', onSeeked, { once: true })
          
          try { 
            // Valor mais seguro para iOS ao invés de 1e6
            video.currentTime = Math.min(60, video.duration || 30)
          } catch { 
            clearTimeout(timeout)
            resolve() 
          }
        })
        
        if (!Number.isFinite(duration) || duration <= 0) duration = 30 // fallback padrão
      }

      const totalFrames: number = 10
      const safeDuration = Math.max(1, duration) // Mínimo maior para iOS
      const times = Array.from({ length: totalFrames }, (_, i) => {
        if (totalFrames === 1) return 0
        const t = (i / (totalFrames - 1)) * (safeDuration - 0.1) // Margem maior
        return Math.min(Math.max(0, t), safeDuration - 0.1)
      })

      const frames: string[] = []

      const seekTo = (t: number) =>
        new Promise<void>((resolve) => {
          const onSeeked = () => { cleanup(); resolve() }
          const onError = () => { cleanup(); resolve() }
          const to = setTimeout(() => { cleanup(); resolve() }, 2000) // Timeout maior para iOS
          const cleanup = () => {
            clearTimeout(to)
            video.removeEventListener('seeked', onSeeked)
            video.removeEventListener('error', onError)
          }
          try {
            video.addEventListener('seeked', onSeeked)
            video.addEventListener('error', onError)
            if (Number.isFinite(t) && t >= 0) {
              video.currentTime = t
            } else { 
              cleanup(); resolve() 
            }
          } catch {
            cleanup(); resolve()
          }
        })

      const capture = (): string | null => {
        try {
          // Verificações extras para iOS
          if (video.readyState < 2) {
            console.warn('Vídeo não está pronto para captura')
            return null
          }

          const w = video.videoWidth || 640
          const h = video.videoHeight || 360
          
          if (w === 0 || h === 0) {
            console.warn('Dimensões inválidas do vídeo')
            return null
          }

          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (!ctx) return null
          
          // Limpar canvas antes de desenhar
          ctx.clearRect(0, 0, w, h)
          
          // Desenhar o vídeo no canvas
          ctx.drawImage(video, 0, 0, w, h)
          
          // Verificar se realmente capturou algo (iOS específico)
          const imageData = ctx.getImageData(0, 0, Math.min(10, w), Math.min(10, h))
          const pixels = imageData.data
          let hasNonZeroPixels = false
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] > 0 || pixels[i + 1] > 0 || pixels[i + 2] > 0) {
              hasNonZeroPixels = true
              break
            }
          }
          
          if (!hasNonZeroPixels) {
            console.warn('Frame capturado está vazio/preto')
            return null
          }

          // Overlay informativo
          ctx.fillStyle = 'rgba(0,0,0,0.6)'
          ctx.fillRect(10, 10, 200, 56)
          ctx.fillStyle = '#fff'
          ctx.font = '16px Arial'
          const idx = frames.length + 1
          ctx.fillText(`Frame ${idx} - ${etapa}`, 20, 32)
          const ct = Number.isFinite(video.currentTime) ? video.currentTime : 0
          const minutes = Math.floor(ct / 60)
          const seconds = Math.floor(ct % 60)
          ctx.font = '14px Arial'
          ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, 20, 52)

          return canvas.toDataURL('image/jpeg', 0.8)
        } catch (error) {
          console.warn('Erro ao capturar frame:', error)
          return null
        }
      }

      // Processamento mais seguro dos frames para iOS
      for (const t of times) {
        try {
          await seekTo(t)
          
          // Aguardar vídeo estar realmente pronto (iOS específico)
          await new Promise((resolve) => {
            let attempts = 0
            const checkReady = () => {
              if (video.readyState >= 2 && video.videoWidth > 0) {
                resolve(null)
              } else if (attempts < 20) {
                attempts++
                setTimeout(checkReady, 50)
              } else {
                resolve(null) // Timeout, continuar mesmo assim
              }
            }
            checkReady()
          })
          
          const data = capture()
          if (data) {
            frames.push(data)
          } else {
            // Se captura falhou, tentar uma vez mais após pausa
            await new Promise((r) => setTimeout(r, 200))
            const retryData = capture()
            if (retryData) frames.push(retryData)
          }
        } catch (error) {
          console.warn('Erro ao processar frame:', error)
          // Continua mesmo se um frame falhar
        }
      }

      URL.revokeObjectURL(videoURL)
      return frames
      
    } catch (error) {
      console.error('Erro na extração de frames:', error)
      return [] // Retorna array vazio ao invés de falhar
    }
  };

  const currentStepData = processSteps[currentStep];

  return (
    <div className="min-h-screen bg-background p-4 animate-fade-in">
      <div className="max-w-md mx-auto pt-8">
        <div className="card-soft p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              {isProcessing ? (
                <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isProcessing ? 'Processando Vídeo' : 'Processamento Concluído'}
            </h1>
            <p className="text-muted-foreground">
              {isProcessing ? 'Por favor, aguarde...' : 'Análise finalizada com sucesso'}
            </p>
          </div>

          {/* Etapas do processamento */}
          <div className="space-y-4 mb-8">
            {processSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep && isProcessing;
              const isCompleted = step.completed;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : isCompleted
                      ? 'border-success bg-success/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{step.label}</h3>
                    {isActive && (
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra de progresso geral */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progresso geral</span>
              <span>{Math.round(((currentStep + (progress / 100)) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${((currentStep + (progress / 100)) / steps.length) * 100}%` 
                }}
              />
            </div>
          </div>

          {!isProcessing && (
            <div className="text-center">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-success font-medium">
                  Vídeo processado com sucesso!
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Redirecionando para os resultados...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessamentoVideo;