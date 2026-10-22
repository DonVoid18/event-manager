const EVENT_COUNT = 50;
const TOTAL_ATTENDEES = 3948;
const TOTAL_SENT_INVITATIONS = 3384;
const TOTAL_CHECK_INS = 3291;
const TOTAL_PENDING_INVITATIONS = 180;

const themes = [
  "Foro de innovación empresarial",
  "Taller de transformación digital",
  "Encuentro de emprendedores",
  "Jornada de comercio regional",
  "Seminario de seguridad tecnológica",
  "Feria de servicios profesionales",
  "Conferencia de liderazgo",
  "Rueda de negocios locales",
  "Capacitación de herramientas digitales",
  "Encuentro de comunidad tecnológica",
];
const locations = ["Huánuco", "Amarilis", "Pillco Marca", "Tingo María", "Churubamba"];

export function researchDemoEventName(index: number, grouped = false) {
  const block = Math.floor(index / themes.length);
  const location = locations[grouped ? block : (index + block) % locations.length];
  return `${themes[index % themes.length]} en ${location}`;
}

function distribute(total: number, weights: number[]) {
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight) => total * weight / weightTotal);
  const result = raw.map(Math.floor);
  const remaining = total - result.reduce((sum, value) => sum + value, 0);
  const order = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let index = 0; index < remaining; index++) result[order[index].index]++;
  return result;
}

export interface ResearchDemoEventPlan {
  code: string;
  name: string;
  date: Date;
  type: "GRATUITO" | "PAGO";
  capacity: number;
  paymentAmount: number | null;
  attendees: number;
  sentInvitations: number;
  pendingInvitations: number;
  checkIns: number;
}

export function buildResearchDemoPlan(): ResearchDemoEventPlan[] {
  const attendeeCounts = distribute(TOTAL_ATTENDEES, Array.from({ length: EVENT_COUNT }, (_, index) => 55 + (index * 17) % 53));
  const withoutSent = distribute(TOTAL_ATTENDEES - TOTAL_SENT_INVITATIONS,
    Array.from({ length: EVENT_COUNT }, (_, index) => 4 + (index * 11) % 17));
  const noShows = distribute(TOTAL_SENT_INVITATIONS - TOTAL_CHECK_INS,
    Array.from({ length: EVENT_COUNT }, (_, index) => 1 + (index * 7) % 5));
  const pending = distribute(TOTAL_PENDING_INVITATIONS, withoutSent);
  const start = Date.UTC(2026, 0, 9, 15);
  const end = Date.UTC(2026, 8, 9, 15);

  return Array.from({ length: EVENT_COUNT }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    const type = index % 4 === 2 ? "PAGO" : "GRATUITO";
    return {
      code: `EVT-2026-${number}`,
      name: researchDemoEventName(index),
      date: new Date(start + Math.round((end - start) * index / (EVENT_COUNT - 1)) + (index % 4) * 3_600_000),
      type,
      capacity: attendeeCounts[index] + 10 + (index * 3) % 26,
      paymentAmount: type === "PAGO" ? 80 + (index % 6) * 25 : null,
      attendees: attendeeCounts[index],
      sentInvitations: attendeeCounts[index] - withoutSent[index],
      pendingInvitations: pending[index],
      checkIns: attendeeCounts[index] - withoutSent[index] - noShows[index],
    };
  });
}

export function validateResearchDemoPlan(plans: ResearchDemoEventPlan[]) {
  const sum = (field: "attendees" | "sentInvitations" | "pendingInvitations" | "checkIns") =>
    plans.reduce((total, plan) => total + plan[field], 0);

  if (
    plans.length !== EVENT_COUNT ||
    new Set(plans.map((plan) => plan.code)).size !== EVENT_COUNT ||
    sum("attendees") !== TOTAL_ATTENDEES ||
    sum("sentInvitations") !== TOTAL_SENT_INVITATIONS ||
    sum("pendingInvitations") !== TOTAL_PENDING_INVITATIONS ||
    sum("checkIns") !== TOTAL_CHECK_INS ||
    plans.some((plan) => plan.checkIns > plan.sentInvitations ||
      plan.sentInvitations + plan.pendingInvitations > plan.attendees || plan.capacity < plan.attendees)
  ) {
    throw new Error("El plan de demostración no coincide con los totales de la investigación.");
  }
}
