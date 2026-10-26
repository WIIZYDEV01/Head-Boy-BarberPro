import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  preferredStyle: z.string().trim().max(240).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(400).optional().or(z.literal("")),
});

export const salonSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  addressLine: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  timezone: z.string().min(1),
  currency: z.enum(["NGN", "GHS", "USD", "ZAR", "KES"]),
  paymentPolicy: z.enum(["full", "deposit", "at_salon"]),
  depositPercent: z.coerce.number().int().min(0).max(100),
  bookingBufferMinutes: z.coerce.number().int().min(0).max(60),
  cancellationHours: z.coerce.number().int().min(0).max(168),
  isPublished: z.boolean().optional(),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  priceMajor: z.coerce.number().min(0).max(1_000_000),
  durationMinutes: z.coerce.number().int().min(10).max(480),
  isActive: z.boolean().optional(),
});

export const staffInviteSchema = z.object({
  email: emailSchema,
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(["manager", "barber"]),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
});

export const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const bookingSchema = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  barberId: z.string().uuid().nullable(),
  startsAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Choose a valid time"),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});
