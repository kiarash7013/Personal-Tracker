const persianDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const persianNumberFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 1,
});

export function formatPersianDate(value: Date) {
  return persianDateFormatter.format(value);
}

export function formatPersianNumber(value: number) {
  return persianNumberFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${formatPersianNumber(value)}٪`;
}

export function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}
