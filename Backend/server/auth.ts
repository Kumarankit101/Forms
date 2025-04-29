import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage.ts";

// Define JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "jwt-form-builder-secret-key";
const TOKEN_EXPIRES_IN = "24h";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Middleware to verify JWT token
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
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

export function setupAuth(app: Express) {
  // Register a new user
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, name } = req.body;
      
      // Check if user exists using storage interface
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create user using storage interface
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        name: name || null
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
      );

      // Return user data and token
      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login a user
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
      );

      // Return user data without password and token
      const { password: _, ...userWithoutPassword } = user as any;
      
      console.log("Login successful, sending token and user", {
        token: token.substring(0, 20) + "...",
        user: userWithoutPassword
      });
      
      res.status(200).json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/user", verifyToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // JWT doesn't need a logout endpoint on the server - client simply discards the token
  // But we'll keep one for API consistency
  app.post("/api/logout", (_, res) => {
    res.status(200).json({ message: "Logged out successfully" });
  });
}