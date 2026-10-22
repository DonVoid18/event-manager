const EVENT_COUNT = 50;
const TOTAL_ATTENDEES = 3948;
const TOTAL_SENT_INVITATIONS = 3384;
const TOTAL_CHECK_INS = 3291;

function allocation(total: number, index: number) {
  return Math.floor(total / EVENT_COUNT) + (index < total % EVENT_COUNT ? 1 : 0);
}

export interface ResearchDemoEventPlan {
  code: string;
  name: string;
  date: Date;
  attendees: number;
  sentInvitations: number;
  checkIns: number;
}

export function buildResearchDemoPlan(): ResearchDemoEventPlan[] {
  const start = Date.UTC(2026, 0, 9, 15);
  const end = Date.UTC(2026, 8, 9, 15);

  return Array.from({ length: EVENT_COUNT }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      code: `DEMO-E${number}`,
      name: `Evento demostrativo E${number}`,
      date: new Date(start + Math.round((end - start) * index / (EVENT_COUNT - 1))),
      attendees: allocation(TOTAL_ATTENDEES, index),
      sentInvitations: allocation(TOTAL_SENT_INVITATIONS, index),
      checkIns: allocation(TOTAL_CHECK_INS, index),
    };
  });
}

export function validateResearchDemoPlan(plans: ResearchDemoEventPlan[]) {
  const sum = (field: "attendees" | "sentInvitations" | "checkIns") =>
    plans.reduce((total, plan) => total + plan[field], 0);

  if (
    plans.length !== EVENT_COUNT ||
    new Set(plans.map((plan) => plan.code)).size !== EVENT_COUNT ||
    sum("attendees") !== TOTAL_ATTENDEES ||
    sum("sentInvitations") !== TOTAL_SENT_INVITATIONS ||
    sum("checkIns") !== TOTAL_CHECK_INS ||
    plans.some((plan) => plan.checkIns > plan.sentInvitations || plan.sentInvitations > plan.attendees)
  ) {
    throw new Error("El plan de demostración no coincide con los totales de la investigación.");
  }
}
