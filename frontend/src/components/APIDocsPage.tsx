import React, { useState } from 'react';
import { 
  IconCopy, 
  IconCheck, 
  IconEye, 
  IconEyeOff, 
  IconRefresh, 
  IconTerminal, 
  IconBrackets, 
  IconLock,
  IconArrowRight
} from '@tabler/icons-react';
import { useStore } from '../store';
import { Card, Button, Badge, cn } from './shared';

export const APIDocsPage: React.FC = () => {
  const { apiKey, regenerateApiKey, apiUsage } = useStore();
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tabs for endpoints
  const [activeEndpoint, setActiveEndpoint] = useState<'detect' | 'jobs' | 'stream'>('detect');
  // Tabs for SDK code block languages
  const [activeSdk, setActiveSdk] = useState<'python' | 'node' | 'curl'>('python');

  const copyToClipboard = (text: string, type: 'key' | 'code', codeId?: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (codeId) {
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Endpoint Details configurations
  const endpointDetails = {
    detect: {
      method: 'POST',
      path: '/api/v1/detect',
      desc: 'Ingest and forensic-inspect a single media asset asynchronously. DeepShield runs multi-modal analysis, extracts C2PA cryptographic envelopes, and routes to tiered gateways.',
      requestHeaders: {
        'Authorization': 'Bearer ds_live_...',
        'Content-Type': 'multipart/form-data'
      },
      requestBody: `{
  "file": "binary_data.mp4",
  "enable_vfm": true,
  "enable_afm": true,
  "enable_nscm": true,
  "enable_badm": true
}`,
      responseBody: `{
  "success": true,
  "job_id": "job_e9b74052f6b8969ea2dfdf9037c22998a4da07ea",
  "status": "QUEUED",
  "message": "Asset successfully ingested into inference queue."
}`
    },
    jobs: {
      method: 'GET',
      path: '/api/v1/jobs/{id}',
      desc: 'Retrieve computed forensic scores, explanations, attributions, and GradCAM overlays for a specific asynchronous background verification job.',
      requestHeaders: {
        'Authorization': 'Bearer ds_live_...'
      },
      requestBody: 'No request body required.',
      responseBody: `{
  "job_id": "job_e9b74052f6b8969ea2dfdf9037c22998a4da07ea",
  "status": "COMPLETE",
  "result": {
    "trust_score": 0.23,
    "action": "AUTO_REJECT",
    "provenance_verified": false,
    "latency_ms": 22.8,
    "modality_breakdown": {
      "visual_score": 0.28,
      "audio_score": 0.18,
      "semantic_consistency": 0.42,
      "behavioral_score": 0.22,
      "cross_modal_inconsistency_score": 0.88
    }
  }
}`
    },
    stream: {
      method: 'WS',
      path: '/ws/stream',
      desc: 'Stream raw camera sequences frame-by-frame using WebSockets and fetch real-time sub-100ms liveness diagnostics, blink counts, and rPPG offsets.',
      requestHeaders: {
        'Sec-WebSocket-Protocol': 'ds_live_...'
      },
      requestBody: 'Send raw JPEG ArrayBuffer frames sequentially.',
      responseBody: `{
  "success": true,
  "frame_index": 34,
  "trust_score": 0.94,
  "action": "AUTO_APPROVE",
  "visual_score": 0.92,
  "bbox": [120, 85, 240, 240]
}`
    }
  };

  // SDK installation codes
  const sdkSnippets = {
    python: `import requests

url = "https://api.deepshield.ai/api/v1/detect"
headers = {
    "Authorization": "Bearer ${apiKey}"
}
files = {
    "file": open("ceo_broadcast.mp4", "rb")
}

response = requests.post(url, headers=headers, files=files)
print(response.json())`,
    node: `const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const form = new FormData();
form.append('file', fs.createReadStream('ceo_broadcast.mp4'));

axios.post('https://api.deepshield.ai/api/v1/detect', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer ${apiKey}'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`,
    curl: `curl -X POST https://api.deepshield.ai/api/v1/detect \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "file=@ceo_broadcast.mp4"`
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none animate-slide-up pb-12">
      
      {/* Title */}
      <div className="border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-4">
        <h2 className="text-base font-medium text-[#111111] dark:text-white leading-none">Developer API Reference</h2>
        <p className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1 font-medium">Integrate multimodal deepfake detection inside enterprise security flows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Key Management and SDK Install snippet */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Key Manager Card */}
          <Card className="bg-white dark:bg-[#161616] p-5 border-thin-gray flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-[#333333] dark:text-white font-medium border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-2">
              <IconLock className="w-4 h-4 text-[#0C447C] stroke-[1.5]" />
              <span>Inference Authentication</span>
            </div>

            {/* Input field */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-[10px] text-[#888888] font-medium uppercase tracking-wider">Secret API Key</label>
              <div className="flex items-center gap-1 bg-[#F5F5F5] dark:bg-[#111111] rounded-elem border-thin-gray px-2.5 py-1.5">
                <input
                  type={showKey ? 'text' : 'password'}
                  readOnly
                  value={apiKey}
                  className="bg-transparent text-[11px] font-mono border-none outline-none text-[#333333] dark:text-[#E0E0E0] flex-1 select-all"
                />
                <button onClick={() => setShowKey(!showKey)} className="text-[#888888] hover:text-[#111111] dark:hover:text-white">
                  {showKey ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
                <button onClick={() => copyToClipboard(apiKey, 'key')} className="text-[#888888] hover:text-[#111111] dark:hover:text-white">
                  {copiedKey ? <IconCheck className="w-4 h-4 text-[#0F6E56]" /> : <IconCopy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button size="sm" variant="ghost" className="h-8 text-[10px] flex items-center justify-center gap-1.5 mt-1" onClick={regenerateApiKey}>
              <IconRefresh className="w-3.5 h-3.5" />
              Regenerate API credentials
            </Button>

            {/* Usage meters limit */}
            <div className="flex flex-col gap-2 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pt-4 mt-2">
              <div className="flex justify-between text-[10px] font-medium uppercase text-[#888888]">
                <span>Monthly Query Limit</span>
                <span className="font-mono">{apiUsage.current} / {apiUsage.limit} calls</span>
              </div>
              <div className="h-1.5 w-full bg-[#F5F5F5] dark:bg-[#222222] rounded-pill overflow-hidden">
                <div 
                  className="h-full bg-[#0C447C] rounded-pill" 
                  style={{ width: `${(apiUsage.current / apiUsage.limit) * 100}%` }} 
                />
              </div>
              <p className="text-[10px] text-[#888888] font-normal leading-normal mt-0.5">
                Key automatically rate-limited at 60 scans/min per client address.
              </p>
            </div>
          </Card>

          {/* Quick install card */}
          <Card className="bg-white dark:bg-[#161616] p-5 border-thin-gray flex flex-col gap-3">
            <h4 className="text-xs font-medium text-[#111111] dark:text-white leading-none">Standard Client SDK</h4>
            <p className="text-xs text-[#888888] dark:text-[#A0A0A0] leading-normal font-normal">
              Execute deep audits natively inside Python services and NodeJS backends with our packaged libraries.
            </p>
            <div className="bg-[#F5F5F5] dark:bg-[#111111] rounded-elem p-2 border-thin-gray flex items-center justify-between mt-1">
              <span className="text-[10px] font-mono text-[#333333] dark:text-[#A0A0A0]">pip install deepshield-sdk</span>
              <button 
                onClick={() => copyToClipboard('pip install deepshield-sdk', 'code', 'install_py')}
                className="text-[#888888] hover:text-[#111111] dark:hover:text-white"
              >
                {copiedCode === 'install_py' ? <IconCheck className="w-3.5 h-3.5 text-[#0F6E56]" /> : <IconCopy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="bg-[#F5F5F5] dark:bg-[#111111] rounded-elem p-2 border-thin-gray flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#333333] dark:text-[#A0A0A0]">npm i @deepshield/node-sdk</span>
              <button 
                onClick={() => copyToClipboard('npm i @deepshield/node-sdk', 'code', 'install_node')}
                className="text-[#888888] hover:text-[#111111] dark:hover:text-white"
              >
                {copiedCode === 'install_node' ? <IconCheck className="w-3.5 h-3.5 text-[#0F6E56]" /> : <IconCopy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </Card>
        </div>

        {/* Right: Endpoint Spec Reference */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <Card className="bg-white dark:bg-[#161616] p-5 border-thin-gray flex flex-col gap-4">
            
            {/* Endpoint filter selectors */}
            <div className="flex items-center gap-1.5 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-3">
              {(['detect', 'jobs', 'stream'] as const).map(tab => {
                const spec = endpointDetails[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveEndpoint(tab)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-elem text-xs font-medium transition-colors select-none",
                      activeEndpoint === tab
                        ? "bg-[#0C447C]/10 text-[#0C447C] dark:bg-[#0C447C]/20 dark:text-[#E0E0E0]"
                        : "text-[#666666] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-white"
                    )}
                  >
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-pill font-mono font-medium leading-none",
                      spec.method === 'POST' ? 'bg-[#0C447C]/10 text-[#0C447C]' :
                      spec.method === 'GET' ? 'bg-[#0F6E56]/10 text-[#0F6E56]' : 'bg-[#D97706]/10 text-[#D97706]'
                    )}>
                      {spec.method}
                    </span>
                    <span>{spec.path}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Endpoint Description */}
            <div className="flex flex-col gap-2 mt-1">
              <p className="text-xs text-[#666666] dark:text-[#A0A0A0] leading-relaxed font-normal">
                {endpointDetails[activeEndpoint].desc}
              </p>
            </div>

            {/* Request Payload JSON reference */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center justify-between text-[10px] text-[#888888] font-medium uppercase tracking-wider">
                <span>Request Payload Reference</span>
              </div>
              <div className="bg-[#FAFAFA] dark:bg-[#111111] rounded-elem border-thin-gray p-4 font-mono text-[11px] text-[#333333] dark:text-[#E0E0E0] overflow-x-auto relative">
                <pre>{endpointDetails[activeEndpoint].requestBody}</pre>
              </div>
            </div>

            {/* Response Payload JSON reference */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center justify-between text-[10px] text-[#888888] font-medium uppercase tracking-wider">
                <span>Success Response (200 OK)</span>
                <button 
                  onClick={() => copyToClipboard(endpointDetails[activeEndpoint].responseBody, 'code', 'resp')}
                  className="text-[#888888] hover:text-[#111111] dark:hover:text-white flex items-center gap-1 capitalize font-normal font-sans text-[10px]"
                >
                  {copiedCode === 'resp' ? (
                    <>
                      <IconCheck className="w-3.5 h-3.5 text-[#0F6E56]" /> Copied!
                    </>
                  ) : (
                    <>
                      <IconCopy className="w-3.5 h-3.5" /> Copy JSON
                    </>
                  )}
                </button>
              </div>
              <div className="bg-[#FAFAFA] dark:bg-[#111111] rounded-elem border-thin-gray p-4 font-mono text-[11px] text-[#333333] dark:text-[#E0E0E0] overflow-x-auto">
                <pre className="text-blue-600 dark:text-blue-400">{endpointDetails[activeEndpoint].responseBody}</pre>
              </div>
            </div>

          </Card>

          {/* Bottom SDK implementation Snippet */}
          <Card className="bg-white dark:bg-[#161616] p-5 border-thin-gray flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-3">
              <div className="flex items-center gap-1.5 text-xs text-[#333333] dark:text-white font-medium">
                <IconTerminal className="w-4 h-4 text-[#0F6E56] stroke-[1.5]" />
                <span>Quick Integration SDK Boilerplate</span>
              </div>
              <div className="flex items-center gap-1 bg-[#F5F5F5] dark:bg-[#222222] p-0.5 rounded-elem">
                {(['python', 'node', 'curl'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setActiveSdk(lang)}
                    className={cn(
                      "px-2 py-1 text-[9px] uppercase tracking-wider rounded-elem font-medium transition-colors select-none",
                      activeSdk === lang
                        ? "bg-white dark:bg-[#161616] text-[#111111] dark:text-white shadow-xs"
                        : "text-[#666666] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-white"
                    )}
                  >
                    {lang === 'node' ? 'NodeJS' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>
            </div>

            {/* SDK Code Snippet Panel */}
            <div className="relative bg-[#FAFAFA] dark:bg-[#111111] rounded-elem border-thin-gray p-4 font-mono text-[11px] text-[#333333] dark:text-[#E0E0E0] overflow-x-auto min-h-[140px]">
              <pre>{sdkSnippets[activeSdk]}</pre>
              <button 
                onClick={() => copyToClipboard(sdkSnippets[activeSdk], 'code', 'sdk')}
                className="absolute top-3.5 right-3.5 text-[#888888] hover:text-[#111111] dark:hover:text-white p-1 rounded bg-[#FFFFFF]/60 dark:bg-[#161616]/60 border-thin-gray flex items-center justify-center"
              >
                {copiedCode === 'sdk' ? <IconCheck className="w-4 h-4 text-[#0F6E56]" /> : <IconCopy className="w-4 h-4" />}
              </button>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
