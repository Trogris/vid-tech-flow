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

        {/* Galeria de frames */}
        <div className="card-soft p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Image className="w-5 h-5" />
            Frames Extraídos
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {results.frames.map((frame, index) => (
              <div key={index} className="group relative">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                  <img
                    src={frame}
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onError={(e) => {
                      console.error(`Erro ao carregar frame ${index + 1}:`, e);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-muted">
                          <div class="text-center">
                            <div class="text-muted-foreground text-xs">Frame ${index + 1}</div>
                            <div class="text-muted-foreground text-xs">Erro ao carregar</div>
                          </div>
                        </div>
                      `;
                    }}
                    onLoad={() => {
                      console.log(`Frame ${index + 1} carregado com sucesso`);
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 
                              rounded-lg transition-all duration-300 flex items-center justify-center">
                  <span className="text-white font-medium opacity-0 group-hover:opacity-100 
                                 transition-opacity duration-300 bg-black/50 px-2 py-1 rounded text-sm">
                    Frame {index + 1}
                  </span>
                </div>
              </div>
            ))}
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