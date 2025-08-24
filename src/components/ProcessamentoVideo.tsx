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
        frameCount: 10,
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
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      const videoURL = URL.createObjectURL(videoBlob);
      video.src = videoURL;
      
      const frames: string[] = [];
      let frameCount = 0;
      const totalFrames = 10;
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const interval = duration / totalFrames;
        
        const captureFrame = () => {
          if (frameCount >= totalFrames) {
            URL.revokeObjectURL(videoURL);
            resolve(frames);
            return;
          }
          
          const currentTime = frameCount * interval;
          video.currentTime = currentTime;
        };
        
        video.onseeked = () => {
          // Cria canvas para capturar frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const currentTime = frameCount * interval; // Move currentTime para cá
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Adiciona overlay com informações
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 200, 60);
            
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText(`Frame ${frameCount + 1}`, 20, 30);
            
            const minutes = Math.floor(currentTime / 60);
            const seconds = Math.floor(currentTime % 60);
            ctx.font = '14px Arial';
            ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 50);
            
            // Converte para base64 com qualidade otimizada
            const frameData = canvas.toDataURL('image/jpeg', 0.8);
            frames.push(frameData);
          }
          
          frameCount++;
          setTimeout(captureFrame, 100); // Pequeno delay entre capturas
        };
        
        captureFrame();
      };
    });
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