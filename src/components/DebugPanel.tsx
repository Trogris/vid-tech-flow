import React, { useState, useEffect } from 'react';

interface DebugInfo {
  platform: string;
  userAgent: string;
  mediaDevicesSupported: boolean;
  mediaRecorderSupported: boolean;
  supportedMimeTypes: string[];
  screenSize: string;
  currentTime: string;
}

const DebugPanel: React.FC<{ show: boolean }> = ({ show }) => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    if (!show) return;

    const gatherDebugInfo = async () => {
      const info: DebugInfo = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        mediaDevicesSupported: !!(navigator.mediaDevices?.getUserMedia),
        mediaRecorderSupported: typeof MediaRecorder !== 'undefined',
        supportedMimeTypes: [],
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        currentTime: new Date().toISOString()
      };

      // Test supported MIME types
      if (typeof MediaRecorder !== 'undefined') {
        const testTypes = [
          'video/mp4',
          'video/mp4; codecs="avc1.42E01E"',
          'video/webm',
          'video/webm; codecs="vp8"',
          'video/webm; codecs="vp9"',
          'video/webm; codecs="h264"'
        ];

        info.supportedMimeTypes = testTypes.filter(type => 
          MediaRecorder.isTypeSupported(type)
        );
      }

      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, [show]);

  if (!show || !debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 rounded-lg p-4 max-w-md text-xs font-mono z-50 shadow-lg">
      <h3 className="font-bold text-red-600 mb-2">🐛 DEBUG INFO</h3>
      
      <div className="space-y-1">
        <div><strong>Platform:</strong> {debugInfo.platform}</div>
        <div><strong>UA:</strong> {debugInfo.userAgent.substring(0, 50)}...</div>
        <div><strong>Screen:</strong> {debugInfo.screenSize}</div>
        <div><strong>MediaDevices:</strong> {debugInfo.mediaDevicesSupported ? '✅' : '❌'}</div>
        <div><strong>MediaRecorder:</strong> {debugInfo.mediaRecorderSupported ? '✅' : '❌'}</div>
        
        <div><strong>Supported MIME:</strong></div>
        {debugInfo.supportedMimeTypes.length > 0 ? (
          <ul className="ml-2">
            {debugInfo.supportedMimeTypes.map(type => (
              <li key={type}>✅ {type}</li>
            ))}
          </ul>
        ) : (
          <div className="text-red-500">❌ No supported types</div>
        )}
        
        <div className="mt-2">
          <strong>Time:</strong> {debugInfo.currentTime}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;