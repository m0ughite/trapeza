import { z } from "zod";

export const providerInputSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  capabilities: z.array(z.string().min(1)),
  endpoint: z.string().url(),
  bondBalanceUsdc: z.string(),
  status: z.enum(["active", "suspended"]).default("active"),
  priceUsdc: z.string().optional(),
});

export const capabilityQuerySchema = z.object({
  capability: z.string().min(1),
});

export const calibrationQuerySchema = z.object({
  providerId: z.string().min(1),
  capability: z.string().min(1),
});

export const taskSpecSchema = z.object({
  id: z.string().min(1),
  capability: z.string().min(1),
  input: z.unknown(),
  oracleSpec: z.object({
    schema: z.record(z.unknown()),
    groundTruth: z.record(z.unknown()),
  }),
  valueUsdc: z.string(),
  budgetUsdc: z.string(),
  qualityFloor: z.number().min(0).max(1).optional(),
  bondRatio: z.number().min(0).optional(),
  preference: z.object({
    price: z.number(),
    latency: z.number(),
    quality: z.number(),
    risk: z.number(),
  }),
  deadlineMs: z.number().int().positive(),
  useCalibration: z.boolean().optional(),
});

export const taskGraphSchema = z.object({
  id: z.string().min(1),
  nodes: z.array(
    z.object({
      nodeId: z.string().min(1),
      task: taskSpecSchema.omit({ useCalibration: true }),
    }),
  ),
  edges: z.array(
    z.object({
      from: z.string().min(1),
      to: z.string().min(1),
    }),
  ),
  globalBudgetUsdc: z.string(),
  globalDeadlineMs: z.number().int().positive(),
  globalQualityFloor: z.number().min(0).max(1).optional(),
  riskAversion: z.number().optional(),
});

export const receiptQuerySchema = z.object({
  taskId: z.string().min(1),
});

export type ProviderInput = z.infer<typeof providerInputSchema>;
export type TaskSpecInput = z.infer<typeof taskSpecSchema>;
export type TaskGraphInput = z.infer<typeof taskGraphSchema>;
