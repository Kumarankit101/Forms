import { z } from "zod";
import { Prisma } from "@prisma/client";

// Define Zod validation schemas
export const UserSchema = z.object({
  id: z.number().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
  createdAt: z.date().optional()
});

export const FormSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  title: z.string().min(1, "Form title is required"),
  description: z.string().optional().nullable(),
  createdAt: z.date().optional()
});

export const QuestionSchema = z.object({
  id: z.number().optional(),
  formId: z.number(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "dropdown"]),
  required: z.boolean().default(false),
  order: z.number().default(0)
});

export const OptionSchema = z.object({
  id: z.number().optional(),
  questionId: z.number(),
  text: z.string().min(1, "Option text is required"),
  order: z.number().default(0)
});

export const ResponseSchema = z.object({
  id: z.number().optional(),
  formId: z.number(),
  answers: z.record(z.string(), z.string()),
  createdAt: z.date().optional()
});

// Create form with questions validation schema
export const CreateFormSchema = z.object({
  form: z.object({
    title: z.string().min(1, "Form title is required"),
    description: z.string().optional().nullable()
  }),
  questions: z.array(
    z.object({
      text: z.string().min(1, "Question text is required"),
      type: z.enum(["text", "dropdown"]),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional()
    })
  ).min(1, "At least one question is required")
});

// Export validation types
export type FormData = z.infer<typeof FormSchema>;
export type QuestionData = z.infer<typeof QuestionSchema>;
export type OptionData = z.infer<typeof OptionSchema>;
export type ResponseData = z.infer<typeof ResponseSchema>;
export type UserData = z.infer<typeof UserSchema>;
export type CreateFormData = z.infer<typeof CreateFormSchema>;

// Export Prisma types
export type User = {
  id: number;
  username: string;
  name: string | null;
  createdAt: Date;
};

export type Form = Prisma.FormGetPayload<{
  select: { id: true, userId: true, title: true, description: true, createdAt: true }
}>;

export type Question = Prisma.QuestionGetPayload<{
  select: { id: true, formId: true, text: true, type: true, required: true, order: true }
}>;

export type Option = Prisma.OptionGetPayload<{
  select: { id: true, questionId: true, text: true, order: true }
}>;

export type QuestionWithOptions = Prisma.QuestionGetPayload<{
  include: { options: true }
}>;

export type FormWithQuestions = Prisma.FormGetPayload<{
  include: { questions: { include: { options: true } } }
}> & {
  responseCount?: number;
};

export type Response = Prisma.ResponseGetPayload<{
  select: { id: true, formId: true, answers: true, createdAt: true }
}>;

// Define insert types
export type InsertUser = Omit<UserData, 'id' | 'createdAt'>;
export type InsertForm = Omit<FormData, 'id' | 'createdAt'>;
export type InsertQuestion = Omit<QuestionData, 'id'>;
export type InsertOption = Omit<OptionData, 'id'>;
export type InsertResponse = Omit<ResponseData, 'id' | 'createdAt'>;
