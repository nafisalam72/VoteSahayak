export const MAX_CHAT_INPUT_LENGTH = 500;
export const MAX_LOCATOR_INPUT_LENGTH = 20;

const CONTROL_CHAR_PATTERN = /[\u0000-\u001f\u007f]/g;
const TAG_BRACKET_PATTERN = /[<>]/g;
const WHITESPACE_PATTERN = /\s+/g;
const LOCATOR_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9\s-]{2,19}$/;

export function sanitizeUserText(value: string, maxLength = MAX_CHAT_INPUT_LENGTH): string {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHAR_PATTERN, " ")
    .replace(TAG_BRACKET_PATTERN, "")
    .replace(WHITESPACE_PATTERN, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeLocatorQuery(value: string): string {
  return sanitizeUserText(value, MAX_LOCATOR_INPUT_LENGTH).toUpperCase();
}

export function isValidLocatorQuery(value: string): boolean {
  return LOCATOR_PATTERN.test(value.trim());
}

export function isSafeChatMessage(value: string): boolean {
  const sanitized = sanitizeUserText(value);
  return sanitized.length > 0 && sanitized.length <= MAX_CHAT_INPUT_LENGTH;
}
