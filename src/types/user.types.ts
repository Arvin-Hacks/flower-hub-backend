import { BaseEntity, UserRole, AuthProvider } from './common.types';

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: string;
  provider: AuthProvider;
  providerId?: string; // Google ID for OAuth users
  password?: string; // Only for local auth users
  addresses: Address[];
  preferences: UserPreferences;
}

export interface Address {
  id: string;
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

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  currency: string;
  language: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface CreateAddressRequest {
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  phone?: string;
}

export interface UpdateAddressRequest {
  type?: 'billing' | 'shipping';
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
  phone?: string;
}
