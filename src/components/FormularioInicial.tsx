import React, { useState } from 'react';
import { ArrowRight, User, Hash, FileText } from 'lucide-react';
import { useExitConfirmation } from '@/hooks/useExitConfirmation';

interface FormularioInicialProps {
  onNext: (data: FormData) => void;
}

interface FormData {
  nomeTecnico: string;
  numeroSerie: string;
  contrato: string;
}

interface FormErrors {
  nomeTecnico?: string;
  numeroSerie?: string;
  contrato?: string;
}

const FormularioInicial: React.FC<FormularioInicialProps> = ({ onNext }) => {
  const [formData, setFormData] = useState<FormData>({
    nomeTecnico: '',
    numeroSerie: '',
    contrato: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'nomeTecnico':
        if (!value.trim()) return 'Nome do técnico é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        break;
      case 'numeroSerie':
        if (!value.trim()) return 'Número de série é obrigatório';
        if (!/^\d+$/.test(value.trim())) return 'Número de série deve conter apenas números';
        break;
      case 'contrato':
        if (!value.trim()) return 'Contrato é obrigatório';
        if (value.trim().length < 3) return 'Contrato deve ter pelo menos 3 caracteres';
        break;
    }
    return undefined;
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key as keyof FormData, formData[key as keyof FormData]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });

    setErrors(newErrors);
    setTouched({ nomeTecnico: true, numeroSerie: true, contrato: true });

    if (Object.keys(newErrors).length === 0) {
      onNext(formData);
    }
  };

  const isFormValid = Object.values(formData).every(value => value.trim()) && 
                     Object.values(errors).every(error => !error);

  // Temporarily disabled to isolate recording issue
  // useExitConfirmation({ 
  //   when: hasData,
  //   message: 'Você tem certeza que deseja sair? Os dados do formulário serão perdidos.'
  // });

  return (
    <div className="min-h-screen bg-background p-4 animate-fade-in">
      <div className="max-w-md mx-auto pt-8">
        <div className="card-soft p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Análise de Vídeo Técnico
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados para iniciar a análise
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome do Técnico */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Nome do Técnico
              </label>
              <input
                type="text"
                value={formData.nomeTecnico}
                onChange={(e) => handleInputChange('nomeTecnico', e.target.value)}
                onBlur={() => handleBlur('nomeTecnico')}
                className={`input-field ${errors.nomeTecnico ? 'input-error' : ''}`}
                placeholder="Digite o nome completo"
              />
              {errors.nomeTecnico && (
                <p className="text-destructive text-sm mt-1">{errors.nomeTecnico}</p>
              )}
            </div>

            {/* Número de Série */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Hash className="inline w-4 h-4 mr-2" />
                Número de Série
              </label>
              <input
                type="text"
                value={formData.numeroSerie}
                onChange={(e) => handleInputChange('numeroSerie', e.target.value)}
                onBlur={() => handleBlur('numeroSerie')}
                className={`input-field ${errors.numeroSerie ? 'input-error' : ''}`}
                placeholder="Digite apenas números"
              />
              {errors.numeroSerie && (
                <p className="text-destructive text-sm mt-1">{errors.numeroSerie}</p>
              )}
            </div>

            {/* Contrato */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <FileText className="inline w-4 h-4 mr-2" />
                Contrato
              </label>
              <input
                type="text"
                value={formData.contrato}
                onChange={(e) => handleInputChange('contrato', e.target.value)}
                onBlur={() => handleBlur('contrato')}
                className={`input-field ${errors.contrato ? 'input-error' : ''}`}
                placeholder="Digite o número do contrato"
              />
              {errors.contrato && (
                <p className="text-destructive text-sm mt-1">{errors.contrato}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full btn-primary flex items-center justify-center gap-2 ${
                !isFormValid ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Avançar
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioInicial;