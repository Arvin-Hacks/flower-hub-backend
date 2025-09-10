import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, AuthProvider } from '../types/common.types';

export interface IUser extends Document {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: string;
  provider: AuthProvider;
  providerId?: string;
  addresses: IAddress[];
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAddress {
  _id: string;
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  phone?: string;
}

export interface IUserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  currency: string;
  language: string;
}

const addressSchema = new Schema<IAddress>({
  type: {
    type: String,
    enum: ['billing', 'shipping'],
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    trim: true
  }
}, { _id: true });

const userPreferencesSchema = new Schema<IUserPreferences>({
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  marketingEmails: {
    type: Boolean,
    default: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  language: {
    type: String,
    default: 'en'
  }
});

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  password: {
    type: String,
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
    default: 'USER'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    trim: true
  },
  provider: {
    type: String,
    enum: ['LOCAL', 'GOOGLE'],
    default: 'LOCAL'
  },
  providerId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  addresses: [addressSchema],
  preferences: {
    type: userPreferencesSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ providerId: 1 });
userSchema.index({ provider: 1, providerId: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next: any) {
  // Only hash password if it's modified and not empty
  if (!this.isModified('password') || !(this as any).password) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    (this as any).password = await bcrypt.hash((this as any).password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by email or provider
userSchema.statics.findByEmailOrProvider = function(email: string, provider?: string, providerId?: string) {
  const query: any = { email };
  if (provider && providerId) {
    query.$or = [
      { provider: 'local' },
      { provider, providerId }
    ];
  }
  return this.findOne(query);
};

export const User = mongoose.model<IUser>('User', userSchema);
