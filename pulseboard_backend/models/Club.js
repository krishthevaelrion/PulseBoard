const mongoose = require("mongoose");

const ClubSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description:{
            type: String,
            required: true,
        },
        category:{
            type: String,
            enum:[
                "Technical",
                "Cultural",
                "Sports",
                "Literary",
                "Other"
            ],
            required: true,
        },
        followers:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:"User",
            }
        ],

    },{timestamps:true}
);

module.exports = mongoose.model("Club", ClubSchema);