import { Router } from "express";
import { createCategory, getCategories } from "../controllers/category.controller";

const router = Router();

router.post("/", createCategory); // To add a category
router.get("/", getCategories);   // To fetch categories for React Native

export default router;