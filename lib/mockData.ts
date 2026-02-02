// Mock data for the application

export interface Restaurant {
  id: string
  name: string
  isOpen: boolean
  opensAt?: string
  closesAt?: string
  image?: string
  comingSoon?: boolean // Restaurant is marked as "Coming Soon"
  enabled?: boolean // Restaurant is enabled/disabled by admin
}

export interface Product {
  id: string
  name: string
  price: number
  description?: string
  image?: string
  category: string
  allowSauces: boolean
  availableSauces?: string[]
  trackStock?: boolean
  stockQuantity?: number | null
  isOutOfStock?: boolean
}

export interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  comment?: string
  sauces?: string[]
}

export interface Order {
  id: string
  restaurantId: string
  restaurantName: string
  items: CartItem[]
  total: number
  status: 'received' | 'preparing' | 'ready' | 'cancelled'
  estimatedTime?: number
  createdAt: string
}

export const mockRestaurants: Restaurant[] = [
  {
    id: 'rest1',
    name: 'Campus Cafe',
    isOpen: true,
    opensAt: '08:00',
    closesAt: '22:00',
    comingSoon: false,
    enabled: true,
  },
  {
    id: 'rest2',
    name: 'The Sandwich Spot',
    isOpen: false,
    opensAt: '10:00',
    closesAt: '20:00',
    comingSoon: false,
    enabled: true,
  },
  {
    id: 'rest3',
    name: 'Pizza Corner',
    isOpen: true,
    opensAt: '11:00',
    closesAt: '23:00',
    comingSoon: false,
    enabled: true,
  },
  {
    id: 'rest4',
    name: 'Sushi Express',
    isOpen: false,
    opensAt: '12:00',
    closesAt: '21:00',
    comingSoon: true,
    enabled: true,
  },
  {
    id: 'rest5',
    name: 'Burger House',
    isOpen: false,
    opensAt: '09:00',
    closesAt: '22:00',
    comingSoon: true,
    enabled: true,
  },
]

export const mockMenu: Record<string, Product[]> = {
  rest1: [
    {
      id: 'prod1',
      name: 'Classic Burger',
      price: 45,
      description: 'Juicy beef patty with fresh vegetables',
      category: 'Sandwiches',
      allowSauces: true,
      availableSauces: ['Ketchup', 'Mayo', 'Mustard'],
      trackStock: false,
      stockQuantity: null,
      isOutOfStock: false,
    },
    {
      id: 'prod2',
      name: 'Chicken Wrap',
      price: 40,
      description: 'Grilled chicken with vegetables',
      category: 'Sandwiches',
      allowSauces: true,
      availableSauces: ['Ketchup', 'Mayo'],
      trackStock: false,
      stockQuantity: null,
      isOutOfStock: false,
    },
    {
      id: 'prod3',
      name: 'Chocolate Crepe',
      price: 30,
      description: 'Sweet crepe with chocolate sauce',
      category: 'Crepes',
      allowSauces: false,
      trackStock: false,
      stockQuantity: null,
      isOutOfStock: false,
    },
    {
      id: 'prod4',
      name: 'Coca Cola',
      price: 15,
      category: 'Drinks',
      allowSauces: false,
      trackStock: false,
      stockQuantity: null,
      isOutOfStock: false,
    },
  ],
  rest2: [
    {
      id: 'prod5',
      name: 'Club Sandwich',
      price: 50,
      description: 'Triple decker with chicken and bacon',
      category: 'Sandwiches',
      allowSauces: true,
      availableSauces: ['Ketchup', 'Mayo', 'Mustard'],
      trackStock: false,
      stockQuantity: null,
      isOutOfStock: false,
    },
  ],
  rest3: [
    {
      id: 'prod6',
      name: 'Margherita Pizza',
      price: 60,
      description: 'Classic pizza with tomato and mozzarella',
      category: 'Pizza',
      allowSauces: false,
      trackStock: false,
      stockQuantity: null,
      isOutOfStock: false,
    },
  ],
}

export const globalSauces = ['Ketchup', 'Mayo', 'Mustard', 'Hot Sauce', 'BBQ Sauce']
