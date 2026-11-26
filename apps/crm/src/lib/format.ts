const TIME_ZONE = "Europe/Kyiv";

/** «Середа, 25 листопада» — сьогоднішня дата за київським часом. */
export function formatToday(date: Date = new Date()): string {
  const text = new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function kyivDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

/** «сьогодні, 09:12» / «вчора, 17:40» / «23 листопада» — за київським часом. */
export function formatWhen(date: Date, now: Date = new Date()): string {
  const time = new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
  const day = kyivDateKey(date);
  if (day === kyivDateKey(now)) return `сьогодні, ${time}`;
  if (day === kyivDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return `вчора, ${time}`;
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", timeZone: TIME_ZONE }).format(date);
}
