// Calendar Service — wraps native iOS calendar access via Capacitor plugin.
// Plugin required: npx cap plugin add @capacitor-community/calendar
// Then: npx cap sync ios
// Add to ios/App/App/Info.plist:
//   NSCalendarUsageDescription: "Coach Macro reads your calendar to adapt
//   training around your schedule. We never write to your calendar without
//   permission."

const isNative = () =>
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;

async function getCalendarPlugin() {
  if (!isNative()) return null;
  // Uses the Capacitor plugin registry — works with any calendar plugin that
  // registers itself there (e.g. @capacitor-community/calendar after install).
  // To enable: npm install @capacitor-community/calendar && npx cap sync ios
  return window?.Capacitor?.Plugins?.Calendar || null;
}

export async function requestCalendarAccess() {
  const cal = await getCalendarPlugin();
  if (!cal) return false;
  try {
    const result = await cal.requestPermission();
    // Different plugins return different shapes
    const status = result?.result || result?.status || result?.value;
    return status === "authorized" || status === "granted" || status === true;
  } catch { return false; }
}

export async function checkCalendarAuthorized() {
  const cal = await getCalendarPlugin();
  if (!cal) return false;
  try {
    const result = await cal.checkPermission?.() || await cal.requestPermission();
    const status = result?.result || result?.status || result?.value;
    return status === "authorized" || status === "granted" || status === true;
  } catch { return false; }
}

export async function getUpcomingEvents(days = 14) {
  const cal = await getCalendarPlugin();
  if (!cal) return [];
  try {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + days * 864e5).toISOString();
    // Different plugins use different method names
    const raw =
      (await cal.listEventsInRange?.({ startDate, endDate }))?.events ||
      (await cal.fetchAllEvents?.({ startDate, endDate })) ||
      (await cal.getEvents?.({ startDate, endDate }))?.events ||
      [];
    return (raw || []).map(e => ({
      id: e.id || e.eventId,
      title: e.title || e.name || "(No title)",
      startDate: e.startDate,
      endDate: e.endDate,
      allDay: e.allDay || false,
      type: classifyEvent(e),
    }));
  } catch (err) {
    console.error("[calendarService] getUpcomingEvents:", err);
    return [];
  }
}

export function classifyEvent(event) {
  const title = (event.title || event.name || "").toLowerCase();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const startHour = start.getHours();
  const durationH = (end - start) / 3600000;

  if (
    title.includes("flight") || title.includes("travel") ||
    title.includes("hotel") || title.includes("trip") ||
    title.includes("airport") || title.includes("fly")
  ) return "travel";

  if (
    title.includes("deadline") || title.includes("launch") ||
    title.includes("presentation") || title.includes("review") ||
    title.includes("demo") || title.includes("sprint") ||
    title.includes("release")
  ) return "work_deadline";

  if (startHour >= 4 && startHour < 7) return "early_morning";
  if (startHour >= 21 || startHour <= 2) return "late_night";

  if (durationH >= 2 && startHour >= 6 && startHour <= 20 && durationH <= 6)
    return "free_time";

  return "general";
}

// Helpers
export function isSameDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function isWithinDays(dateStr, days) {
  const d = new Date(dateStr);
  const now = Date.now();
  return d >= now && d <= now + days * 864e5;
}

export function isTomorrow(dateStr) {
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return isSameDay(dateStr, tom);
}

export function formatEventDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
