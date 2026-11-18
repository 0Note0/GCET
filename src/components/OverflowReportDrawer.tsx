import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ImagePlus, Send, X } from 'lucide-react';
import { IssueType, OverflowReport, ReporterRole, SmartBin } from '../types/waste';
import { validateEvidenceImageFile } from '../utils/security';

interface OverflowReportDrawerProps {
  isOpen: boolean;
  bins: SmartBin[];
  initialBinId?: string;
  onClose: () => void;
  onSubmitReport: (payload: {
    binId: string;
    reporterName: string;
    campusId: string;
    role: ReporterRole;
    issueType: IssueType;
    urgency: 'Standard' | 'Urgent';
    notes: string;
    evidenceDataUrl?: string;
  }) => Promise<OverflowReport>;
  onJumpToDashboard: () => void;
}

export const OverflowReportDrawer: React.FC<OverflowReportDrawerProps> = ({
  isOpen,
  bins,
  initialBinId,
  onClose,
  onSubmitReport,
  onJumpToDashboard,
}) => {
  const [binId, setBinId] = useState(initialBinId || bins[0]?.id || 'bin-102');
  const [reporterName, setReporterName] = useState('');
  const [campusId, setCampusId] = useState('');
  const [role, setRole] = useState<ReporterRole>('Student');
  const [issueType, setIssueType] = useState<IssueType>('Bin Overflowing');
  const [urgency, setUrgency] = useState<'Standard' | 'Urgent'>('Urgent');
  const [notes, setNotes] = useState('');
  const [evidenceDataUrl, setEvidenceDataUrl] = useState<string | undefined>(undefined);
  const [evidenceFileName, setEvidenceFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<OverflowReport | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSubmittedTicket(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialBinId) setBinId(initialBinId);
  }, [initialBinId]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) {
      setEvidenceDataUrl(undefined);
      setEvidenceFileName('');
      return;
    }

    try {
      const result = await validateEvidenceImageFile(file);
      if (!result.valid) {
        setErrorMessage(result.error || 'Invalid image file.');
        setEvidenceDataUrl(undefined);
        setEvidenceFileName('');
        return;
      }
      setEvidenceDataUrl(result.dataUrl);
      setEvidenceFileName(file.name);
    } catch {
      setErrorMessage('Could not read the selected photo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = reporterName.trim();
    const trimmedId = campusId.trim();

    if (trimmedName.length < 2) {
      setErrorMessage('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[a-zA-Z0-9_-]{4,32}$/.test(trimmedId)) {
      setErrorMessage('Campus ID must be 4-32 letters, numbers, or hyphens.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await onSubmitReport({
        binId,
        reporterName: trimmedName,
        campusId: trimmedId,
        role,
        issueType,
        urgency,
        notes: notes.trim(),
        evidenceDataUrl,
      });

      setSubmittedTicket(ticket);
      setNotes('');
      setEvidenceDataUrl(undefined);
      setEvidenceFileName('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to submit overflow report.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[1200] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-white h-full overflow-y-auto p-6 md:p-7 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5EFEA]">
                <div>
                  <h2 id="drawer-title" className="font-display text-xl font-bold text-[#0F1F18]">
                    Report Bin Overflow
                  </h2>
                  <p className="text-xs text-[#4C6459] mt-0.5">
                    Alerts notify GCET sanitation mobile crews immediately.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close report drawer"
                  className="p-1.5 rounded-md text-[#425A4F] hover:bg-[#EDF4F0] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#163A2B]"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {submittedTicket ? (
                <div className="py-8 space-y-4">
                  <div className="flex items-center gap-2 text-[#15803D]">
                    <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-lg font-bold text-[#0F1F18]">
                      Alert Dispatched Live
                    </h3>
                  </div>

                  <p className="text-sm text-[#3D574A]">
                    Ticket{' '}
                    <span className="font-mono font-bold text-[#0F1F18]">
                      {submittedTicket.ticketNumber}
                    </span>{' '}
                    for <strong>{submittedTicket.location}</strong> is now active on the campus
                    dashboard and EV collection route.
                  </p>

                  <div className="flex flex-col gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedTicket(null);
                        onClose();
                        onJumpToDashboard();
                      }}
                      className="w-full py-2.5 text-xs font-semibold text-white bg-[#163A2B] rounded-md hover:bg-[#0F2A1F] cursor-pointer"
                    >
                      View Notification on Live Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="w-full py-2.5 text-xs font-semibold text-[#163A2B] bg-[#E9F4EE] rounded-md hover:bg-[#D5E9DE] cursor-pointer"
                    >
                      Report Another Bin
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="drawer-bin"
                      className="block text-xs font-semibold text-[#0F1F18] mb-1"
                    >
                      Campus Bin Location
                    </label>
                    <select
                      id="drawer-bin"
                      value={binId}
                      onChange={(e) => setBinId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#C9DBD1] rounded-md text-[#0F1F18]"
                    >
                      {bins.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} — {b.name} ({b.fillLevel}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="drawer-name"
                      className="block text-xs font-semibold text-[#0F1F18] mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="drawer-name"
                      type="text"
                      maxLength={80}
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="e.g. Rohan Singh"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#C9DBD1] rounded-md"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="drawer-id"
                      className="block text-xs font-semibold text-[#0F1F18] mb-1"
                    >
                      Roll Number / Staff ID
                    </label>
                    <input
                      id="drawer-id"
                      type="text"
                      maxLength={32}
                      value={campusId}
                      onChange={(e) => setCampusId(e.target.value)}
                      placeholder="e.g. 2300970100084"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#C9DBD1] rounded-md"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#0F1F18] mb-1">Role</span>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[#EFF6F2] rounded-md">
                      {(['Student', 'Faculty', 'Staff'] as ReporterRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`py-1.5 text-xs font-medium rounded cursor-pointer ${
                            role === r ? 'bg-white text-[#0F1F18] shadow-xs' : 'text-[#425A4F]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="drawer-issue"
                        className="block text-xs font-semibold text-[#0F1F18] mb-1"
                      >
                        Issue
                      </label>
                      <select
                        id="drawer-issue"
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value as IssueType)}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-[#C9DBD1] rounded-md"
                      >
                        <option value="Bin Overflowing">Bin Overflowing</option>
                        <option value="Odor or Spill Hazard">Odor or Spill Hazard</option>
                        <option value="Sensor Offline">Sensor Offline</option>
                        <option value="Damaged Lid">Damaged Lid</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="drawer-urgency"
                        className="block text-xs font-semibold text-[#0F1F18] mb-1"
                      >
                        Urgency
                      </label>
                      <select
                        id="drawer-urgency"
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as 'Standard' | 'Urgent')}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-[#C9DBD1] rounded-md"
                      >
                        <option value="Urgent">Urgent (&lt; 15m)</option>
                        <option value="Standard">Standard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="drawer-evidence"
                      className="block text-xs font-semibold text-[#0F1F18] mb-1"
                    >
                      Photo Evidence (Optional · PNG/JPEG/WEBP ≤ 1MB)
                    </label>
                    <label
                      htmlFor="drawer-evidence"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#3D574A] bg-[#F7FBF9] border border-dashed border-[#B7CEC2] rounded-md cursor-pointer hover:border-[#163A2B]"
                    >
                      <ImagePlus className="w-4 h-4 text-[#163A2B] shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {evidenceFileName || 'Attach bin overflow photo...'}
                      </span>
                    </label>
                    <input
                      id="drawer-evidence"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="drawer-notes"
                      className="block text-xs font-semibold text-[#0F1F18] mb-1"
                    >
                      Location Note (Optional)
                    </label>
                    <textarea
                      id="drawer-notes"
                      rows={2}
                      maxLength={320}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Nearest classroom or gate..."
                      className="w-full px-3 py-2 text-sm bg-white border border-[#C9DBD1] rounded-md"
                    />
                  </div>

                  {errorMessage && (
                    <p role="alert" className="text-xs font-medium text-[#B91C1C]">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#163A2B] rounded-md hover:bg-[#0F2A1F] disabled:opacity-60 cursor-pointer"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Overflow Report'}</span>
                  </button>
                </form>
              )}
            </div>

            <div className="pt-4 mt-6 border-t border-[#E5EFEA] text-[11px] text-[#546E61] font-mono">
              GCET Knowledge Park II · 28.4568° N, 77.4976° E
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
