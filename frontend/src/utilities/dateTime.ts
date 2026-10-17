import { parse, format, isValid } from 'date-fns';

// Convert moment.js format tokens to date-fns tokens.
// IMPORTANT: The literal 'T' separator in ISO strings (e.g. "YYYY-MM-DDTHH:mm:ssZ")
// must be escaped as "'T'" in date-fns format strings because 'T' is a format token
// (Unix timestamp in seconds) in date-fns v2+.
// Strategy: split on 'T' only when it appears between a date part and a time part,
// convert each side, then rejoin with the escaped literal "'T'".
function toDateFnsFormat(momentFormat: string): string {
  // Handle ISO formats that contain a bare 'T' separator between date and time
  // e.g. "YYYY-MM-DDTHH:mm:ssZ" or "YYYY-MM-DDTHH:mm:ss.SSSSZ"
  if (momentFormat.includes('T')) {
    const [datePart, ...timeParts] = momentFormat.split('T');
    const timePart = timeParts.join('T'); // rejoin in case of multiple T (shouldn't happen)
    const convertedDate = datePart.replace(/YYYY/g, 'yyyy').replace(/DD/g, 'dd');
    const convertedTime = timePart.replace(/YYYY/g, 'yyyy').replace(/DD/g, 'dd').replace(/Z/g, 'xxx');
    return `${convertedDate}'T'${convertedTime}`;
  }
  return momentFormat
    .replace(/YYYY/g, 'yyyy')
    .replace(/DD/g, 'dd')
    .replace(/Z/g, 'xxx');
}

export function dateFormater(value: string, sourceFormat: string | string[], targetFormat: string): string {
  // adding possible valid formats
  if (sourceFormat && sourceFormat === "YYYY-MM-DDTHH:mm:ssZ") {
    sourceFormat = ["YYYY-MM-DDTHH:mm:ssZ", "YYYY-MM-DDTHH:mm:ss.SSSSZ"]
  }
  if (!value || !isValidDate(value, sourceFormat)) {
    return "";
  }
  const dfnsTarget = toDateFnsFormat(targetFormat);
  // Try each format until one parses successfully
  const formats = Array.isArray(sourceFormat) ? sourceFormat : [sourceFormat];
  for (const fmt of formats) {
    const dfnsSource = toDateFnsFormat(fmt);
    const parsed = parse(value, dfnsSource, new Date());
    if (isValid(parsed)) {
      return format(parsed, dfnsTarget);
    }
  }
  return "";
}

export function isValidDate(dateString: string, sourceFormat: string | string[]): boolean {
  const formats = Array.isArray(sourceFormat) ? sourceFormat : [sourceFormat];
  for (const fmt of formats) {
    const dfnsFormat = toDateFnsFormat(fmt);
    const parsed = parse(dateString, dfnsFormat, new Date());
    if (isValid(parsed)) {
      return true;
    }
  }
  return false;
}

export const possibleTimeFormat: string[] = ["YYYY-MM-DDTHH:mm:ssZ", "YYYY-MM-DDTHH:mm:ss.SSSSZ"]
