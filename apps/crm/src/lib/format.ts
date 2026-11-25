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
