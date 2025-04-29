import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.ts";
import { z } from "zod";
import { 
  ResponseSchema,
  CreateFormSchema
} from "@shared/schema.ts";
import { setupAuth } from "./auth.ts";
import { prisma } from "./db.ts";
import jwt from "jsonwebtoken";

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "jwt-form-builder-secret-key";

// Middleware to check if user is authenticated with JWT
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).userId = (decoded as any).id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);
  // GET all forms for the authenticated user
  app.get("/api/forms", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const forms = await storage.getFormsByUserId(userId);
      res.json(forms);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  // GET a form by ID
  app.get("/api/forms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      const form = await storage.getFormById(id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      res.json(form);
    } catch (error) {
      console.error("Error fetching form:", error);
      res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  // POST to create a new form with questions and options
  app.post("/api/forms", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Validate form data with CreateFormSchema
      const validatedData = CreateFormSchema.parse(req.body);
      
      // Create the form with the user ID
      const form = await storage.createForm({
        title: validatedData.form.title,
        description: validatedData.form.description,
        userId: userId
      });
      
      // Process questions
      for (let i = 0; i < validatedData.questions.length; i++) {
        const questionData = validatedData.questions[i];
        
        // Create the question
        const question = await storage.createQuestion({
          formId: form.id,
          text: questionData.text,
          type: questionData.type,
          required: questionData.required || false,
          order: i
        });
        
        // Process options if this is a dropdown question and has options
        if (questionData.type === "dropdown" && questionData.options && Array.isArray(questionData.options)) {
          for (let j = 0; j < questionData.options.length; j++) {
            const optionText = questionData.options[j];
            
            await storage.createOption({
              questionId: question.id,
              text: optionText,
              order: j
            });
          }
        }
      }
      
      // Return the created form
      const createdForm = await storage.getFormById(form.id);
      res.status(201).json(createdForm);
    } catch (error) {
      console.error("Error creating form:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid form data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create form" });
    }
  });

  // PUT to update an existing form
  app.put("/api/forms/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      console.log(`[PUT /api/forms/${id}] Updating form with ID: ${id}`);
      console.log(`[PUT /api/forms/${id}] Request body:`, JSON.stringify(req.body, null, 2));

      // Check if form exists
      const existingForm = await storage.getFormById(id);
      if (!existingForm) {
        console.log(`[PUT /api/forms/${id}] Form with ID ${id} not found`);
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if form belongs to the authenticated user
      if (existingForm.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this form" });
      }
      
      console.log(`[PUT /api/forms/${id}] Existing form found: "${existingForm.title}"`);

      // Validate form data with CreateFormSchema
      const validatedData = CreateFormSchema.parse(req.body);
      console.log(`[PUT /api/forms/${id}] Data validation successful`);
      
      // Update the form basic info
      console.log(`[PUT /api/forms/${id}] Updating form basic info`);
      const updatedForm = await storage.updateForm(id, {
        title: validatedData.form.title,
        description: validatedData.form.description,
        userId: userId
      });
      
      // Delete existing questions and options
      console.log(`[PUT /api/forms/${id}] Deleting existing questions and options`);
      await storage.deleteQuestionsByFormId(id);
      
      // Process questions
      console.log(`[PUT /api/forms/${id}] Adding ${validatedData.questions.length} questions`);
      for (let i = 0; i < validatedData.questions.length; i++) {
        const questionData = validatedData.questions[i];
        
        // Create the question (original IDs are not preserved as we're recreating the questions)
        const question = await storage.createQuestion({
          formId: id,
          text: questionData.text,
          type: questionData.type,
          required: questionData.required || false,
          order: i
        });
        console.log(`[PUT /api/forms/${id}] Added question ${i+1}: "${questionData.text}" (${questionData.type})`);
        
        // Process options if this is a dropdown question and has options
        if (questionData.type === "dropdown" && questionData.options && Array.isArray(questionData.options)) {
          console.log(`[PUT /api/forms/${id}] Adding ${questionData.options.length} options for question ${i+1}`);
          for (let j = 0; j < questionData.options.length; j++) {
            const optionText = questionData.options[j];
            
            await storage.createOption({
              questionId: question.id,
              text: optionText,
              order: j
            });
            console.log(`[PUT /api/forms/${id}] Added option ${j+1}: "${optionText}"`);
          }
        }
      }
      
      // Return the updated form
      console.log(`[PUT /api/forms/${id}] Retrieving updated form data`);
      const fullUpdatedForm = await storage.getFormById(id);
      console.log(`[PUT /api/forms/${id}] Form update complete`);
      res.json(fullUpdatedForm);
    } catch (error) {
      console.error("Error updating form:", error);
      if (error instanceof z.ZodError) {
        console.log(`[PUT /api/forms] Validation error:`, error.errors);
        return res.status(400).json({ message: "Invalid form data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update form" });
    }
  });

  // DELETE a form by ID
  app.delete("/api/forms/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      // Check if form exists
      const existingForm = await storage.getFormById(id);
      if (!existingForm) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if form belongs to the authenticated user
      if (existingForm.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this form" });
      }

      // Delete the form
      await storage.deleteForm(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting form:", error);
      res.status(500).json({ message: "Failed to delete form" });
    }
  });

  // POST to submit a form response
  app.post("/api/forms/:id/responses", async (req: Request, res: Response) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      // Check if form exists
      const form = await storage.getFormById(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Validate and create response
      const responseData = ResponseSchema.omit({ id: true, createdAt: true }).parse({
        formId,
        answers: req.body.answers
      });
      
      const response = await storage.createResponse(responseData);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error submitting form response:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid response data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit form response" });
    }
  });

  // GET form responses by form ID
  app.get("/api/forms/:id/responses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      
      // Check if form exists and belongs to the user
      const form = await storage.getFormById(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check if form belongs to the authenticated user
      if (form.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to view responses for this form" });
      }

      const responses = await storage.getResponsesByFormId(formId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching form responses:", error);
      res.status(500).json({ message: "Failed to fetch form responses" });
    }
  });

  // DELETE a response by ID
  app.delete("/api/responses/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid response ID" });
      }
      
      // Get the response to check form ownership
      const response = await prisma.response.findUnique({
        where: { id },
        include: { form: true }
      });
      
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      // Check if the form belongs to the authenticated user
      if (response.form.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this response" });
      }

      // Delete the response
      await storage.deleteResponse(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting response:", error);
      res.status(500).json({ message: "Failed to delete response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
