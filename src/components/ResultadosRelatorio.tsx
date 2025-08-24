import React from 'react';
import { Download, RotateCcw, User, Hash, FileText, Clock, Monitor, HardDrive, Image, BarChart3 } from 'lucide-react';
import JSZip from 'jszip';

interface ResultadosRelatorioProps {
  formData: {
    nomeTecnico: string;
    numeroSerie: string;
    contrato: string;
  };
  results: {
    frames: string[];
    analysis: {
      duration: number;
      frameCount: number;
      resolution: string;
      fileSize: string;
    };
  };
  onNewAnalysis: () => void;
  videoBlob?: Blob; // Adiciona o vídeo original
}

const ResultadosRelatorio: React.FC<ResultadosRelatorioProps> = ({
  formData,
  results,
  onNewAnalysis,
  videoBlob
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDownloadReport = async () => {
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // Abordagem específica para iOS - gerar arquivo menor e abrir em nova aba
        const reportData = {
          formData,
          results,
          timestamp: new Date().toISOString()
        };
        
        const reportText = `RELATÓRIO DE ANÁLISE DE VÍDEO TÉCNICO
===================================
Data/Hora (Brasília): ${new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Sao_Paulo'
        }).format(new Date())}
Técnico: ${formData.nomeTecnico}
Nº de Série: ${formData.numeroSerie}
Contrato: ${formData.contrato}
Arquivo: video_original.mp4
Duração (s): ${results.analysis.duration.toFixed(1)}

FRAMES EXTRAÍDOS:
${results.frames.map((_, index) => {
          const effectiveDuration = Math.max(0, results.analysis.duration - 0.01);
          const timePerFrame = results.frames.length > 1 ? (effectiveDuration / (results.frames.length - 1)) : 0;
          const timestamp = index * timePerFrame;
          return `- Frame ${String(index + 1).padStart(2, '0')} | t=${timestamp.toFixed(2)}s`;
        }).join('\n')}
        
ATENÇÃO: No iOS, baixe individualmente os frames usando toque longo em cada imagem.`;

        // Criar arquivo de texto simples para iOS
        const textBlob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(textBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_${formData.numeroSerie}_${new Date().toISOString().slice(0, 10)}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        
        // Mostrar instruções específicas para iOS
        alert('Relatório baixado! Para salvar os frames no iPhone:\n1. Toque longo em cada imagem\n2. Selecione "Salvar na Galeria"\n3. Use o menu "Compartilhar" para salvar em "Arquivos"');
        
      } else {
        // Abordagem padrão para outros navegadores
        const zip = new JSZip();
        
        // Adiciona o vídeo original se disponível
        if (videoBlob) {
          zip.file('video_original.mp4', videoBlob);
        }
        
        // Adiciona os frames como arquivos JPEG
        results.frames.forEach((frameData, index) => {
          // Remove o prefixo data:image/jpeg;base64, e converte para blob
          const base64Data = frameData.split(',')[1];
          const binaryData = atob(base64Data);
          const uint8Array = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
          }
          zip.file(`frame_${String(index + 1).padStart(2, '0')}.jpg`, uint8Array);
        });
        
        // Gera relatório TXT
        const now = new Date();
        const brasiliaTZ = new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Sao_Paulo'
        }).format(now);
        
        const reportTXT = `RELATÓRIO DE ANÁLISE DE VÍDEO TÉCNICO
===================================
Data/Hora (Brasília): ${brasiliaTZ}
Técnico: ${formData.nomeTecnico}
Nº de Série: ${formData.numeroSerie}
Contrato: ${formData.contrato}
Arquivo: video_original.mp4
Duração (s): ${results.analysis.duration.toFixed(1)}

FRAMES EXTRAÍDOS:
${results.frames.map((_, index) => {
          const effectiveDuration = Math.max(0, results.analysis.duration - 0.01);
          const timePerFrame = results.frames.length > 1 ? (effectiveDuration / (results.frames.length - 1)) : 0;
          const timestamp = index * timePerFrame;
          return `- Frame ${String(index + 1).padStart(2, '0')} | t=${timestamp.toFixed(2)}s`;
        }).join('\n')}`;
        
        zip.file('relatorio.txt', reportTXT);
        
        // Gera o arquivo ZIP
        const content = await zip.generateAsync({ type: 'blob' });
        
        // Download do arquivo
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `relatorio_video_${formData.numeroSerie}_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpa a URL do objeto
        setTimeout(() => {
          URL.revokeObjectURL(link.href);
        }, 100);
      }
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 animate-fade-in">
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-success-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Relatório de Análise
          </h1>
          <p className="text-muted-foreground">
            Análise completa do vídeo técnico
          </p>
        </div>

        {/* Resumo dos dados do técnico */}
        <div className="card-soft p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados do Técnico
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Técnico</p>
                <p className="font-medium text-foreground">{formData.nomeTecnico}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Hash className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Série</p>
                <p className="font-medium text-foreground">{formData.numeroSerie}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Contrato</p>
                <p className="font-medium text-foreground">{formData.contrato}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Análise do vídeo */}
        <div className="card-soft p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Análise do Vídeo
          </h2>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="font-medium text-foreground">{formatDuration(results.analysis.duration)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Monitor className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Resolução</p>
                <p className="font-medium text-foreground">{results.analysis.resolution}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <HardDrive className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Tamanho</p>
                <p className="font-medium text-foreground">{results.analysis.fileSize}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Image className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Frames</p>
                <p className="font-medium text-foreground">{results.analysis.frameCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vídeo Original */}
        {videoBlob && (
          <div className="card-soft p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vídeo Original
            </h2>
            
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                src={URL.createObjectURL(videoBlob)}
                controls
                className="w-full max-h-96 object-contain"
                preload="metadata"
              />
            </div>
            
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span>📁 Tamanho: {(videoBlob.size / (1024 * 1024)).toFixed(2)} MB</span>
              <span>⏱ Duração: {formatDuration(results.analysis.duration)}</span>
              <span>📐 Resolução: {results.analysis.resolution}</span>
            </div>
          </div>
        )}

        {/* Prévia dos Frames Extraídos */}
        <div className="card-soft p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Image className="w-5 h-5" />
            Frames Extraídos do Vídeo
          </h2>
          
          <div className="space-y-4">
            {/* Grid principal de frames */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{results.frames.map((frame, index) => {
                const effectiveDuration = Math.max(0, results.analysis.duration - 0.01);
                const per = results.frames.length > 1 ? effectiveDuration / (results.frames.length - 1) : 0;
                const secs = index * per;
                const timestamp = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
                
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                    {/* Cabeçalho do frame */}
                    <div className="bg-primary/5 px-4 py-2 border-b border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Frame {index + 1}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">⏱ {timestamp}</span>
                      </div>
                    </div>
                    
                     {/* Imagem do frame */}
                    <div className="relative group cursor-pointer" onClick={() => {
                      // Modal para visualização em tela cheia
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4';
                      modal.innerHTML = `
                        <div class="relative max-w-6xl max-h-full">
                          <img src="${frame}" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Frame ${index + 1} em tela cheia" />
                          <div class="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                            <div class="font-medium">Frame ${index + 1}</div>
                            <div class="text-sm opacity-80">Timestamp: ${timestamp}</div>
                          </div>
                          <button class="absolute top-4 right-4 text-white bg-black/70 hover:bg-black/90 rounded-full p-3 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      `;
                      modal.onclick = (e) => {
                        if (e.target === modal || e.target === modal.querySelector('button') || e.target === modal.querySelector('svg') || e.target === modal.querySelector('line')) {
                          document.body.removeChild(modal);
                        }
                      };
                      document.body.appendChild(modal);
                    }}>
                      <div className="aspect-video bg-muted/30">
                        <img
                          src={frame}
                          alt={`Frame ${index + 1} extraído do vídeo no timestamp ${timestamp}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onContextMenu={(e) => {
                            // Permitir menu de contexto para salvar imagem
                            e.stopPropagation();
                          }}
                        />
                      </div>
                      
                      {/* Overlay com informações */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                        <div className="text-white">
                          <div className="text-sm font-medium">Clique para ampliar</div>
                          <div className="text-xs opacity-80">Resolução: {results.analysis.resolution}</div>
                        </div>
                        <div className="text-white text-right">
                          <div className="text-xs opacity-80">#{index + 1}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rodapé com informações técnicas */}
                    <div className="px-4 py-3 bg-muted/20">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>📐 {results.analysis.resolution}</span>
                        <span>🕐 {timestamp}</span>
                        <span>📊 JPEG</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Resumo da galeria */}
            <div className="bg-success border border-success/30 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-foreground rounded-full flex items-center justify-center">
                  <Image className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-medium text-success-foreground">Frames Extraídos com Sucesso</h3>
                  <p className="text-sm text-success-foreground/90 mt-1">
                    {results.frames.length} frames capturados automaticamente do vídeo original • Clique em qualquer frame para visualizar em tela cheia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções para iPhone */}
        {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Instruções para iPhone</h3>
                <p className="text-sm text-blue-700 mt-1">
                  • Pressione e segure cada imagem para salvar na Galeria<br/>
                  • Use o botão "Compartilhar" para salvar em Arquivos<br/>
                  • O relatório de texto será baixado automaticamente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleDownloadReport}
            className="btn-success flex items-center justify-center gap-2 px-8"
          >
            <Download className="w-5 h-5" />
            {/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'Baixar Relatório TXT' : 'Download Relatório ZIP'}
          </button>
          
          <button
            onClick={onNewAnalysis}
            className="btn-secondary flex items-center justify-center gap-2 px-8"
          >
            <RotateCcw className="w-5 h-5" />
            Nova Análise
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultadosRelatorio;