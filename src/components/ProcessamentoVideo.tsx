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

    // Gera resultados simulados
    const mockFrames = generateMockFrames();
    const results: ProcessingResults = {
      frames: mockFrames,
      analysis: {
        duration: Math.floor(Math.random() * 300) + 30, // 30-330 segundos
        frameCount: 10,
        resolution: '1920x1080',
        fileSize: `${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB`
      }
    };

    setIsProcessing(false);
    
    // Aguarda um pouco antes de mostrar os resultados
    setTimeout(() => {
      onComplete(results);
    }, 1000);
  };

  const generateMockFrames = (): string[] => {
    // Gera 10 frames simulados otimizados para download
    const scenarios = [
      { bg: '#2563EB', accent: '#60A5FA', label: 'Início da Gravação' },
      { bg: '#059669', accent: '#34D399', label: 'Equipamento Visível' },
      { bg: '#DC2626', accent: '#F87171', label: 'Problema Identificado' },
      { bg: '#7C3AED', accent: '#A78BFA', label: 'Processo de Reparo' },
      { bg: '#EA580C', accent: '#FB923C', label: 'Ferramenta em Uso' },
      { bg: '#0891B2', accent: '#22D3EE', label: 'Teste Funcional' },
      { bg: '#65A30D', accent: '#A3E635', label: 'Conexões Verificadas' },
      { bg: '#C2410C', accent: '#FDBA74', label: 'Resultado do Teste' },
      { bg: '#BE185D', accent: '#F472B6', label: 'Documentação' },
      { bg: '#4338CA', accent: '#818CF8', label: 'Finalização' }
    ];
    
    return scenarios.map((scenario, index) => {
      // Canvas menor para reduzir tamanho do arquivo
      const canvas = document.createElement('canvas');
      canvas.width = 480;  // Reduzido de 640
      canvas.height = 270; // Reduzido de 360
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fundo gradiente otimizado
        const gradient = ctx.createRadialGradient(
          canvas.width/2, canvas.height/2, 0,
          canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, scenario.bg);
        gradient.addColorStop(1, scenario.bg + '40');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Elementos visuais técnicos
        ctx.strokeStyle = scenario.accent;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Grid técnico
        for (let i = 0; i < 5; i++) {
          const x = (canvas.width / 4) * (i + 1);
          ctx.beginPath();
          ctx.moveTo(x, 20);
          ctx.lineTo(x, canvas.height - 20);
          ctx.stroke();
        }
        
        ctx.setLineDash([]);
        
        // Círculo central
        ctx.fillStyle = scenario.accent + '30';
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 60, 0, 2 * Math.PI);
        ctx.fill();
        
        // Número do frame
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 3;
        ctx.fillText((index + 1).toString(), canvas.width / 2, canvas.height / 2 + 12);
        
        // Descrição da cena
        ctx.font = 'bold 14px Arial';
        ctx.fillText(scenario.label, canvas.width / 2, canvas.height - 30);
        
        // Timestamp
        const timestamp = `${String(Math.floor((index * 15) / 60)).padStart(2, '0')}:${String((index * 15) % 60).padStart(2, '0')}`;
        ctx.font = '12px Arial';
        ctx.fillStyle = scenario.accent;
        ctx.fillText(`⏱ ${timestamp}`, canvas.width / 2, canvas.height - 10);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      
      // Qualidade reduzida para arquivos menores (0.6 em vez de 0.9)
      return canvas.toDataURL('image/jpeg', 0.6);
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