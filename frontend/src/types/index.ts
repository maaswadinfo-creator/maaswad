export type Role = 'platform_owner' | 'operations_manager' | 'admin_chef' | 'delivery_partner' | 'home_chef' | 'food_lover';

export interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  activeRole: Role;
  avatar?: string;
  loyaltyPoints: number;
  walletBalance: number;
  referralCode?: string;
}

export interface Rating { avg: number; count: number; }

export interface Chef {
  _id: string;
  fullName: string;
  rating: Rating;
  badges: string[];
  cuisineSpecialization: string[];
  profilePhoto?: string;
}

export interface Dish {
  _id: string;
  chef: Chef | string;
  name: string;
  description?: string;
  category?: string;
  cuisineRegion?: string;
  cuisineSub?: string;
  basePrice: number;
  displayedPrice: number;
  quantityAvailable: number;
  foodType: 'veg' | 'non_veg' | 'vegan' | 'egg';
  preparationTimeMins: number;
  servingSize?: string;
  ingredients: string[];
  allergens: string[];
  availableDays?: string[];
  images: string[];
  tags: string[];
  rating: Rating;
  status: string;
}

export interface CartItem { dish: Dish; qty: number; }

export interface OrderPricing {
  chefBaseTotal: number; displayedFoodTotal: number; packingCharge: number;
  deliveryCharge: number; platformFee: number; discounts: number; gst: number;
  customerTotal: number; chefReceives: number; chefCommission: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  items: { name: string; qty: number; displayedLine: number }[];
  pricing: OrderPricing;
  etaMinutes?: number;
  createdAt: string;
  chef?: Chef;
}

export interface ApiResponse<T> { success: boolean; message: string; data: T; meta?: { total: number; page: number; pages: number }; }
