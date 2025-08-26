import { useEffect, useCallback } from 'react';

interface UseExitConfirmationProps {
  when: boolean;
  message?: string;
}

export const useExitConfirmation = ({ 
  when, 
  message = 'Você tem certeza que deseja sair? Todos os dados não salvos serão perdidos.' 
}: UseExitConfirmationProps) => {
  
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (when) {
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  }, [when, message]);

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (when) {
      const confirmExit = window.confirm(message);
      if (!confirmExit) {
        // Impede a navegação para trás
        window.history.pushState(null, '', window.location.href);
      }
    }
  }, [when, message]);

  useEffect(() => {
    if (when) {
      // Adiciona um estado ao histórico para interceptar o botão voltar
      window.history.pushState(null, '', window.location.href);
      
      // Eventos para desktop e mobile
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [when, handleBeforeUnload, handlePopState]);
};