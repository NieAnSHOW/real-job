/** Contracts for later integrations; no analysis execution or persistence is implemented yet. */
export interface CompanyEvidence {
  evidenceId: string;
  entityId: string;
  claim: string;
  quote: string;
  sourceUrl: string;
  publishedAt: string | null;
  eventDate: string | null;
  retrievedAt: string;
  contentLevel: 'summary' | 'full_text';
  verificationStatus: 'unverified' | 'verified' | 'conflicting';
}

export type CompanyRating = 'excellent' | 'acceptable' | 'avoid';

interface ReportBase {
  reportId: string;
  entityId: string;
  evidenceRefs: string[];
  unknowns: string[];
  policyVersion: string;
  generatedAt: string;
}

/** Non-rated reports cannot accidentally carry a conclusive rating. */
export type CompanyReport = ReportBase & (
  | { status: 'rated'; rating: CompanyRating }
  | {
      status: 'insufficient_evidence' | 'entity_unresolved' | 'needs_review' | 'failed';
      rating: null;
    }
);

export type AnalysisStage =
  | 'created'
  | 'resolving_entity'
  | 'awaiting_confirmation'
  | 'searching'
  | 'extracting'
  | 'awaiting_evidence_review'
  | 'deciding'
  | 'validating'
  | 'completed'
  | 'paused'
  | 'interrupted_unknown'
  | 'failed'
  | 'cancelled';

export interface LocalAnalysis {
  jobId: string;
  entityId: string | null;
  snapshotHash: string;
  stage: AnalysisStage;
  remainingAttempts: number;
  remainingActiveTimeMs: number;
  pendingCall: { callId: string; providerId: 'deepseek' | 'lingdt'; startedAt: string } | null;
  updatedAt: string;
}
