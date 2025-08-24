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
      // Cria um ZIP otimizado com vídeo, frames e relatório
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `analise_tecnica_${formData.numeroSerie}_${timestamp}.zip`;
      
      // 1. Adiciona o vídeo original (se disponível)
      if (videoBlob) {
        zip.file(`video_original_${formData.numeroSerie}.mp4`, videoBlob);
      }
      
      // 2. Adiciona frames otimizados ao ZIP
      const framesFolder = zip.folder("frames_extraidos");
      for (let i = 0; i < results.frames.length; i++) {
        const frameData = results.frames[i];
        const base64Data = frameData.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Nomes descritivos para Windows/iOS
        const frameNumber = (i + 1).toString().padStart(2, '0');
        const timestamp = `${String(Math.floor((i * 15) / 60)).padStart(2, '0')}-${String((i * 15) % 60).padStart(2, '0')}`;
        framesFolder?.file(`Frame_${frameNumber}_Tempo_${timestamp}.jpg`, base64Data, { base64: true });
      }
      
      // Cria relatório HTML detalhado
      const reportHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Análise de Vídeo Técnico</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f8fafc;
        }
        .header { 
            text-align: center; 
            background: #3b82f6; 
            color: white; 
            padding: 30px; 
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .section { 
            background: white; 
            padding: 20px; 
            margin-bottom: 20px; 
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-top: 15px;
        }
        .item { 
            background: #f1f5f9; 
            padding: 15px; 
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
        }
        .item-label { 
            font-size: 12px; 
            color: #64748b; 
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .item-value { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1e293b;
        }
        .frames-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Análise de Vídeo Técnico</h1>
        <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
    </div>

    <div class="section">
        <h2>📋 Dados do Técnico</h2>
        <div class="grid">
            <div class="item">
                <div class="item-label">Técnico Responsável</div>
                <div class="item-value">${formData.nomeTecnico}</div>
            </div>
            <div class="item">
                <div class="item-label">Número de Série</div>
                <div class="item-value">${formData.numeroSerie}</div>
            </div>
            <div class="item">
                <div class="item-label">Contrato</div>
                <div class="item-value">${formData.contrato}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📊 Análise do Vídeo</h2>
        <div class="grid">
            <div class="item">
                <div class="item-label">Duração</div>
                <div class="item-value">${formatDuration(results.analysis.duration)}</div>
            </div>
            <div class="item">
                <div class="item-label">Resolução</div>
                <div class="item-value">${results.analysis.resolution}</div>
            </div>
            <div class="item">
                <div class="item-label">Tamanho do Arquivo</div>
                <div class="item-value">${results.analysis.fileSize}</div>
            </div>
            <div class="item">
                <div class="item-label">Frames Extraídos</div>
                <div class="item-value">${results.analysis.frameCount}</div>
            </div>
        </div>
        
        <div class="frames-note">
            <strong>📁 Arquivos Incluídos neste ZIP:</strong>
            <ul style="margin-top: 10px; margin-left: 20px; list-style-type: none;">
                <li>🎥 <strong>Vídeo Original:</strong> video_original_${formData.numeroSerie}.mp4 ${videoBlob ? `(${(videoBlob.size / (1024 * 1024)).toFixed(1)} MB)` : '(incluído)'}</li>
                <li>🖼️ <strong>Frames Extraídos:</strong> ${results.frames.length} imagens JPEG na pasta "frames_extraidos/"</li>
                <li>📄 <strong>Relatório HTML:</strong> relatorio.html (abra no navegador)</li>
                <li>📊 <strong>Dados JSON:</strong> dados.json (para sistemas externos)</li>
            </ul>
            <div style="margin-top: 15px; padding: 10px; background: #e0f2fe; border-radius: 5px;">
                <strong>💡 Como usar os arquivos:</strong>
                <br/>• <strong>Windows:</strong> Descompacte com WinRAR/7-Zip e abra relatorio.html
                <br/>• <strong>iOS:</strong> Use app Files, toque no ZIP para extrair
                <br/>• <strong>Frames:</strong> Cada imagem tem timestamp no nome para fácil identificação
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📈 Resumo da Análise</h2>
        <p><strong>Status:</strong> Análise concluída com sucesso</p>
        <p><strong>Método:</strong> Extração automática de frames em intervalos regulares</p>
        <p><strong>Qualidade:</strong> Resolução original preservada</p>
        <p><strong>Observações:</strong> Todos os frames foram processados e estão prontos para análise técnica detalhada.</p>
    </div>
</body>
</html>`;
      
      // Adiciona relatório HTML ao ZIP
      zip.file("relatorio.html", reportHtml);
      
      // Cria relatório JSON para integração
      const reportData = {
        tecnico: formData.nomeTecnico,
        numeroSerie: formData.numeroSerie,
        contrato: formData.contrato,
        analise: results.analysis,
        timestamp: new Date().toISOString(),
        frames: results.frames.length,
        versaoRelatorio: "1.0"
      };
      zip.file("dados.json", JSON.stringify(reportData, null, 2));
      
      // Gera e baixa o ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar o relatório ZIP. Tente novamente.');
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
                const timestamp = `${String(Math.floor((index * results.analysis.duration) / 10 / 60)).padStart(2, '0')}:${String(Math.floor((index * results.analysis.duration) / 10) % 60).padStart(2, '0')}`;
                
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
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                  <Image className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-success-foreground">Frames Extraídos com Sucesso</h3>
                  <p className="text-sm text-success-foreground/80 mt-1">
                    {results.frames.length} frames capturados automaticamente do vídeo original • Clique em qualquer frame para visualizar em tela cheia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleDownloadReport}
            className="btn-success flex items-center justify-center gap-2 px-8"
          >
            <Download className="w-5 h-5" />
            Download Relatório ZIP
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