import React, { useState } from 'react';
import FormularioInicial from '@/components/FormularioInicial';
import GravacaoVideo from '@/components/GravacaoVideo';
import ProcessamentoVideo from '@/components/ProcessamentoVideo';
import ResultadosRelatorio from '@/components/ResultadosRelatorio';

type Step = 'form' | 'recording' | 'processing' | 'results';

interface FormData {
  nomeTecnico: string;
  numeroSerie: string;
  contrato: string;
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

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [results, setResults] = useState<ProcessingResults | null>(null);

  const handleFormNext = (data: FormData) => {
    setFormData(data);
    setCurrentStep('recording');
  };

  const handleRecordingNext = (blob: Blob) => {
    setVideoBlob(blob);
    setCurrentStep('processing');
  };

  const handleRecordingBack = () => {
    setCurrentStep('form');
  };

  const handleProcessingComplete = (processingResults: ProcessingResults) => {
    setResults(processingResults);
    setCurrentStep('results');
  };

  const handleNewAnalysis = () => {
    setCurrentStep('form');
    setFormData(null);
    setVideoBlob(null);
    setResults(null);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'form':
        return <FormularioInicial onNext={handleFormNext} />;
      
      case 'recording':
        return (
          <GravacaoVideo 
            onNext={handleRecordingNext} 
            onBack={handleRecordingBack}
          />
        );
      
      case 'processing':
        return videoBlob ? (
          <ProcessamentoVideo 
            videoBlob={videoBlob} 
            onComplete={handleProcessingComplete}
          />
        ) : null;
      
      case 'results':
        return formData && results ? (
          <ResultadosRelatorio 
            formData={formData}
            results={results}
            onNewAnalysis={handleNewAnalysis}
          />
        ) : null;
      
      default:
        return <FormularioInicial onNext={handleFormNext} />;
    }
  };

  return renderCurrentStep();
};

export default Index;