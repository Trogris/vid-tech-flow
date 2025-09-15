import React, { useState, useCallback } from 'react';
import FormularioInicial from '@/components/FormularioInicial';
import GravacaoVideo from '@/components/GravacaoVideo';
import ProcessamentoVideo from '@/components/ProcessamentoVideo';
import ResultadosRelatorio from '@/components/ResultadosRelatorio';

type Step = 'form' | 'recording-aberto' | 'recording-fechado' | 'processing' | 'results';

interface FormData {
  nomeTecnico: string;
  numeroSerie: string;
  contrato: string;
  durationAberto?: number;
  durationFechado?: number;
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

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [videoBlobAberto, setVideoBlobAberto] = useState<Blob | null>(null);
  const [videoBlobFechado, setVideoBlobFechado] = useState<Blob | null>(null);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [hasError, setHasError] = useState<string | null>(null);

  const handleFormNext = useCallback((data: FormData) => {
    setFormData(data);
    setCurrentStep('recording-aberto');
  }, []);

  const handleRecordingAbertoNext = useCallback((blob: Blob, recordingTime: number) => {
    setVideoBlobAberto(blob);
    setFormData(prev => prev ? { ...prev, durationAberto: recordingTime } : null);
    setCurrentStep('recording-fechado');
  }, []);

  const handleRecordingFechadoNext = useCallback((blob: Blob, recordingTime: number) => {
    setVideoBlobFechado(blob);
    setFormData(prev => prev ? { ...prev, durationFechado: recordingTime } : null);
    setCurrentStep('processing');
  }, []);

  const handleRecordingAbertoBack = useCallback(() => {
    setCurrentStep('form');
  }, []);

  const handleRecordingFechadoBack = useCallback(() => {
    setCurrentStep('recording-aberto');
  }, []);

  const handleProcessingComplete = useCallback((processingResults: ProcessingResults) => {
    setResults(processingResults);
    setCurrentStep('results');
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setCurrentStep('form');
    setFormData(null);
    setVideoBlobAberto(null);
    setVideoBlobFechado(null);
    setResults(null);
    setHasError(null);
  }, []);

  const renderCurrentStep = useCallback(() => {
    try {
      if (hasError) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="card-soft p-6 text-center">
                <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 text-destructive-foreground">⚠</div>
                </div>
                <h1 className="text-xl font-bold text-foreground mb-2">Erro na aplicação</h1>
                <p className="text-muted-foreground mb-6">
                  {hasError}
                </p>
                <button
                  onClick={() => {
                    setHasError(null);
                    setCurrentStep('form');
                  }}
                  className="btn-primary w-full"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        );
      }

      switch (currentStep) {
        case 'form':
          return <FormularioInicial onNext={handleFormNext} />;
        
        case 'recording-aberto':
          return (
            <GravacaoVideo 
              onNext={handleRecordingAbertoNext} 
              onBack={handleRecordingAbertoBack}
              etapa="Equipamento Aberto"
              descricao="Grave o vídeo com o equipamento aberto"
            />
          );
        
        case 'recording-fechado':
          return (
            <GravacaoVideo 
              onNext={handleRecordingFechadoNext} 
              onBack={handleRecordingFechadoBack}
              etapa="Equipamento Fechado"
              descricao="Grave o vídeo com o equipamento fechado"
            />
          );
        
        case 'processing':
          return videoBlobAberto && videoBlobFechado && formData ? (
            <ProcessamentoVideo 
              videoBlobAberto={videoBlobAberto}
              videoBlobFechado={videoBlobFechado}
              durationAberto={formData.durationAberto}
              durationFechado={formData.durationFechado}
              onComplete={handleProcessingComplete}
            />
          ) : null;
        
        case 'results':
          return formData && results ? (
            <ResultadosRelatorio 
              formData={formData}
              results={results}
              onNewAnalysis={handleNewAnalysis}
              videoBlobAberto={videoBlobAberto}
              videoBlobFechado={videoBlobFechado}
            />
          ) : null;
        
        default:
          return <FormularioInicial onNext={handleFormNext} />;
      }
    } catch (error) {
      console.error('Erro renderizando step:', error);
      setHasError(error instanceof Error ? error.message : 'Erro desconhecido');
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <h1 className="text-xl font-bold text-foreground mb-2">Erro na Aplicação</h1>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <button 
                onClick={() => {
                  setHasError(null);
                  setCurrentStep('form');
                }}
                className="btn-primary"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );
    }
  }, [currentStep, hasError, formData, results, videoBlobAberto, videoBlobFechado, handleFormNext, handleRecordingAbertoNext, handleRecordingAbertoBack, handleRecordingFechadoNext, handleRecordingFechadoBack, handleProcessingComplete, handleNewAnalysis]);

  return renderCurrentStep();
};

export default Index;