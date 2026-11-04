import { z } from 'zod';

const NAME_MAX_LENGTH = 80;
const PHONE_MAX_LENGTH = 40;
const EMAIL_MAX_LENGTH = 254;
const INSTAGRAM_MAX_LENGTH = 60;
const LOCATION_MAX_LENGTH = 300;
const NOTE_MAX_LENGTH = 1000;
const PHONE_RE = /^[0-9+]{9,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_CODE_RE = /^\d{6}$/;

const emailSchema = z.string().trim().max(EMAIL_MAX_LENGTH).regex(EMAIL_RE);

function optionalText(maxLength) {
  return z.string().trim().max(maxLength, 'tooLong');
}

export const bookingFormSchema = z.object({
  nama: z.string().trim().min(1, 'missingNameOrPhone').max(NAME_MAX_LENGTH, 'tooLong'),
  telepon: z
    .string()
    .trim()
    .min(1, 'missingNameOrPhone')
    .max(PHONE_MAX_LENGTH, 'tooLong')
    .regex(PHONE_RE, 'invalidPhone'),
  jam: z.string().min(1, 'missingTime'),
  lokasi: z.string().trim().min(1, 'missingAddress').max(LOCATION_MAX_LENGTH, 'tooLong'),
  email: z
    .string()
    .trim()
    .refine((email) => !email || emailSchema.safeParse(email).success, 'invalidEmail'),
  instagram: optionalText(INSTAGRAM_MAX_LENGTH),
  catatan: optionalText(NOTE_MAX_LENGTH),
});

export const loginEmailSchema = z.string().trim().max(EMAIL_MAX_LENGTH, 'invalidEmail').regex(EMAIL_RE, 'invalidEmail');

export const loginCodeSchema = z.string().trim().regex(LOGIN_CODE_RE, 'invalidCode');

export function findFormProblem(schema, values, fallbackKey = 'invalid') {
  const parsed = schema.safeParse(values);
  if (parsed.success) return null;
  const [firstIssue] = parsed.error.issues;
  const isCustomMessage = /^[a-z][A-Za-z]*$/.test(firstIssue.message);
  return isCustomMessage ? firstIssue.message : fallbackKey;
}
