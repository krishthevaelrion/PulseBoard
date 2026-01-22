const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    preferences:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
