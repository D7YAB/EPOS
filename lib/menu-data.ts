export type ProductVariation = {
  id: string
  name: string
  priceModifier: number
}

export type ProductAddOn = {
  id: string
  name: string
  price: number
}

export type MenuItem = {
  id: string
  name: string
  price: number
  category: string
  variations?: ProductVariation[]
  addOns?: ProductAddOn[]
}

export type Category = {
  id: string
  name: string
  color: string
}

export const defaultCategories: Category[] = [
  { id: "burgers", name: "Burgers", color: "bg-[oklch(0.55_0.22_27)]" },
  { id: "chicken", name: "Chicken", color: "bg-[oklch(0.7_0.18_55)]" },
  { id: "sides", name: "Sides", color: "bg-[oklch(0.65_0.2_145)]" },
  { id: "drinks", name: "Drinks", color: "bg-[oklch(0.6_0.15_250)]" },
  { id: "desserts", name: "Desserts", color: "bg-[oklch(0.7_0.15_330)]" },
]

// Shared add-ons
const burgerAddOns: ProductAddOn[] = [
  { id: "ao-cheese", name: "Extra Cheese", price: 0.5 },
  { id: "ao-bacon", name: "Bacon", price: 1.0 },
  { id: "ao-jalapeno", name: "Jalapenos", price: 0.5 },
  { id: "ao-egg", name: "Fried Egg", price: 0.75 },
  { id: "ao-sauce", name: "Special Sauce", price: 0.3 },
]

const chickenAddOns: ProductAddOn[] = [
  { id: "ao-hotsauce", name: "Hot Sauce", price: 0.3 },
  { id: "ao-cheese", name: "Extra Cheese", price: 0.5 },
  { id: "ao-coleslaw", name: "Coleslaw", price: 0.75 },
  { id: "ao-garlic", name: "Garlic Mayo", price: 0.3 },
]

const sizeVariations: ProductVariation[] = [
  { id: "v-reg", name: "Regular", priceModifier: 0 },
  { id: "v-large", name: "Large", priceModifier: 1.5 },
]

const burgerVariations: ProductVariation[] = [
  { id: "v-single", name: "Single", priceModifier: 0 },
  { id: "v-double", name: "Double", priceModifier: 2.0 },
]

const drinkSizes: ProductVariation[] = [
  { id: "v-small", name: "Small", priceModifier: 0 },
  { id: "v-medium", name: "Medium", priceModifier: 0.5 },
  { id: "v-large", name: "Large", priceModifier: 1.0 },
]

export const defaultMenuItems: MenuItem[] = [
  // Burgers
  { id: "b1", name: "Classic Burger", price: 5.99, category: "burgers", variations: burgerVariations, addOns: burgerAddOns },
  { id: "b2", name: "Cheese Burger", price: 6.49, category: "burgers", variations: burgerVariations, addOns: burgerAddOns },
  { id: "b3", name: "Bacon Burger", price: 7.49, category: "burgers", variations: burgerVariations, addOns: burgerAddOns },
  { id: "b4", name: "Veggie Burger", price: 6.99, category: "burgers", addOns: burgerAddOns },
  { id: "b5", name: "BBQ Burger", price: 7.99, category: "burgers", variations: burgerVariations, addOns: burgerAddOns },
  { id: "b6", name: "Spicy Burger", price: 7.49, category: "burgers", variations: burgerVariations, addOns: burgerAddOns },
  { id: "b7", name: "Mushroom Burger", price: 7.99, category: "burgers", addOns: burgerAddOns },

  // Chicken
  { id: "c1", name: "Chicken Burger", price: 6.49, category: "chicken", variations: burgerVariations, addOns: chickenAddOns },
  { id: "c2", name: "Chicken Strips", price: 5.49, category: "chicken", variations: sizeVariations, addOns: chickenAddOns },
  { id: "c3", name: "Chicken Wings", price: 6.99, category: "chicken", variations: sizeVariations, addOns: chickenAddOns },
  { id: "c4", name: "Spicy Chicken", price: 7.49, category: "chicken", addOns: chickenAddOns },
  { id: "c5", name: "Chicken Wrap", price: 6.99, category: "chicken", addOns: chickenAddOns },
  { id: "c6", name: "Chicken Nuggets", price: 4.99, category: "chicken", variations: sizeVariations, addOns: chickenAddOns },

  // Sides
  { id: "s1", name: "Fries", price: 2.99, category: "sides", variations: sizeVariations },
  { id: "s2", name: "Onion Rings", price: 3.49, category: "sides", variations: sizeVariations },
  { id: "s3", name: "Mozzarella Sticks", price: 4.49, category: "sides" },
  { id: "s4", name: "Coleslaw", price: 1.99, category: "sides" },
  { id: "s5", name: "Side Salad", price: 2.99, category: "sides" },

  // Drinks
  { id: "d1", name: "Cola", price: 1.99, category: "drinks", variations: drinkSizes },
  { id: "d2", name: "Lemonade", price: 1.99, category: "drinks", variations: drinkSizes },
  { id: "d3", name: "Orange Juice", price: 2.49, category: "drinks", variations: drinkSizes },
  { id: "d4", name: "Water", price: 1.49, category: "drinks" },
  { id: "d5", name: "Milkshake", price: 3.99, category: "drinks", variations: drinkSizes },
  { id: "d6", name: "Iced Tea", price: 2.29, category: "drinks", variations: drinkSizes },

  // Desserts
  { id: "de1", name: "Ice Cream", price: 2.99, category: "desserts" },
  { id: "de2", name: "Apple Pie", price: 2.49, category: "desserts" },
  { id: "de3", name: "Brownie", price: 2.99, category: "desserts" },
  { id: "de4", name: "Cookie", price: 1.49, category: "desserts" },
  { id: "de5", name: "Sundae", price: 3.49, category: "desserts" },
]

export type OrderStatus =
  | "preparing"
  | "ready"
  | "collected"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"

export type OrderType = "delivery" | "collection" | "instore"

export type CustomerDetails = {
  name?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postcode?: string
}

export type PaymentStatus = "paid" | "unpaid"
export type PaymentMethod = "cash" | "card" | null

export type OrderItemAddOn = {
  addOn: ProductAddOn
  quantity: number
}

export type CustomAddOn = {
  name: string
  price: number
}

export type OrderItem = {
  item: MenuItem
  quantity: number
  selectedVariation?: ProductVariation
  addOns: OrderItemAddOn[]
  customAddOns: CustomAddOn[]
  comment?: string
}

export type Order = {
  id: string
  orderNumber: number
  items: OrderItem[]
  total: number
  status: OrderStatus
  orderType: OrderType
  customer: CustomerDetails
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  orderComment?: string
  createdAt: Date
  readyAt?: Date
  collectedAt?: Date
  outForDeliveryAt?: Date
  deliveredAt?: Date
}
