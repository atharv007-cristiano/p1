import React, { useState } from 'react';
import { 
  IconSearch, 
  IconFilter, 
  IconDownload, 
  IconTrash, 
  IconChevronLeft, 
  IconChevronRight,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconInbox,
  IconCheck,
  IconFileSpreadsheet
} from '@tabler/icons-react';
import { useStore } from '../store';
import { Card, Button, Badge, cn } from './shared';

interface HistoryItem {
  id: string;
  file_name: string;
  file_type: 'video' | 'audio' | 'image';
  trust_score: number;
  verdict: 'approved' | 'review' | 'rejected';
  scanned_at: string;
  file_size: string;
}

export const HistoryDashboard: React.FC = () => {
  const { setActiveScan } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'approved' | 'review' | 'rejected'>('all');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Premium mock forensic archive data representing deep audits
  const [historyLogs, setHistoryLogs] = useState<HistoryItem[]>([
    {
      id: 'ds_log_101',
      file_name: 'cfo_financial_report_broadcast.mp4',
      file_type: 'video',
      trust_score: 0.23,
      verdict: 'rejected',
      scanned_at: '2026-05-22T17:42:00Z',
      file_size: '48.9 MB'
    },
    {
      id: 'ds_log_102',
      file_name: 'cryptographic_press_release.jpg',
      file_type: 'image',
      trust_score: 1.00,
      verdict: 'approved',
      scanned_at: '2026-05-22T16:12:00Z',
      file_size: '1.2 MB'
    },
    {
      id: 'ds_log_103',
      file_name: 'pr_announcement_deep_spliced.mp3',
      file_type: 'audio',
      trust_score: 0.42,
      verdict: 'review',
      scanned_at: '2026-05-22T15:04:00Z',
      file_size: '8.4 MB'
    },
    {
      id: 'ds_log_104',
      file_name: 'q3_earnings_executive_call.mp4',
      file_type: 'video',
      trust_score: 0.96,
      verdict: 'approved',
      scanned_at: '2026-05-22T12:30:00Z',
      file_size: '124.5 MB'
    },
    {
      id: 'ds_log_105',
      file_name: 'identity_passport_scan.webp',
      file_type: 'image',
      trust_score: 0.18,
      verdict: 'rejected',
      scanned_at: '2026-05-22T10:15:00Z',
      file_size: '3.1 MB'
    },
    {
      id: 'ds_log_106',
      file_name: 'compliance_audio_briefing.ogg',
      file_type: 'audio',
      trust_score: 0.55,
      verdict: 'review',
      scanned_at: '2026-05-22T09:02:00Z',
      file_size: '14.2 MB'
    },
    {
      id: 'ds_log_107',
      file_name: 'vp_strategy_onboarding.mp4',
      file_type: 'video',
      trust_score: 0.94,
      verdict: 'approved',
      scanned_at: '2026-05-21T18:22:00Z',
      file_size: '89.1 MB'
    }
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Filtering logic
  const filteredLogs = historyLogs.filter(log => {
    const matchesSearch = log.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerdict = verdictFilter === 'all' || log.verdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  // 2. Pagination mapping
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 3. Select / Bulk controls
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allSelected: Record<string, boolean> = {};
      paginatedLogs.forEach(log => {
        allSelected[log.id] = true;
      });
      setSelectedItems(allSelected);
    } else {
      setSelectedItems({});
    }
  };

  const getSelectedCount = () => {
    return Object.values(selectedItems).filter(Boolean).length;
  };

  const handleBulkExport = (type: 'csv' | 'pdf') => {
    const count = getSelectedCount();
    if (count === 0) {
      showToast('Please select at least one incident record to export.');
      return;
    }
    showToast(`Bulk exporting ${count} incident records as ${type.toUpperCase()}...`);
    setSelectedItems({});
  };

  const handleBulkDelete = () => {
    const count = getSelectedCount();
    if (count === 0) return;
    
    const idsToDelete = Object.keys(selectedItems).filter(id => selectedItems[id]);
    setHistoryLogs(prev => prev.filter(log => !idsToDelete.includes(log.id)));
    setSelectedItems({});
    showToast(`Successfully deleted ${count} audit logs.`);
  };

  const handleInspectRow = (row: HistoryItem) => {
    // Generate detailed scan report model matching inspect target
    const mockScan = {
      success: true,
      provenance_verified: row.verdict === 'approved',
      bypass_inference: false,
      trust_score: row.trust_score,
      status_code: 'LOG_INSPECT_LOAD',
      action: (row.verdict === 'approved' ? 'AUTO_APPROVE' : row.verdict === 'rejected' ? 'AUTO_REJECT' : 'HUMAN_REVIEW') as any,
      message: `Audit inspection load for: ${row.file_name}`,
      latency_ms: 20.4,
      modality_breakdown: {
        visual_score: row.file_type !== 'audio' ? (row.verdict === 'approved' ? 0.92 : 0.24) : null,
        audio_score: row.file_type !== 'image' ? (row.verdict === 'approved' ? 0.88 : 0.16) : null,
        semantic_consistency: row.file_type === 'video' ? (row.verdict === 'approved' ? 0.95 : 0.35) : null,
        behavioral_score: row.file_type === 'video' ? (row.verdict === 'approved' ? 0.97 : 0.18) : null,
        cross_modal_inconsistency_score: row.verdict === 'rejected' ? 0.82 : 0.05,
        weighed_audio_visual_sync_dtw: row.file_type === 'video' ? (row.verdict === 'rejected' ? 0.65 : 0.10) : null,
        nlp_cosine_similarity: row.file_type === 'video' ? (row.verdict === 'approved' ? 0.94 : 0.45) : null
      },
      grounding: {
        bbox: [140, 90, 260, 260],
        manipulated_audio_seconds: row.verdict === 'rejected' ? [3.2, 6.4] : [0, 0]
      },
      explainability: {
        modal_attribution: {
          'Visual SRM': row.verdict === 'rejected' ? 0.44 : 0.04,
          'RawNet3 Vocoder': row.verdict === 'rejected' ? 0.72 : 0.03,
          'Landmarks DTW': row.verdict === 'rejected' ? 0.68 : 0.05
        }
      }
    };
    setActiveScan(mockScan);
    useStore.getState().setActiveTab('detect');
  };

  const getVerdictBadge = (verdict: HistoryItem['verdict']) => {
    if (verdict === 'approved') return <Badge variant="success">Approved</Badge>;
    if (verdict === 'rejected') return <Badge variant="danger">Rejected</Badge>;
    return <Badge variant="warning">Review</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score < 0.3) return 'text-[#A32D2D]';
    if (score >= 0.3 && score <= 0.6) return 'text-[#D97706]';
    return 'text-[#0F6E56]';
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none animate-slide-up">
      
      {/* 1. Header and search row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-4">
        <div>
          <h2 className="text-base font-medium text-[#111111] dark:text-white leading-none">Forensic Audit Trail</h2>
          <p className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1">Archived log logs of verified metadata, neural scoring, and human gate audits</p>
        </div>

        {/* Bulk Action Buttons */}
        {getSelectedCount() > 0 && (
          <div className="flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#1A1A1A] p-1.5 rounded-elem border-thin-gray animate-slide-up">
            <span className="text-[10px] text-[#888888] font-medium px-2">{getSelectedCount()} selected</span>
            <Button size="sm" variant="secondary" className="h-7 text-xs flex items-center gap-1.5" onClick={() => handleBulkExport('csv')}>
              <IconFileSpreadsheet className="w-3.5 h-3.5" />
              CSV
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs flex items-center gap-1.5" onClick={() => handleBulkExport('pdf')}>
              <IconDownload className="w-3.5 h-3.5" />
              PDF
            </Button>
            <Button size="sm" variant="danger" className="h-7 text-xs flex items-center gap-1.5" onClick={handleBulkDelete}>
              <IconTrash className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* 2. Filters & Search Box Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] dark:bg-[#161616] p-4 rounded-card border-thin-gray transition-colors duration-200">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search files by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs rounded-elem border border-[#E5E5E5] dark:border-[#2C2C2C] pl-8 pr-3 py-2 text-[#333333] dark:text-white focus:outline-none focus:border-[#0C447C]"
          />
          <IconSearch className="absolute left-2.5 top-2.5 w-4 h-4 text-[#888888] stroke-[1.5]" />
        </div>

        {/* Filter buttons tabs */}
        <div className="flex items-center gap-1 bg-[#F5F5F5] dark:bg-[#222222] p-1 rounded-elem">
          {(['all', 'approved', 'review', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setVerdictFilter(tab);
                setCurrentPage(1);
              }}
              className={cn(
                "px-3 py-1 text-[10px] uppercase tracking-wider rounded-elem font-medium transition-colors select-none",
                verdictFilter === tab
                  ? "bg-white dark:bg-[#161616] text-[#111111] dark:text-white shadow-sm"
                  : "text-[#666666] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-white"
              )}
            >
              {tab === 'review' ? 'review needed' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Data Table */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-[#161616] border-thin-gray transition-colors duration-200">
        {paginatedLogs.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 bg-[#FAFAFA] dark:bg-[#1A1A1A] text-[10px] uppercase tracking-wider font-medium text-[#888888] h-10 select-none">
                  <th className="px-5 w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      className="rounded border-[#E5E5E5] dark:border-[#2C2C2C] focus:ring-0 focus:ring-offset-0 text-[#0C447C]"
                    />
                  </th>
                  <th className="px-5 font-medium">File Name</th>
                  <th className="px-5 font-medium">Format</th>
                  <th className="px-5 font-medium">Trust Score</th>
                  <th className="px-5 font-medium">Verdict</th>
                  <th className="px-5 font-medium">Scanned Date</th>
                  <th className="px-5 font-medium text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]/60 dark:divide-[#2C2C2C]/60 text-xs text-[#333333] dark:text-[#E0E0E0]">
                {paginatedLogs.map((log) => {
                  const FileIcon = log.file_type === 'video' ? IconVideo : log.file_type === 'audio' ? IconMusic : IconPhoto;
                  const isChecked = !!selectedItems[log.id];

                  return (
                    <tr 
                      key={log.id} 
                      className={cn(
                        "h-12 hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors",
                        isChecked && "bg-[#0C447C]/5 dark:bg-[#0C447C]/5"
                      )}
                    >
                      {/* Checkbox selector */}
                      <td className="px-5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectItem(log.id)}
                          className="rounded border-[#E5E5E5] dark:border-[#2C2C2C] focus:ring-0 focus:ring-offset-0 text-[#0C447C]"
                        />
                      </td>

                      {/* File Name */}
                      <td className="px-5 font-medium text-[#111111] dark:text-white truncate max-w-[240px]">
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 shrink-0 text-[#888888]" />
                          <span>{log.file_name}</span>
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="px-5 font-mono text-[10px] text-[#666666] dark:text-[#A0A0A0]">{log.file_size}</td>

                      {/* Sparkline & Trust Score */}
                      <td className="px-5">
                        <div className="flex items-center gap-3">
                          <span className={cn("font-medium font-mono", getScoreColor(log.trust_score))}>
                            {log.trust_score.toFixed(2)}
                          </span>
                          {/* Sparkline track representation */}
                          <div className="h-1 w-16 bg-[#F5F5F5] dark:bg-[#222222] rounded-pill overflow-hidden relative shrink-0">
                            <div 
                              className={cn(
                                "h-full rounded-pill",
                                log.trust_score < 0.3 ? "bg-[#A32D2D]" : log.trust_score <= 0.6 ? "bg-[#D97706]" : "bg-[#0F6E56]"
                              )}
                              style={{ width: `${log.trust_score * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Verdict Badge */}
                      <td className="px-5">{getVerdictBadge(log.verdict)}</td>

                      {/* Timestamp */}
                      <td className="px-5 text-[#666666] dark:text-[#A0A0A0] font-mono text-[10px]">
                        {new Date(log.scanned_at).toLocaleString()}
                      </td>

                      {/* Inspection button */}
                      <td className="px-5 text-right">
                        <button
                          onClick={() => handleInspectRow(log)}
                          className="text-xs text-[#0C447C] dark:text-blue-400 hover:underline font-medium select-none"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* SVG Illustrated Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none animate-slide-up">
            <IconInbox className="w-12 h-12 text-[#888888] dark:text-[#555555] stroke-[1.2] mb-3" />
            <h4 className="text-sm font-medium text-[#111111] dark:text-white mb-1">No Scans Found</h4>
            <p className="text-xs text-[#888888] dark:text-[#A0A0A0] max-w-xs leading-normal">
              No matching records exist inside our secure forensics ledger database.
            </p>
          </div>
        )}

        {/* 4. Table Footer & Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 bg-[#FAFAFA] dark:bg-[#1A1A1A] select-none text-xs">
            <span className="text-[#888888] dark:text-[#A0A0A0]">
              Showing page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0 flex items-center justify-center border-thin-gray"
              >
                <IconChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0 flex items-center justify-center border-thin-gray"
              >
                <IconChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* Incident Toasts */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161616] border border-[#0C447C]/30 text-white rounded-card shadow-lg p-3 flex items-center gap-3 animate-slide-up text-xs font-medium">
          <IconCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button className="text-[#888888] hover:text-white" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

    </div>
  );
};
