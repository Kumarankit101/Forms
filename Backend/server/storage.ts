import { 
  type Form,
  type InsertForm,
  type Question,
  type InsertQuestion,
  type Option,
  type InsertOption,
  type Response,
  type InsertResponse,
  type FormWithQuestions,
  type QuestionWithOptions,
  type User,
  type InsertUser
} from "@shared/schema.ts";
import { prisma } from "./db.ts";

// Define the interface for our storage layer
export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<any>; // Returns with password for verification
  
  // Form operations
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: number, form: InsertForm): Promise<Form>;
  deleteForm(id: number): Promise<void>;
  getForms(): Promise<FormWithQuestions[]>;
  getFormsByUserId(userId: number): Promise<FormWithQuestions[]>;
  getFormById(id: number): Promise<FormWithQuestions | undefined>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByFormId(formId: number): Promise<QuestionWithOptions[]>;
  deleteQuestionsByFormId(formId: number): Promise<void>;
  
  // Option operations
  createOption(option: InsertOption): Promise<Option>;
  getOptionsByQuestionId(questionId: number): Promise<Option[]>;
  
  // Response operations
  createResponse(response: InsertResponse): Promise<Response>;
  deleteResponse(id: number): Promise<void>;
  getResponsesByFormId(formId: number): Promise<Response[]>;
  getResponseCountByFormId(formId: number): Promise<number>;
}

// Implement the storage interface using Prisma
export class DatabaseStorage implements IStorage {
  constructor() {
    // No session store needed with JWT
  }
  
  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const newUser = await prisma.user.create({
      data: user,
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true
      }
    });
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true
      }
    });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<any> {
    // Return with password for auth verification
    const user = await prisma.user.findUnique({
      where: { username }
    });
    return user || undefined;
  }
  
  // Get forms for a specific user
  async getFormsByUserId(userId: number): Promise<FormWithQuestions[]> {
    // Get all forms with their questions and options, ordered by creation date (newest first)
    const forms = await prisma.form.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          },
          include: {
            options: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });
    
    // Get response counts for all forms
    const formIds = forms.map(form => form.id);
    const responseCounts = await prisma.response.groupBy({
      by: ['formId'],
      _count: {
        id: true
      },
      where: {
        formId: { in: formIds }
      }
    });
    
    // Create a map of form ID to response count
    const responseCountMap = new Map(
      responseCounts.map(rc => [rc.formId, rc._count.id])
    );
    
    // Add response counts to forms
    return forms.map(form => ({
      ...form,
      responseCount: responseCountMap.get(form.id) || 0
    }));
  }
  
  // Form operations
  async createForm(form: InsertForm): Promise<Form> {
    return prisma.form.create({
      data: form,
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        createdAt: true
      }
    });
  }
  
  async getForms(): Promise<FormWithQuestions[]> {
    // Get all forms with their questions and options, ordered by creation date (newest first)
    const forms = await prisma.form.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          },
          include: {
            options: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });
    
    // Get response counts for all forms
    const responseCounts = await prisma.response.groupBy({
      by: ['formId'],
      _count: {
        id: true
      }
    });
    
    // Create a map of form ID to response count
    const responseCountMap = new Map(
      responseCounts.map(rc => [rc.formId, rc._count.id])
    );
    
    // Add response counts to forms
    return forms.map(form => ({
      ...form,
      responseCount: responseCountMap.get(form.id) || 0
    }));
  }
  
  async updateForm(id: number, form: InsertForm): Promise<Form> {
    return prisma.form.update({
      where: { id },
      data: form,
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        createdAt: true
      }
    });
  }
  
  async deleteForm(id: number): Promise<void> {
    await prisma.form.delete({
      where: { id }
    });
  }
  
  async getFormById(id: number): Promise<FormWithQuestions | undefined> {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          },
          include: {
            options: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });
    
    if (!form) {
      return undefined;
    }
    
    // Get response count
    const responseCount = await prisma.response.count({
      where: { formId: id }
    });
      
    return {
      ...form,
      responseCount
    };
  }
  
  // Question operations
  async createQuestion(question: InsertQuestion): Promise<Question> {
    return prisma.question.create({
      data: question,
      select: {
        id: true, 
        formId: true,
        text: true,
        type: true,
        required: true,
        order: true
      }
    });
  }
  
  async getQuestionsByFormId(formId: number): Promise<QuestionWithOptions[]> {
    return prisma.question.findMany({
      where: { formId },
      orderBy: { order: 'asc' },
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    });
  }
  
  async deleteQuestionsByFormId(formId: number): Promise<void> {
    await prisma.question.deleteMany({
      where: { formId }
    });
  }
  
  // Option operations
  async createOption(option: InsertOption): Promise<Option> {
    return prisma.option.create({
      data: option,
      select: {
        id: true,
        questionId: true,
        text: true,
        order: true
      }
    });
  }
  
  async getOptionsByQuestionId(questionId: number): Promise<Option[]> {
    return prisma.option.findMany({
      where: { questionId },
      orderBy: { order: 'asc' }
    });
  }
  
  // Response operations
  async createResponse(response: InsertResponse): Promise<Response> {
    return prisma.response.create({
      data: response,
      select: {
        id: true,
        formId: true,
        answers: true,
        createdAt: true
      }
    });
  }
  
  async deleteResponse(id: number): Promise<void> {
    await prisma.response.delete({
      where: { id }
    });
  }
  
  async getResponsesByFormId(formId: number): Promise<Response[]> {
    return prisma.response.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        formId: true,
        answers: true,
        createdAt: true
      }
    });
  }
  
  async getResponseCountByFormId(formId: number): Promise<number> {
    return prisma.response.count({
      where: { formId }
    });
  }
}

export const storage = new DatabaseStorage();
