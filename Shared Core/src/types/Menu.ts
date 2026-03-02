export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  modifiers?: FoodModifier[];
}

export interface FoodModifier {
  id: string;
  name: string;
  options: ModifierOption[];
  minSelections: number;
  maxSelections: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}
