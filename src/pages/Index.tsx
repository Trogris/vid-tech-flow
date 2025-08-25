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

  const handleFormNext = (data: FormData) => {
    setFormData(data);
    setCurrentStep('recording-aberto');
  };

  const handleRecordingAbertoNext = (blob: Blob) => {
    setVideoBlobAberto(blob);
    setCurrentStep('recording-fechado');
  };

  const handleRecordingFechadoNext = (blob: Blob) => {
    setVideoBlobFechado(blob);
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
        return videoBlobAberto && videoBlobFechado ? (
          <ProcessamentoVideo 
            videoBlobAberto={videoBlobAberto}
            videoBlobFechado={videoBlobFechado}
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
  };

  return renderCurrentStep();
};

export default Index;