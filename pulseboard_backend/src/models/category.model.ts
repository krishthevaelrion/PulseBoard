import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  categoryId: number; // e.g., 101, 102
  name: string;       // e.g., "Hostel/Mess", "Interviews"
  icon: string;       // The name of the Lucide icon
  color: string;      // The hex code for the UI accent
}

const CategorySchema: Schema = new Schema(
  {
    categoryId: {
      type: Number,
      unique: true,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "#CCF900", 
    }
  },
  { 
    timestamps: true,
    // This part ensures it matches the "categories" folder in your 'test' database
    collection: 'categories' 
  }
);

// The first argument "Category" is the internal Mongoose name
// The Schema now strictly points to the 'categories' collection
const Category: Model<ICategory> = mongoose.model<ICategory>("Category", CategorySchema);

export default Category;