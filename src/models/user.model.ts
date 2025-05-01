import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUserDocument, IUserModel, UserRole } from '../interfaces/user.interface';

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't return password in queries
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.ASSISTANT,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre<IUserDocument>('save', async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    // If this is a password change, update passwordChangedAt
    if (this.isModified('password') && !this.isNew) {
      this.passwordChangedAt = new Date();
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to generate and hash password reset token
userSchema.methods.createPasswordResetToken = function (): string {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expiry (10 minutes)
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;