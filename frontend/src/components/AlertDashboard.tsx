import React, { useState } from 'react';
import { Shield, Check, X, Server, AlertOctagon, Terminal } from 'lucide-react';
import { AuditLog, HumanReviewTicket } from '../types';

interface AlertDashboardProps {
  logs: AuditLog[];
  reviewTickets: HumanReviewTicket[];
  onTicketResolved: () => void;
}

export const AlertDashboard: React.FC<AlertDashboardProps> = ({
  logs,
  reviewTickets,
  onTicketResolved
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'queue' | 'webhooks'>('logs');
  const [comments, setComments] = useState<Record<number, string>>({});
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const resolveTicket = async (ticketId: number, status: 'APPROVED' | 'REJECTED') => {
    setResolvingId(ticketId);
    try {
      const response = await fetch(`/api/v1/human-queue/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          status,
          reviewer_comments: comments[ticketId] || 'Manual override confirmation.'
        })
      });

      if (!response.ok) throw new Error('Resolution failed.');
      
      // Notify parent to refresh states
      onTicketResolved();
      // Clear specific comments index
      setComments(prev => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'AUTO_APPROVE':
      case 'HUMAN_APPROVED':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">APPROVED</span>;
      case 'AUTO_REJECT':
      case 'HUMAN_REJECTED':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">REJECTED</span>;
      case 'HUMAN_REVIEW':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">REVIEW REQ</span>;
      default:
        return <span className="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-md font-bold text-slate-200">Security Control Hub</h2>
          <p className="text-xs text-slate-400">Oversight queues, network webhooks, and compliance audits</p>
        </div>

        <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'logs' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'queue' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Review Queue
            {reviewTickets.length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {reviewTickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'webhooks' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Webhooks Registry
          </button>
        </div>
      </div>

      {activeTab === 'logs' && (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-semibold">
                <th className="pb-3 font-medium">Asset Name</th>
                <th className="pb-3 font-medium">Provenance</th>
                <th className="pb-3 font-medium">Trust Score</th>
                <th className="pb-3 font-medium">Status Action</th>
                <th className="pb-3 font-medium">Latency</th>
                <th className="pb-3 font-medium">Ingested At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/10">
                  <td className="py-3 font-semibold text-slate-200 max-w-[200px] truncate">{log.file_name}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      log.c2pa_status === 'authentic' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-950 text-slate-500'
                    }`}>
                      {log.c2pa_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-bold text-slate-100">{Math.round(log.trust_score * 100)}%</td>
                  <td className="py-3">{getActionBadge(log.action_taken)}</td>
                  <td className="py-3 font-mono text-slate-400">{Math.round(log.latency_ms)}ms</td>
                  <td className="py-3 text-slate-400">{new Date(log.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">No forensic records found in audit logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="flex flex-col gap-4">
          {reviewTickets.map((ticket) => (
            <div key={ticket.id} className="border border-slate-900 bg-slate-950/20 rounded-xl p-5 flex flex-col md:flex-row gap-5 justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-200">{ticket.audit_log.file_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: #{ticket.id}</span>
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                  <span>Trust index: <strong className="text-slate-200">{Math.round(ticket.audit_log.trust_score * 100)}%</strong></span>
                  <span>Type: <strong className="text-slate-200 uppercase">{ticket.audit_log.file_type}</strong></span>
                  <span>SHA256: <strong className="text-slate-200 font-mono text-[10px]">{ticket.audit_log.file_hash.substring(0, 16)}...</strong></span>
                </div>

                {/* Comment box */}
                <input
                  type="text"
                  placeholder="Annotate review override explanation..."
                  value={comments[ticket.id] || ''}
                  onChange={(e) => setComments({ ...comments, [ticket.id]: e.target.value })}
                  className="bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 mt-1 max-w-md w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => resolveTicket(ticket.id, 'APPROVED')}
                  disabled={resolvingId === ticket.id}
                  className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Check className="h-4 w-4" />
                  Approve Asset
                </button>
                <button
                  onClick={() => resolveTicket(ticket.id, 'REJECTED')}
                  disabled={resolvingId === ticket.id}
                  className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <X className="h-4 w-4" />
                  Reject Threat
                </button>
              </div>
            </div>
          ))}
          {reviewTickets.length === 0 && (
            <div className="text-center py-8 text-slate-500 border border-slate-900 border-dashed rounded-xl">
              Manual review queue is empty. High system confidence.
            </div>
          )}
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="flex flex-col gap-5">
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 flex gap-3.5">
            <Server className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-200">Tiered Gateway Webhook System</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                When Trust Score falls below 0.3, the Reality Defender gateway fires parallel JSON payloads to all registered endpoints, signaling security alerts.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2">
              <span>Configured Targets (SIEM / SOC)</span>
              <span>Callback Type</span>
            </div>
            
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-900/40">
              <span className="font-mono text-slate-200">https://security-siem.enterprise.corp/api/v1/deepfake-alerts</span>
              <span className="text-slate-400 flex items-center gap-1.5"><AlertOctagon className="h-3.5 w-3.5 text-red-500" /> SIEM POST</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-mono text-slate-200">https://compliance-audit.enterprise.corp/webhooks/synthetic-media</span>
              <span className="text-slate-400 flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5 text-slate-400" /> AUDIT POST</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
