// Shared action items definition - single source of truth
export const ACTION_ITEMS_BY_PHASE = {
  initial_call: [
    { key: 'initial_call.create_work_email', order: 10, title: 'Create your work email', required: true },
    { key: 'initial_call.connect_onboarding_manager', order: 20, title: 'Connect with your onboarding manager', required: true },
    { key: 'initial_call.join_discord', order: 30, title: 'Join the Pinnacle Discord', required: true }
  ],
  pre_licensing: [
    { key: 'pre_licensing.sign_up_xcel', order: 10, title: 'Sign up for Xcel Solutions', required: true },
    { key: 'pre_licensing.finish_course_fast', order: 20, title: 'Complete the pre-licensing course quickly', required: true },
    { key: 'pre_licensing.schedule_exam', order: 30, title: 'Schedule your state exam', required: true }
  ],
  taking_exam: [
    { key: 'taking_exam.confirm_exam_requirements', order: 10, title: 'Confirm exam requirements', required: true },
    { key: 'taking_exam.take_exam', order: 20, title: 'Take your state exam', required: true },
    { key: 'taking_exam.disclosures_ready', order: 30, title: 'Prepare disclosures (if applicable)', required: false }
  ],
  licensing: [
    { key: 'licensing.apply_for_license', order: 10, title: 'Apply for your license', required: true },
    { key: 'licensing.print_license', order: 20, title: 'Print/save your active license', required: true },
    { key: 'licensing.lookup_npn', order: 30, title: 'Look up and save your NPN', required: true }
  ],
  contracting: [
    { key: 'contracting.banking_info', order: 10, title: 'Prepare banking information', required: true },
    { key: 'contracting.purchase_eo', order: 20, title: 'Purchase E&O insurance', required: true },
    { key: 'contracting.contracting_course', order: 30, title: 'Complete the Contracting Walkthrough Course', required: true }
  ],
  onboarding_complete: [
    { key: 'complete.enroll_new_agent_academy', order: 10, title: 'Enroll in New Agent Academy', required: true },
    { key: 'complete.book_of_business_tracker', order: 20, title: 'Start your Book of Business tracker', required: true },
    { key: 'complete.agent_portal_link', order: 30, title: 'Bookmark the Agent Portal', required: false }
  ]
};

export function getRequiredItems(phase) {
  return (ACTION_ITEMS_BY_PHASE[phase] || []).filter(i => i.required !== false);
}

export function calcProgressPercent(phase, progressRecords = []) {
  const required = getRequiredItems(phase);
  if (!required.length) return 0;
  const completedKeys = new Set(
    progressRecords
      .filter(p => p.completed)
      .map(p => p.action_key || p.key)
  );
  const done = required.filter(i => completedKeys.has(i.key)).length;
  return Math.round((done / required.length) * 100);
}