import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  CheckCircle,
  XCircle,
  Archive,
  Copy,
  Eye,
  Target,
  DollarSign,
  AlertTriangle,
  Clock,
  Brain
} from "lucide-react";
import type { MarketingProposal, CampaignDraft } from "@/lib/marketingAgentModels";

interface ProposalQueueProps {
  proposals: MarketingProposal[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function ProposalQueue({ proposals, onApprove, onReject, onArchive, onDuplicate }: ProposalQueueProps) {
  const [selectedProposal, setSelectedProposal] = useState<MarketingProposal | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [proposalToReject, setProposalToReject] = useState<string | null>(null);

  const draftProposals = proposals.filter(p => p.status === "draft" || p.status === "in_review");
  const approvedProposals = proposals.filter(p => p.status === "approved");
  const rejectedProposals = proposals.filter(p => p.status === "rejected" || p.status === "archived");

  const handleReject = () => {
    if (proposalToReject && rejectReason) {
      onReject(proposalToReject, rejectReason);
      setShowRejectDialog(false);
      setRejectReason("");
      setProposalToReject(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setProposalToReject(id);
    setShowRejectDialog(true);
  };

  const getStatusBadge = (status: MarketingProposal["status"]) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      in_review: { variant: "default", label: "In Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      archived: { variant: "outline", label: "Archived" }
    };
    const { variant, label } = variants[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const ProposalCard = ({ proposal }: { proposal: MarketingProposal }) => (
    <Card className="mb-3" data-testid={`proposal-${proposal.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              {proposal.strategy.messageAngle}
              {getStatusBadge(proposal.status)}
            </CardTitle>
            <CardDescription className="mt-1">
              {proposal.strategy.segment} • {proposal.strategy.channels.join(", ")}
            </CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>{new Date(proposal.createdAt).toLocaleDateString()}</div>
            <div className="flex items-center gap-1">
              <span className={`font-medium ${proposal.decisionLogEntry.confidence >= 70 ? "text-green-600" : "text-amber-600"}`}>
                {proposal.decisionLogEntry.confidence}%
              </span>
              confidence
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm line-clamp-2">{proposal.intentNarrative}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {proposal.campaignDrafts.length} campaigns
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ${proposal.budgetPlan.recommendedDailySpend}/day
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {proposal.strategy.timeline}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-2">
        <Button size="sm" variant="outline" onClick={() => setSelectedProposal(proposal)} data-testid={`button-view-${proposal.id}`}>
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        {(proposal.status === "draft" || proposal.status === "in_review") && (
          <>
            <Button size="sm" onClick={() => onApprove(proposal.id)} data-testid={`button-approve-${proposal.id}`}>
              <CheckCircle className="h-4 w-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openRejectDialog(proposal.id)} data-testid={`button-reject-${proposal.id}`}>
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDuplicate(proposal.id)} data-testid={`button-duplicate-${proposal.id}`}>
          <Copy className="h-4 w-4 mr-1" /> Duplicate
        </Button>
        {proposal.status !== "archived" && (
          <Button size="sm" variant="ghost" onClick={() => onArchive(proposal.id)} data-testid={`button-archive-${proposal.id}`}>
            <Archive className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposal Queue
          </CardTitle>
          <CardDescription>Review, approve, or reject AI-generated proposals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending Review {draftProposals.length > 0 && <Badge className="ml-1">{draftProposals.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedProposals.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected/Archived ({rejectedProposals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ScrollArea className="h-[400px]">
                {draftProposals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending proposals</p>
                    <p className="text-sm">Generate a new proposal to get started</p>
                  </div>
                ) : (
                  draftProposals.map(p => <ProposalCard key={p.id} proposal={p} />)
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="approved">
              <ScrollArea className="h-[400px]">
                {approvedProposals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No approved proposals</div>
                ) : (
                  approvedProposals.map(p => <ProposalCard key={p.id} proposal={p} />)
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="rejected">
              <ScrollArea className="h-[400px]">
                {rejectedProposals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No rejected or archived proposals</div>
                ) : (
                  rejectedProposals.map(p => <ProposalCard key={p.id} proposal={p} />)
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this proposal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this proposal is being rejected..."
                data-testid="input-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>Reject Proposal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Proposal Details
              {selectedProposal && getStatusBadge(selectedProposal.status)}
            </DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                <div>
                  <h3 className="font-semibold mb-2">Intent Narrative</h3>
                  <p className="p-3 bg-muted rounded">{selectedProposal.intentNarrative}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Strategy</h3>
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded">
                    <div><span className="text-muted-foreground">Segment:</span> {selectedProposal.strategy.segment}</div>
                    <div><span className="text-muted-foreground">Angle:</span> {selectedProposal.strategy.messageAngle}</div>
                    <div><span className="text-muted-foreground">Channels:</span> {selectedProposal.strategy.channels.join(", ")}</div>
                    <div><span className="text-muted-foreground">Timeline:</span> {selectedProposal.strategy.timeline}</div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">Assumptions:</p>
                    <ul className="list-disc list-inside text-sm">
                      {selectedProposal.strategy.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Campaign Drafts ({selectedProposal.campaignDrafts.length})</h3>
                  <div className="space-y-3">
                    {selectedProposal.campaignDrafts.map((draft, i) => (
                      <Card key={i} className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Badge variant="outline">{draft.type}</Badge>
                            {draft.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <p><strong>Copy:</strong> {draft.primaryText}</p>
                          <p><strong>CTA:</strong> {draft.cta}</p>
                          {draft.creativePrompt && (
                            <p><strong>Creative Prompt:</strong> {draft.creativePrompt}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant={draft.complianceChecklist.noGuarantees ? "default" : "destructive"}>
                              {draft.complianceChecklist.noGuarantees ? "✓" : "✗"} No Guarantees
                            </Badge>
                            <Badge variant={draft.complianceChecklist.noManipulativeUrgency ? "default" : "destructive"}>
                              {draft.complianceChecklist.noManipulativeUrgency ? "✓" : "✗"} No Urgency
                            </Badge>
                            <Badge variant={draft.complianceChecklist.privacyOK ? "default" : "destructive"}>
                              {draft.complianceChecklist.privacyOK ? "✓" : "✗"} Privacy OK
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Budget Plan</h3>
                    <div className="p-3 bg-muted rounded space-y-2">
                      <p><strong>Daily:</strong> ${selectedProposal.budgetPlan.recommendedDailySpend}</p>
                      <p><strong>Monthly:</strong> ${selectedProposal.budgetPlan.recommendedMonthlySpend}</p>
                      <div className="space-y-1 mt-2">
                        {selectedProposal.budgetPlan.allocationByChannel.map((a, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-24 text-sm">{a.channel}</span>
                            <Progress value={a.percentage} className="flex-1 h-2" />
                            <span className="text-sm text-muted-foreground">{a.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> Risks & Safeguards
                    </h3>
                    <div className="p-3 bg-muted rounded space-y-2">
                      <div>
                        <p className="text-sm font-medium">Risks:</p>
                        <ul className="list-disc list-inside text-sm">
                          {selectedProposal.risksAndSafeguards.risks.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-600">Stop Conditions:</p>
                        <ul className="list-disc list-inside text-sm">
                          {selectedProposal.risksAndSafeguards.stopConditions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Decision Log</h3>
                  <div className="p-3 bg-muted rounded space-y-2">
                    <p><strong>What:</strong> {selectedProposal.decisionLogEntry.what}</p>
                    <p><strong>Why:</strong> {selectedProposal.decisionLogEntry.why}</p>
                    <p><strong>Confidence:</strong> {selectedProposal.decisionLogEntry.confidence}%</p>
                    <p><strong>Autonomy Level:</strong> {selectedProposal.decisionLogEntry.autonomyLevel}</p>
                    {selectedProposal.decisionLogEntry.alternatives.length > 0 && (
                      <div>
                        <p className="font-medium">Alternatives Considered:</p>
                        <ul className="list-disc list-inside text-sm">
                          {selectedProposal.decisionLogEntry.alternatives.map((a, i) => (
                            <li key={i}><strong>{a.option}:</strong> {a.whyRejected}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {selectedProposal.humanRequests.questions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Questions for Human</h3>
                    <ul className="list-disc list-inside">
                      {selectedProposal.humanRequests.questions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            {selectedProposal && (selectedProposal.status === "draft" || selectedProposal.status === "in_review") && (
              <>
                <Button onClick={() => { onApprove(selectedProposal.id); setSelectedProposal(null); }}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button variant="destructive" onClick={() => { openRejectDialog(selectedProposal.id); setSelectedProposal(null); }}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setSelectedProposal(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
