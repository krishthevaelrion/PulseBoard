import { Request, Response } from "express";
import Mail from "../models/mail.model";

export const createMail = async (req: Request, res: Response) => {
  try {
    const newMail = await Mail.create(req.body);
    res.status(201).json(newMail);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMailsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    // We explicitly convert categoryId to a Number to match the Schema type
    const mails = await Mail.find({ 
      categoryId: Number(categoryId) 
    }).sort({ createdAt: -1 });

    res.status(200).json(mails);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};