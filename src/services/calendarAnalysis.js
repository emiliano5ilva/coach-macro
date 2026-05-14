import { isSameDay, isWithinDays, isTomorrow, formatEventDate } from "./calendarService.js";

// Build a list of upcoming scheduled training days from the schedule map
function getUpcomingTrainingDays(schedule) {
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const type = schedule[key] || "rest";
    if (type !== "rest") {
      days.push({ date: key, type, label: d.toLocaleDateString("en-US", { weekday: "long" }) });
    }
  }
  return days;
}

// Find an alternative training day around a conflict date
function getAlternativeDay(conflictDate, schedule) {
  const conflict = new Date(conflictDate);
  for (let offset = -2; offset <= 2; offset++) {
    if (offset === 0) continue;
    const alt = new Date(conflict);
    alt.setDate(conflict.getDate() + offset);
    const key = alt.toISOString().split("T")[0];
    const type = schedule[key] || "rest";
    if (type === "rest") {
      return alt.toLocaleDateString("en-US", { weekday: "long" });
    }
  }
  return "another day";
}

// Main analysis — returns array of alert objects
export function analyzeScheduleForTraining(events, schedule, calendarPrefs = {}) {
  const alerts = [];
  const trainingDays = getUpcomingTrainingDays(schedule);

  // ── Early morning warning ─────────────────────────────────────────────────
  if (calendarPrefs.earlyMorningWarnings !== false) {
    const tomorrowEarly = events.filter(e =>
      e.type === "early_morning" && isTomorrow(e.startDate)
    );
    if (tomorrowEarly.length > 0) {
      const ev = tomorrowEarly[0];
      alerts.push({
        id: `early_${ev.id}`,
        type: "early_morning_warning",
        severity: "info",
        icon: "💤",
        title: "HEADS UP",
        event: ev.title,
        message: `You have "${ev.title}" early tomorrow. If sleep is short, tomorrow's session intensity will automatically be adjusted.`,
        actionLabel: null,
      });
    }
  }

  // ── Travel conflicts ──────────────────────────────────────────────────────
  if (calendarPrefs.travelDetection !== false) {
    const upcomingTravel = events.filter(e =>
      e.type === "travel" && isWithinDays(e.startDate, 5)
    );
    upcomingTravel.forEach(travelEv => {
      const conflictDay = trainingDays.find(d => isSameDay(d.date, travelEv.startDate));
      if (conflictDay) {
        const altDay = getAlternativeDay(travelEv.startDate, schedule);
        alerts.push({
          id: `travel_${travelEv.id}`,
          type: "travel_conflict",
          severity: "high",
          icon: "🗓️",
          title: "SCHEDULE ALERT",
          event: travelEv.title,
          eventDate: formatEventDate(travelEv.startDate),
          affectedDay: conflictDay,
          message: `"${travelEv.title}" on ${formatEventDate(travelEv.startDate)} conflicts with your ${conflictDay.type} session.`,
          suggestions: [
            {
              id: "hotel_gym",
              label: "🏨 Hotel Gym Session",
              description: "Swap to a 30-min dumbbell-only session",
              action: "swap_to_hotel_workout",
              data: { date: conflictDay.date },
            },
            {
              id: "reschedule",
              label: `📅 Move to ${altDay}`,
              description: `Do it ${altDay} instead`,
              action: "reschedule",
              data: { date: conflictDay.date, altDay },
            },
            {
              id: "skip",
              label: "✓ Skip This Week",
              description: "One session won't affect progress",
              action: "skip",
              data: { date: conflictDay.date },
            },
          ],
        });
      }
    });
  }

  // ── High stress week (multiple deadlines) ─────────────────────────────────
  if (calendarPrefs.stressWeekDetection !== false) {
    const deadlines = events.filter(e =>
      e.type === "work_deadline" && isWithinDays(e.startDate, 7)
    );
    if (deadlines.length >= 2) {
      alerts.push({
        id: `stress_${deadlines[0].id}`,
        type: "high_stress_week",
        severity: "medium",
        icon: "📊",
        title: "BUSY WEEK DETECTED",
        deadlineCount: deadlines.length,
        message: `You have ${deadlines.length} work deadlines this week. High stress affects recovery.`,
        suggestion: {
          label: "✓ Apply Lighter Week",
          description: "Keep all sessions — just reduce sets by 20%",
          action: "reduce_volume_this_week",
        },
        dismissLabel: "Keep Normal",
      });
    }
  }

  // ── Training opportunity (free time + unscheduled) ────────────────────────
  if (calendarPrefs.freeTimeOpportunities !== false) {
    const freeBlocks = events.filter(e =>
      e.type === "free_time" && isWithinDays(e.startDate, 7)
    );
    const restDays = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      if ((schedule[key] || "rest") === "rest") restDays.push(key);
    }
    if (freeBlocks.length > 0 && restDays.length > 0 && trainingDays.length < 3) {
      const fb = freeBlocks[0];
      const start = new Date(fb.startDate);
      const end = new Date(fb.endDate);
      const dh = Math.round((end - start) / 3600000);
      alerts.push({
        id: `opp_${fb.id}`,
        type: "opportunity",
        severity: "low",
        icon: "⚡",
        title: "TRAINING OPPORTUNITY",
        event: fb.title || "Free block",
        eventDate: formatEventDate(fb.startDate),
        durationHours: dh,
        message: `You have ${dh} hour${dh !== 1 ? "s" : ""} free on ${formatEventDate(fb.startDate)} and a light training week. Perfect time for an extra session.`,
        suggestion: {
          label: "Do It",
          description: `Schedule a session during your free block`,
          action: "schedule_in_free_time",
          data: { date: fb.startDate.split("T")[0] },
        },
        addToCalLabel: "Add to Calendar",
        skipLabel: "Skip",
      });
    }
  }

  return alerts;
}

// Build a hotel/travel workout description
export function buildHotelWorkout(todayFocus) {
  return {
    title: "Hotel Gym Session",
    exercises: [
      { name: "Push-ups", sets: [{ reps: 15 }, { reps: 15 }, { reps: 15 }] },
      { name: "Dumbbell Goblet Squat", sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] },
      { name: "Dumbbell Romanian Deadlift", sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }] },
      { name: "Dumbbell Bent-Over Row", sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }] },
    ],
    note: "Dumbbell-only · ~30 min · Hotel gym friendly",
  };
}
