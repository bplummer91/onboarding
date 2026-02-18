import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, BookOpen, ExternalLink, Search, CheckCircle2 } from "lucide-react";
import ResourceCard from "@/components/resources/ResourceCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

/**
 * LearningCenter (Enhanced)
 *
 * Existing behavior retained:
 * - Phase filtering on Resource.phases includes phaseToUse
 * - Search + type tabs + ResourceCard grid
 *
 * New:
 * - Action Items checklist per phase (from Canva binder)
 * - Progress tracking via Base44 entity AgentActionProgress (if present)
 *   - Fallback to localStorage if entity not created yet
 */

const PHASE_LABELS = {
  initial_call: "Initial Call",
  pre_licensing: "Pre-Licensing",
  taking_exam: "Taking Exam",
  licensing: "Licensing",
  contracting: "Contracting",
  onboarding_complete: "Onboarding Complete",
};

// Canva-derived action items (you can later move these into a Base44 entity)
const ACTION_ITEMS_BY_PHASE = {
  initial_call: [
    {
      key: "initial_call.create_work_email",
      order: 10,
      title: "Create your work email",
      description: "Create a work email in this format: FirstLast.pinnacle@gmail.com.",
      link_url: null,
      required: true,
    },
    {
      key: "initial_call.connect_onboarding_manager",
      order: 20,
      title: "Connect with your onboarding manager",
      description: "Send a quick intro message and confirm your next checkpoint.",
      link_url: null,
      required: true,
    },
    {
      key: "initial_call.join_discord",
      order: 30,
      title: "Join the Pinnacle Discord",
      description: "Join Discord and confirm you can see announcements and training rooms.",
      link_url: "https://discord.gg/pinnaclelifegroup",
      required: true,
    },
  ],

  pre_licensing: [
    {
      key: "pre_licensing.sign_up_xcel",
      order: 10,
      title: "Sign up for Xcel Solutions",
      description: "Start your pre-licensing course to prepare for the state exam.",
      link_url:
        "https://www.xcelsolutions.com/?utm_campaign=WS%20-%20National%20-%20Brand&utm_content=Brand&utm_source=google&utm_medium=g&utm_term=xcel%20solutions&utm_id=19187571241&matchtype=e&network=g&device=c&gad_source=1&gad_campaignid=19187571241&gbraid=0AAAAACtEPw-bwRdjqeLJqFfIeZSgMVqgb&gclid=Cj0KCQjwm93DBhD_ARIsADR_DjGRHap_XJXbhQixGo7pIDlEepY7_j6xqRohCQGSboQgy8m2yTNl87IaAj8XEALw_wcB",
      required: true,
    },
    {
      key: "pre_licensing.finish_course_fast",
      order: 20,
      title: "Complete the pre-licensing course quickly",
      description: "Goal: complete in 2 weeks or less. Treat it like a sprint.",
      link_url: null,
      required: true,
    },
    {
      key: "pre_licensing.schedule_exam",
      order: 30,
      title: "Schedule your state exam",
      description: "Schedule your exam no more than 2 weeks out.",
      link_url: "http://prepare2pass.com/requirements",
      required: true,
    },
    {
      key: "pre_licensing.complete_certificate",
      order: 40,
      title: "Earn your course completion certificate",
      description: "Finish the course and save your completion certificate.",
      link_url: null,
      required: true,
    },
  ],

  taking_exam: [
    {
      key: "taking_exam.confirm_exam_details",
      order: 10,
      title: "Confirm exam requirements",
      description: "Verify location, time, ID requirements, and arrival window.",
      link_url: "http://prepare2pass.com/requirements",
      required: true,
    },
    {
      key: "taking_exam.take_exam",
      order: 20,
      title: "Take your state exam",
      description: "After you finish, record your result immediately.",
      link_url: null,
      required: true,
    },
    {
      key: "taking_exam.disclosures_ready",
      order: 30,
      title: "Prepare disclosures (if applicable)",
      description:
        "If you have a felony/misdemeanor or other disclosures, be truthful and gather documents early.",
      link_url: null,
      required: false,
    },
  ],

  licensing: [
    {
      key: "licensing.apply_for_license",
      order: 10,
      title: "Apply for your license",
      description: "Apply after you pass (complete fingerprints if your state requires it).",
      link_url: "http://prepare2pass.com/requirements",
      required: true,
    },
    {
      key: "licensing.print_license",
      order: 20,
      title: "Print/save your active license",
      description: "Once active, print/save a copy of your license for contracting.",
      link_url: "https://nipr.com/help/print-your-license",
      required: true,
    },
    {
      key: "licensing.lookup_npn",
      order: 30,
      title: "Look up and save your NPN",
      description: "Find your NPN and keep it handy for contracting.",
      link_url: "https://nipr.com/help/look-up-your-npn",
      required: true,
    },
    {
      key: "licensing.connect_training_access",
      order: 40,
      title: "Confirm training access with your onboarding manager",
      description: "Confirm you have training access and are ready to start contracting ASAP.",
      link_url: null,
      required: false,
    },
  ],

  contracting: [
    {
      key: "contracting.banking_info",
      order: 10,
      title: "Prepare banking information",
      description:
        "Voided check OR direct deposit slip that includes a picture of a check (name, address, bank, routing, account).",
      link_url: null,
      required: true,
    },
    {
      key: "contracting.beneficiary_info",
      order: 20,
      title: "Gather beneficiary information",
      description: "SSN, DOB, email, address, phone number.",
      link_url: null,
      required: true,
    },
    {
      key: "contracting.purchase_eo",
      order: 30,
      title: "Purchase E&O insurance",
      description: "E&O is required before submitting contracting.",
      link_url: null,
      required: true,
    },
    {
      key: "contracting.drivers_license_pdf",
      order: 40,
      title: "Save a PDF copy of your driver’s license",
      description: "Have a clear copy ready for carriers that require it.",
      link_url: null,
      required: true,
    },
    {
      key: "contracting.supporting_docs",
      order: 50,
      title: "Collect supporting documents (if applicable)",
      description: "Name changes, bankruptcies, felonies, court docs, etc.",
      link_url: null,
      required: false,
    },
    {
      key: "contracting.contracting_course",
      order: 60,
      title: "Complete the Contracting Walkthrough Course",
      description:
        "Complete the course, then notify admin you finished all steps so they can submit the ticket to corporate.",
      link_url: "https://pinnaclelife.mykajabi.com/offers/eZkY6zDx/checkout",
      required: true,
    },
    {
      key: "contracting.agent_academy_login",
      order: 70,
      title: "Agent Academy Login",
      description: "Use this to access your training platform.",
      link_url: "https://pinnacleagentacademy.com/login",
      required: false,
    },
    {
      key: "contracting.watch_email",
      order: 80,
      title: "Watch email for carrier contracting steps",
      description: "Complete each carrier portal setup and save your logins.",
      link_url: null,
      required: true,
    },
  ],

  onboarding_complete: [
    {
      key: "complete.enroll_new_agent_academy",
      order: 10,
      title: "Enroll in New Agent Academy",
      description:
        "Complete pre-recorded modules (~8 hours) and get scheduled for next week’s live New Agent Training (Monday).",
      link_url: "https://register.pinnacleagentsuccess.com",
      required: true,
    },
    {
      key: "complete.attend_live_training",
      order: 20,
      title: "Attend live New Agent Trainings",
      description: "Add to your calendar, attend with camera on, take notes, and participate.",
      link_url: null,
      required: true,
    },
    {
      key: "complete.role_play_with_mentor",
      order: 30,
      title: "Work with mentor/upline",
      description: "Role play, refine scripts, discuss lead strategy, and prepare to help clients.",
      link_url: null,
      required: true,
    },
    {
      key: "complete.book_of_business_tracker",
      order: 40,
      title: "Start your Book of Business tracker",
      description:
        "Track every client, policy details, beneficiary info, notes, and paid status to prevent missed payouts.",
      link_url:
        "https://docs.google.com/spreadsheets/d/1_3H80JHMstpHt_-xYMZfh604b_wXq0BAIEOnRQvpaxE/edit?usp=sharing",
      required: true,
    },
    {
      key: "complete.support_links",
      order: 50,
      title: "Know where to get support",
      description: "Use the corporate website + agent portal for updates and support.",
      link_url: "https://www.thepinnaclelifegroup.com",
      required: false,
    },
    {
      key: "complete.agent_portal_link",
      order: 60,
      title: "Open the Agent Portal",
      description: "Bookmark the portal for day-to-day access.",
      link_url: "https://pinnacleagentportal.com",
      required: false,
    },
  ],
};

function safeLocalStorageKey(agentId, phase) {
  return `learningCenter.actionProgress.${agentId || "unknown"}.${phase || "unknown"}`;
}

export default function LearningCenter({
  phaseOverride = null,
  hideBack = false,
  backTo = "AgentPortal",
  titleOverride = null,
  subtitleOverride = null,
  defaultType = "all",
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState(defaultType);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: agents = [] } = useQuery({
    queryKey: ["myAgent", user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allAgents = await base44.entities.Agent.list();
      return allAgents.filter((a) => a.email === user.email);
    },
    enabled: !!user,
  });

  const agent = agents[0];

  // Phase selection priority:
  // 1) prop override
  // 2) URL query param (?phase=pre_licensing)
  // 3) agent.phase
  const phaseFromQuery = params.get("phase");
  const phaseToUse = phaseOverride || phaseFromQuery || agent?.phase || null;

  // -----------------------------
  // Action Items (Checklist)
  // -----------------------------
  const actionItems = useMemo(() => {
    const items = ACTION_ITEMS_BY_PHASE[phaseToUse] || [];
    return [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [phaseToUse]);

  // Try to load persisted progress from Base44 entity AgentActionProgress.
  // If that entity doesn't exist yet, we fall back to localStorage.
  const { data: actionProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ["agentActionProgress", agent?.id, phaseToUse],
    queryFn: async () => {
      if (!agent?.id || !phaseToUse) return [];

      // Fallback first (localStorage) in case Base44 entity doesn't exist.
      const fallback = () => {
        try {
          const raw = localStorage.getItem(safeLocalStorageKey(agent.id, phaseToUse));
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];
          return parsed;
        } catch {
          return [];
        }
      };

      try {
        // If AgentActionProgress exists, this will succeed.
        // Expected fields: agent_id, phase, action_key, completed, completed_at
        const all = await base44.entities.AgentActionProgress.list();
        return (all || []).filter((p) => p.agent_id === agent.id && p.phase === phaseToUse);
      } catch (e) {
        return fallback();
      }
    },
    enabled: !!agent?.id && !!phaseToUse,
  });

  const completedMap = useMemo(() => {
    // Normalize progress into: { [action_key]: boolean }
    const map = {};
    for (const p of actionProgress || []) {
      // Base44 version
      if (p?.action_key) map[p.action_key] = !!p.completed;
      // localStorage fallback version
      if (p?.key) map[p.key] = !!p.completed;
    }
    return map;
  }, [actionProgress]);

  const requiredItems = useMemo(() => actionItems.filter((a) => a.required !== false), [actionItems]);
  const completedRequiredCount = useMemo(() => {
    return requiredItems.reduce((acc, item) => acc + (completedMap[item.key] ? 1 : 0), 0);
  }, [requiredItems, completedMap]);

  const progressPercent = useMemo(() => {
    if (!requiredItems.length) return 0;
    return Math.round((completedRequiredCount / requiredItems.length) * 100);
  }, [completedRequiredCount, requiredItems.length]);

  const saveToLocalStorage = (nextProgressArray) => {
    try {
      localStorage.setItem(safeLocalStorageKey(agent?.id, phaseToUse), JSON.stringify(nextProgressArray));
    } catch {
      // ignore
    }
  };

  const toggleActionMutation = useMutation({
    mutationFn: async ({ actionKey, nextCompleted }) => {
      if (!agent?.id || !phaseToUse) throw new Error("Missing agent or phase");

      // If entity exists, upsert there; otherwise localStorage.
      try {
        const all = await base44.entities.AgentActionProgress.list();
        const existing = (all || []).find(
          (p) => p.agent_id === agent.id && p.phase === phaseToUse && p.action_key === actionKey
        );

        if (existing?.id) {
          await base44.entities.AgentActionProgress.update(existing.id, {
            completed: nextCompleted,
            completed_at: nextCompleted ? new Date().toISOString() : null,
          });
          return { storage: "base44", updatedId: existing.id };
        }

        await base44.entities.AgentActionProgress.create({
          agent_id: agent.id,
          phase: phaseToUse,
          action_key: actionKey,
          completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null,
        });
        return { storage: "base44", created: true };
      } catch (e) {
        // localStorage fallback
        const key = safeLocalStorageKey(agent.id, phaseToUse);
        let current = [];
        try {
          current = JSON.parse(localStorage.getItem(key) || "[]");
          if (!Array.isArray(current)) current = [];
        } catch {
          current = [];
        }

        const idx = current.findIndex((x) => x?.key === actionKey);
        if (idx >= 0) {
          current[idx] = { ...current[idx], completed: nextCompleted, completed_at: new Date().toISOString() };
        } else {
          current.push({ key: actionKey, completed: nextCompleted, completed_at: new Date().toISOString() });
        }

        saveToLocalStorage(current);
        return { storage: "localStorage" };
      }
    },
    onMutate: async ({ actionKey, nextCompleted }) => {
      const queryKey = ["agentActionProgress", agent?.id, phaseToUse];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData(queryKey);

      // optimistic update
      queryClient.setQueryData(queryKey, (old) => {
        const arr = Array.isArray(old) ? [...old] : [];
        const isBase44Shape = arr.some((x) => x && "action_key" in x);

        if (isBase44Shape) {
          const idx = arr.findIndex((x) => x.action_key === actionKey);
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], completed: nextCompleted, completed_at: new Date().toISOString() };
          } else {
            arr.push({
              id: `tmp_${actionKey}`,
              agent_id: agent?.id,
              phase: phaseToUse,
              action_key: actionKey,
              completed: nextCompleted,
              completed_at: new Date().toISOString(),
            });
          }
          return arr;
        }

        // localStorage shape
        const idx = arr.findIndex((x) => x.key === actionKey);
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], completed: nextCompleted, completed_at: new Date().toISOString() };
        } else {
          arr.push({ key: actionKey, completed: nextCompleted, completed_at: new Date().toISOString() });
        }
        return arr;
      });

      return { previous, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previous && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      toast.error(err?.message || "Failed to update action item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentActionProgress", agent?.id, phaseToUse] });
    },
  });

  // -----------------------------
  // Resources (existing behavior)
  // -----------------------------
  const { data: allResources = [] } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.list(),
  });

  const resources = useMemo(() => {
    return (allResources || [])
      .filter((r) => phaseToUse && r.phases?.includes(phaseToUse))
      .filter((r) => {
        const matchesSearch =
          r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeType === "all" || r.type === activeType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allResources, phaseToUse, searchTerm, activeType]);

  const typeCounts = useMemo(() => {
    return {
      all: resources.length,
      document: resources.filter((r) => r.type === "document").length,
      video: resources.filter((r) => r.type === "video").length,
      link: resources.filter((r) => r.type === "link").length,
    };
  }, [resources]);

  // Keep existing guard pattern
  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = titleOverride || "Learning Center";
  const pageSubtitle = subtitleOverride || "Resources for your current phase: ";

  const phaseLabel = PHASE_LABELS[phaseToUse] || phaseToUse || "unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {!hideBack && (
          <Button variant="ghost" onClick={() => navigate(createPageUrl(backTo))} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Button>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600">
              {pageSubtitle}
              <span className="font-semibold capitalize">{phaseLabel}</span>
            </p>
          </div>
        </div>

        {/* Action Items */}
        <Card className="mb-6 shadow-lg border-2 border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Action Items</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Complete these to move through <span className="font-semibold">{phaseLabel}</span>.
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {requiredItems.length ? (
                    <>
                      <span className="font-semibold text-gray-900">{completedRequiredCount}</span>/
                      {requiredItems.length} required
                    </>
                  ) : (
                    "No required items"
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">{progressPercent}% complete</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {actionItems.length === 0 ? (
              <div className="py-6 text-center text-gray-600">No action items configured for this phase yet.</div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => {
                  const checked = !!completedMap[item.key];
                  return (
                    <div
                      key={item.key}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => {
                            const nextCompleted = !!val;
                            toggleActionMutation.mutate({ actionKey: item.key, nextCompleted });
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${checked ? "text-gray-500 line-through" : "text-gray-900"}`}>
                              {item.title}
                            </p>
                            {item.required !== false && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Required
                              </span>
                            )}
                            {checked && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Done
                              </span>
                            )}
                          </div>
                          {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:justify-end">
                        {item.link_url && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(item.link_url, "_blank", "noopener,noreferrer")}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Link
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {progressLoading && (
                  <div className="text-xs text-gray-500 mt-2">
                    Loading saved progress…
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search + type tabs (existing resources UX) */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={activeType} onValueChange={setActiveType} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-4 w-full md:w-auto">
                  <TabsTrigger value="all">All ({typeCounts.all})</TabsTrigger>
                  <TabsTrigger value="document">Docs ({typeCounts.document})</TabsTrigger>
                  <TabsTrigger value="video">Videos ({typeCounts.video})</TabsTrigger>
                  <TabsTrigger value="link">Links ({typeCounts.link})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Resources grid */}
        {resources.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">
                {searchTerm ? "Try adjusting your search criteria" : "Check back soon for new learning materials"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
