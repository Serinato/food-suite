export const RESTAURANTS = [
  {
    id: 1,
    name: "The Pizza Project",
    rating: "4.3★",
    cuisine: "Italian • Pizzas • Desserts",
    price: "₹400 for two",
    time: "25-30 min",
    distance: "2.4 km",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    tags: ["FREE DELIVERY"],
    isFavorite: false,
    menu: [
      {
        id: 101,
        name: "Margherita Classic",
        description: "San Marzano tomatoes, fresh mozzarella di bufala, basil, and olive oil.",
        price: 12.00,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?auto=format&fit=crop&q=80&w=400"
      },
      {
        id: 102,
        name: "Spicy Diavola",
        description: "Spicy salami, calabrian chili, tomato sauce, mozzarella, and honey.",
        price: 14.50,
        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=400",
        isSpicy: true
      },
      {
        id: 103,
        name: "Truffle Mushroom",
        description: "Wild forest mushrooms, black truffle oil, taleggio cheese, and herbs.",
        price: 16.00,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400"
      },
      {
        id: 104,
        name: "Burrata & Prosciutto",
        description: "Creamy burrata center, aged prosciutto di parma, arugula, and balsamic.",
        price: 18.00,
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=400"
      }
    ]
  },
  {
    id: 2,
    name: "Wok & Roll Express",
    rating: "4.2★",
    cuisine: "Chinese • Asian • Seafood",
    price: "₹350 for two",
    time: "15-20 min",
    distance: "1.1 km",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=800",
    tags: ["FREE DELIVERY"],
    isFavorite: false
  },
  {
    id: 3,
    name: "Kolshet Biryani House",
    rating: "4.7★",
    cuisine: "North Indian • Mughlai",
    price: "₹500 for two",
    time: "35-40 min",
    distance: "3.8 km",
    image: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: [],
    isFavorite: false
  }
];

export const CATEGORIES = [
  "Veg", "Non-Veg"
];
