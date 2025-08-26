import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6
    },
    branch: { 
      type: String, 
      required: true,
      trim: true,
      uppercase: true  // Store branch in uppercase (e.g., "CSE", "ECE")
    },
    phone: { 
      type: String,
      trim: true
    },
    role: { 
      type: String, 
      enum: ['faculty', 'admin'], 
      default: 'faculty' 
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  { 
    timestamps: true  // createdAt & updatedAt automatically
  }
);

// 🔹 Compare password directly (plain text check)
UserSchema.methods.comparePassword = function(candidatePassword) {
  return candidatePassword === this.password;
};

// 🔹 Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// 🔹 Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ branch: 1 });

export default mongoose.model("User", UserSchema);
