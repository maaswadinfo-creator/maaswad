export const ROLES = {
  OWNER: 'platform_owner',
  OPS: 'operations_manager',
  DELIVERY: 'delivery_partner',
  CHEF: 'home_chef',
  CUSTOMER: 'food_lover',
};

export const ROLE_LIST = Object.values(ROLES);

export const CHEF_STATUS = ['applied', 'under_review', 'pending_certificate', 'certificate_uploaded', 'approved', 'active', 'suspended', 'rejected'];
export const DELIVERY_STATUS = ['applied', 'verification', 'approved', 'active', 'suspended', 'rejected'];
export const DISH_STATUS = ['created', 'pending_approval', 'admin_review', 'approved', 'published', 'paused', 'rejected'];

export const ORDER_STATUS = [
  'pending_payment', 'paid', 'created', 'chef_notified', 'chef_accepted',
  'preparing', 'ready', 'rider_assigned', 'pickup_started', 'picked_up',
  'out_for_delivery', 'delivered', 'customer_confirmed', 'reviewed',
  'settlement_eligible', 'cancelled', 'rejected',
];

export const PAYMENT_STATUS = ['pending', 'success', 'failed', 'refunded'];
export const SETTLEMENT_STATUS = ['pending', 'eligible', 'processing', 'paid', 'on_hold'];

export const CUISINES = {
  'South Indian': ['Tamil Nadu', 'Chettinad', 'Kongunadu', 'Andhra', 'Telangana', 'Kerala', 'Karnataka'],
  'North Indian': ['Punjabi', 'Delhi', 'Kashmiri', 'Himachali'],
  'West Indian': ['Gujarati', 'Maharashtrian', 'Goan', 'Rajasthani'],
  'East Indian': ['Bengali', 'Assamese', 'Odia'],
  'Central Indian': ['Madhya Pradesh', 'Chhattisgarh'],
};

export const SPECIAL_CATEGORIES = [
  'Vegetarian', 'Vegan', 'Jain', 'Millet Foods', 'Organic Foods', 'Healthy Foods',
  'Diabetic Friendly', 'Kids Special', 'Protein Rich', 'Festival Foods', 'Traditional Foods',
];
