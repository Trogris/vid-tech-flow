import React, { useState } from 'react';
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
  console.log('🚀 Index component mounted');
  
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [videoBlobAberto, setVideoBlobAberto] = useState<Blob | null>(null);
  const [videoBlobFechado, setVideoBlobFechado] = useState<Blob | null>(null);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [hasError, setHasError] = useState<string | null>(null);

  const handleFormNext = (data: FormData) => {
    setFormData(data);
    setCurrentStep('recording-aberto');
  };

  const handleRecordingAbertoNext = (blob: Blob, recordingTime: number) => {
    setVideoBlobAberto(blob);
    setFormData(prev => prev ? { ...prev, durationAberto: recordingTime } : null);
    setCurrentStep('recording-fechado');
  };

  const handleRecordingFechadoNext = (blob: Blob, recordingTime: number) => {
    setVideoBlobFechado(blob);
    setFormData(prev => prev ? { ...prev, durationFechado: recordingTime } : null);
    setCurrentStep('processing');
  };

  const handleRecordingAbertoBack = () => {
    setCurrentStep('form');
  };

  const handleRecordingFechadoBack = () => {
    setCurrentStep('recording-aberto');
  };

  const handleProcessingComplete = (processingResults: ProcessingResults) => {
    setResults(processingResults);
    setCurrentStep('results');
  };

  const handleNewAnalysis = () => {
    setCurrentStep('form');
    setFormData(null);
    setVideoBlobAberto(null);
    setVideoBlobFechado(null);
    setResults(null);
  };

  const renderCurrentStep = () => {
    console.log('🎯 Rendering step:', currentStep, 'Has error:', hasError);
    
    try {
      switch (currentStep) {
        case 'form':
          console.log('📝 Rendering FormularioInicial');
          return <FormularioInicial onNext={handleFormNext} />;
        
        case 'recording-aberto':
          console.log('🎥 Rendering GravacaoVideo - Aberto');
          return (
            <GravacaoVideo 
              onNext={handleRecordingAbertoNext} 
              onBack={handleRecordingAbertoBack}
              etapa="Equipamento Aberto"
              descricao="Grave o vídeo com o equipamento aberto"
            />
          );
        
        case 'recording-fechado':
          console.log('🎥 Rendering GravacaoVideo - Fechado');
          return (
            <GravacaoVideo 
              onNext={handleRecordingFechadoNext} 
              onBack={handleRecordingFechadoBack}
              etapa="Equipamento Fechado"
              descricao="Grave o vídeo com o equipamento fechado"
            />
          );
        
        case 'processing':
          console.log('⚙️ Rendering ProcessamentoVideo', { videoBlobAberto: !!videoBlobAberto, videoBlobFechado: !!videoBlobFechado, formData: !!formData });
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
          console.log('📊 Rendering ResultadosRelatorio', { formData: !!formData, results: !!results });
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
          console.log('🔄 Default case - Rendering FormularioInicial');
          return <FormularioInicial onNext={handleFormNext} />;
      }
    } catch (error) {
      console.error('❌ Error rendering step:', error);
      setHasError(error instanceof Error ? error.message : 'Erro desconhecido');
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <h1 className="text-xl font-bold text-foreground mb-2">Erro na Aplicação</h1>
              <p className="text-muted-foreground mb-4">
                {hasError || 'Ocorreu um erro inesperado'}
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
  };

  return renderCurrentStep();
};

export default Index;