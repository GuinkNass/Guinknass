import { AppointmentType, TimeSlot } from "@/types";

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface OperationalWindow {
  startHour: number;
  endHour: number;
  allowed: boolean;
  reason?: string;
}

/**
 * Retorna a janela operacional permitida conforme o tipo de atendimento e dia da semana
 * 
 * Regras:
 * 1. RETOQUE:
 *    - Permitido APENAS às Segundas (1), Terças (2), Quartas (3) e Sextas-feiras (5).
 *    - Janela: 12:00 às 19:00.
 *    - Quintas, Sábados e Domingos são bloqueados.
 * 
 * 2. PRÓXIMA SESSÃO:
 *    - Segunda a Sábado das 11:00 às 23:00.
 *    - EXCETO Terça a Quinta-feira: exclusivamente das 13:00 às 17:00.
 *    - Domingo é bloqueado.
 * 
 * 3. NOVO AGENDAMENTO:
 *    - Segunda a Sábado das 11:00 às 23:00.
 *    - Domingo é bloqueado.
 */
export function getOperationalWindow(date: Date, type: AppointmentType): OperationalWindow {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  // Domingo sempre fechado
  if (dayOfWeek === 0) {
    return { startHour: 0, endHour: 0, allowed: false, reason: "O estúdio não realiza atendimentos aos domingos." };
  }

  if (type === "TOUCHUP") {
    // Apenas Segundas (1), Terças (2), Quartas (3) e Sextas (5)
    const allowedDays = [1, 2, 3, 5];
    if (!allowedDays.includes(dayOfWeek)) {
      return {
        startHour: 0,
        endHour: 0,
        allowed: false,
        reason: "Retoques são permitidos exclusivamente às segundas, terças, quartas e sextas-feiras.",
      };
    }
    return { startHour: 12, endHour: 19, allowed: true };
  }

  if (type === "NEXT_SESSION") {
    // Terça (2), Quarta (3) e Quinta (4): janela estrita das 13:00 às 17:00
    if ([2, 3, 4].includes(dayOfWeek)) {
      return { startHour: 13, endHour: 17, allowed: true };
    }
    // Segunda (1), Sexta (5) e Sábado (6): das 11:00 às 23:00
    return { startHour: 11, endHour: 23, allowed: true };
  }

  // NEW (Novo Agendamento)
  return { startHour: 11, endHour: 23, allowed: true };
}

/**
 * Motor de Validação e Geração de Slots Disponíveis
 * 
 * Injeta:
 * - Janelas operacionais restritas por tipo e dia
 * - Validação estrita se a duração cabe na janela sem estourar
 * - Pausa mínima obrigatória (Buffer Time) de 60 minutos entre clientes
 * - Consideração de agendamentos existentes (Google Calendar + Banco de Dados + Holds ativos de 15min)
 */
export function getAvailableSlots(
  targetDateStr: string, // "YYYY-MM-DD"
  type: AppointmentType,
  durationHours: number,
  existingBusyIntervals: BusyInterval[]
): TimeSlot[] {
  const [year, month, day] = targetDateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);

  const windowRule = getOperationalWindow(targetDate, type);
  if (!windowRule.allowed) {
    return [];
  }

  const { startHour, endHour } = windowRule;
  const windowDuration = endHour - startHour;

  // Se a duração da sessão for maior que toda a janela disponível, nenhum slot pode ser gerado
  if (durationHours > windowDuration) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const BUFFER_MINUTES = 60; // 1 hora obrigatória entre clientes
  const now = new Date();

  // Avalia potenciais inícios a cada 1 hora dentro da janela
  // O último início possível é (endHour - durationHours)
  for (let hour = startHour; hour <= endHour - durationHours; hour++) {
    const slotStart = new Date(year, month - 1, day, hour, 0, 0, 0);
    const slotEnd = new Date(year, month - 1, day, hour + durationHours, 0, 0, 0);

    // Não permite agendamentos no passado
    if (slotStart <= now) {
      continue;
    }

    // Intervalo do cliente com a pausa de segurança de 60 min após o atendimento
    const slotStartTimestamp = slotStart.getTime();
    const slotEndTimestamp = slotEnd.getTime();
    const slotEndWithBuffer = slotEndTimestamp + BUFFER_MINUTES * 60 * 1000;

    // Checagem de Colisão:
    // Um slot colide se existir qualquer agendamento cujo:
    // (ExistingStart - 60min) < SlotEnd E ExistingEnd + 60min > SlotStart
    let isBlocked = false;
    let blockReason = "";

    for (const busy of existingBusyIntervals) {
      const busyStart = busy.start.getTime();
      const busyEnd = busy.end.getTime();
      
      // O início do próximo precisa de 60min após o término do anterior
      const busyStartWithBuffer = busyStart - BUFFER_MINUTES * 60 * 1000;
      const busyEndWithBuffer = busyEnd + BUFFER_MINUTES * 60 * 1000;

      // Colisão considerando o buffer bidirecional de 1 hora
      const overlaps = slotStartTimestamp < busyEndWithBuffer && slotEndWithBuffer > busyStart;

      if (overlaps) {
        isBlocked = true;
        blockReason = "Conflito com outro agendamento ou intervalo obrigatório de 1h de intervalo.";
        break;
      }
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatHour = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    slots.push({
      start: formatHour(slotStart),
      end: formatHour(slotEnd),
      startISO: slotStart.toISOString(),
      endISO: slotEnd.toISOString(),
      available: !isBlocked,
      reason: isBlocked ? blockReason : undefined,
    });
  }

  return slots;
}
