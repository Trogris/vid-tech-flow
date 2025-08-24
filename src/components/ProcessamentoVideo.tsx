import React, { useState, useEffect } from 'react';
import { Upload, Image, BarChart3, FileDown, CheckCircle } from 'lucide-react';

interface ProcessamentoVideoProps {
  videoBlob: Blob;
  onComplete: (results: ProcessingResults) => void;
}

interface ProcessingResults {
  frames: string[];
  analysis: {
    duration: number;
    frameCount: number;
    resolution: string;
    fileSize: string;
  };
}

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

const ProcessamentoVideo: React.FC<ProcessamentoVideoProps> = ({ videoBlob, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);

  const steps: ProcessingStep[] = [
    { id: 'upload', label: 'Enviando vídeo', icon: Upload, completed: false },
    { id: 'frames', label: 'Extraindo frames', icon: Image, completed: false },
    { id: 'analysis', label: 'Analisando conteúdo', icon: BarChart3, completed: false },
    { id: 'report', label: 'Gerando relatório', icon: FileDown, completed: false }
  ];

  const [processSteps, setProcessSteps] = useState(steps);

  useEffect(() => {
    simulateProcessing();
  }, []);

  const simulateProcessing = async () => {
    // Simula o processamento do vídeo
    for (let i = 0; i < steps.length; i++) {
      // Atualiza o passo atual
      setCurrentStep(i);
      
      // Simula o progresso do passo atual
      for (let progress = 0; progress <= 100; progress += 10) {
        setProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Marca o passo como completo
      setProcessSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, completed: true } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Extrai frames reais do vídeo
    const realFrames = await extractRealFrames();
    
    // Cria elemento de vídeo temporário para obter metadados
    const tempVideo = document.createElement('video');
    tempVideo.src = URL.createObjectURL(videoBlob);
    
    await new Promise(resolve => {
      tempVideo.onloadedmetadata = resolve;
    });
    
    const results: ProcessingResults = {
      frames: realFrames,
      analysis: {
        duration: Math.floor(tempVideo.duration),
        frameCount: realFrames.length,
        resolution: `${tempVideo.videoWidth}x${tempVideo.videoHeight}`,
        fileSize: `${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB`
      }
    };
    
    URL.revokeObjectURL(tempVideo.src);

    setIsProcessing(false);
    
    // Aguarda um pouco antes de mostrar os resultados
    setTimeout(() => {
      onComplete(results);
    }, 1000);
  };

  const extractRealFrames = async (): Promise<string[]> => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'metadata'
    video.playsInline = true

    const videoURL = URL.createObjectURL(videoBlob)
    video.src = videoURL

    // Helper: wait for a single event with timeout
    const waitForEvent = (el: HTMLMediaElement, event: keyof HTMLMediaElementEventMap, timeout = 8000) =>
      new Promise<void>((resolve) => {
        const on = () => { cleanup(); resolve() }
        const to = setTimeout(() => { cleanup(); resolve() }, timeout)
        const cleanup = () => {
          clearTimeout(to)
          el.removeEventListener(event, on as any)
        }
        el.addEventListener(event, on as any, { once: true })
      })

    await waitForEvent(video, 'loadedmetadata', 8000)

    // Resolve duration robustly (iOS/Safari can report Infinity/NaN)
    let duration = video.duration
    if (!Number.isFinite(duration) || duration <= 0) {
      await new Promise<void>((resolve) => {
        const onSeeked = () => { duration = video.duration; resolve() }
        video.addEventListener('seeked', onSeeked, { once: true })
        try { video.currentTime = 1e6 } catch { resolve() }
        setTimeout(() => resolve(), 1000)
      })
      if (!Number.isFinite(duration) || duration <= 0) duration = 1 // fallback mínimo
    }

    const totalFrames: number = 10
    const safeDuration = Math.max(0.05, duration)
    const times = Array.from({ length: totalFrames }, (_, i) => {
      if (totalFrames === 1) return 0
      const t = (i / (totalFrames - 1)) * safeDuration
      return Math.min(Math.max(0, t), safeDuration - 0.01)
    })

    const frames: string[] = []

    const seekTo = (t: number) =>
      new Promise<void>((resolve) => {
        const onSeeked = () => { cleanup(); resolve() }
        const onError = () => { cleanup(); resolve() }
        const to = setTimeout(() => { cleanup(); resolve() }, 1500)
        const cleanup = () => {
          clearTimeout(to)
          video.removeEventListener('seeked', onSeeked)
          video.removeEventListener('error', onError)
        }
        try {
          video.addEventListener('seeked', onSeeked)
          video.addEventListener('error', onError)
          if (Number.isFinite(t)) video.currentTime = t
          else { cleanup(); resolve() }
        } catch {
          cleanup(); resolve()
        }
      })

    const capture = (): string | null => {
      const w = video.videoWidth || 640
      const h = video.videoHeight || 360
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(video, 0, 0, w, h)

      // Overlay informativo
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(10, 10, 200, 56)
      ctx.fillStyle = '#fff'
      ctx.font = '16px Arial'
      const idx = frames.length + 1
      ctx.fillText(`Frame ${idx}`, 20, 32)
      const ct = Number.isFinite(video.currentTime) ? video.currentTime : 0
      const minutes = Math.floor(ct / 60)
      const seconds = Math.floor(ct % 60)
      ctx.font = '14px Arial'
      ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, 20, 52)

      return canvas.toDataURL('image/jpeg', 0.8)
    }

    for (const t of times) {
      await seekTo(t)
      const data = capture()
      if (data) frames.push(data)
      await new Promise((r) => setTimeout(r, 60))
    }

    URL.revokeObjectURL(videoURL)
    return frames
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