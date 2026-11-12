import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const scooterSchema = z.object({
  name: z.string().min(1, "Scooter name is required"),
  model: z.string().min(1, "Please select a model"),
  batteryCapacity: z
    .number({ invalid_type_error: "Battery capacity is required" })
    .positive("Battery capacity must be positive")
    .max(100, "Battery capacity seems too high"),
  electricityRate: z
    .number({ invalid_type_error: "Electricity rate is required" })
    .min(0, "Rate cannot be negative")
    .max(200, "Rate seems too high"),
  chargingLoss: z
    .number({ invalid_type_error: "Charging loss is required" })
    .min(0, "Loss cannot be negative")
    .max(50, "Loss percentage seems too high"),
  registrationNumber: z.string().optional(),
  currentOdometer: z
    .number()
    .nonnegative("Odometer cannot be negative")
    .optional()
    .or(z.literal("")),
});

export const sessionSchema = z
  .object({
    date: z.date({ required_error: "Date is required" }),
    startPercentage: z
      .number({ invalid_type_error: "Start percentage is required" })
      .min(0, "Must be 0 or above")
      .max(100, "Must be 100 or below"),
    endPercentage: z
      .number({ invalid_type_error: "End percentage is required" })
      .min(0, "Must be 0 or above")
      .max(100, "Must be 100 or below"),
    electricityRate: z
      .number({ invalid_type_error: "Electricity rate is required" })
      .min(0, "Rate cannot be negative"),
    startOdometer: z.number().nonnegative().optional().or(z.literal("")),
    endOdometer: z.number().nonnegative().optional().or(z.literal("")),
    location: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.endPercentage > data.startPercentage, {
    message: "End percentage must be greater than start percentage",
    path: ["endPercentage"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ScooterSchemaData = z.infer<typeof scooterSchema>;
export type SessionSchemaData = z.infer<typeof sessionSchema>;

