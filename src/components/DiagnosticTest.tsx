import React, { useState, useRef } from 'react';

const DiagnosticTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [step, setStep] = useState<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().slice(11, 23);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DIAGNOSTIC] ${message}`);
  };

  const test1_GetUserMedia = async () => {
    addLog('🚀 TESTE 1: Iniciando getUserMedia...');
    setStep(1);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      streamRef.current = stream;
      addLog(`✅ TESTE 1: Stream obtido - ${stream.getTracks().length} tracks`);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        addLog('✅ TESTE 1: Stream conectado ao video element');
      }
      
      setStep(2);
    } catch (error) {
      addLog(`❌ TESTE 1 FALHOU: ${error}`);
    }
  };

  const test2_VideoPlay = async () => {
    addLog('🚀 TESTE 2: Tentando fazer play do vídeo...');
    
    if (!videoRef.current) {
      addLog('❌ TESTE 2: Video ref não existe');
      return;
    }
    
    try {
      await videoRef.current.play();
      addLog('✅ TESTE 2: Vídeo iniciado com sucesso');
      setStep(3);
    } catch (error) {
      addLog(`⚠️ TESTE 2: Auto-play falhou (normal): ${error}`);
      // Tentar fazer play via user interaction
      videoRef.current.muted = true;
      try {
        await videoRef.current.play();
        addLog('✅ TESTE 2: Vídeo iniciado (muted)');
        setStep(3);
      } catch (error2) {
        addLog(`❌ TESTE 2 FALHOU: ${error2}`);
      }
    }
  };

  const test3_CreateRecorder = async () => {
    addLog('🚀 TESTE 3: Criando MediaRecorder...');
    
    if (!streamRef.current) {
      addLog('❌ TESTE 3: Stream não disponível');
      return;
    }
    
    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm'
      });
      
      addLog(`✅ TESTE 3: MediaRecorder criado - State: ${recorder.state}`);
      
      let dataReceived = false;
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        dataReceived = true;
        chunks.push(event.data);
        addLog(`📊 TESTE 3: Dados recebidos (${event.data.size} bytes)`);
      };
      
      recorder.onstop = () => {
        addLog('⏹️ TESTE 3: Gravação parada');
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          addLog(`✅ TESTE 3: Blob criado (${blob.size} bytes)`);
          setStep(5);
        } else {
          addLog('❌ TESTE 3: Nenhum dado gravado');
        }
      };
      
      recorder.onerror = (event) => {
        addLog(`❌ TESTE 3: Erro no recorder: ${event}`);
      };
      
      recorder.start();
      addLog(`✅ TESTE 3: Gravação iniciada - State: ${recorder.state}`);
      setStep(4);
      
      // Para automaticamente após 3 segundos
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          addLog('⏱️ TESTE 3: Parando gravação (timeout)');
        }
      }, 3000);
      
    } catch (error) {
      addLog(`❌ TESTE 3 FALHOU: ${error}`);
    }
  };

  const resetTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setLogs([]);
    setStep(0);
    addLog('🔄 Teste resetado');
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">
            🔬 DIAGNÓSTICO TÉCNICO
          </h1>
          
          <div className="mb-6">
            <h2 className="font-bold mb-2">Progresso:</h2>
            <div className="flex gap-2">
              {[0,1,2,3,4,5].map(i => (
                <div 
                  key={i} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= i ? 'bg-green-500 text-white' : 'bg-gray-300'
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              onClick={test1_GetUserMedia}
              disabled={step !== 0}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              1. Testar Câmera
            </button>
            
            <button 
              onClick={test2_VideoPlay}
              disabled={step !== 2}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              2. Testar Vídeo
            </button>
            
            <button 
              onClick={test3_CreateRecorder}
              disabled={step !== 3}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              3. Testar Gravação
            </button>
            
            <button 
              onClick={resetTest}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              🔄 Reset
            </button>
          </div>

          {/* Video preview */}
          <div className="mb-6">
            <h3 className="font-bold mb-2">Preview da Câmera:</h3>
            <div className="bg-black rounded-lg overflow-hidden w-full h-48">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Logs */}
          <div>
            <h3 className="font-bold mb-2">Logs Detalhados:</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">Aguardando início do teste...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTest;