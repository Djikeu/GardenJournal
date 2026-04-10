export const plantsData = [
  {
    id: 1,
    name: "Monstera Deliciosa",
    type: "Indoor • Tropical",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "healthy",
    lastWatered: "2 days",
    temperature: "22°C",
    light: "Bright indirect",
    humidity: "65%",
    isFavorite: true
  },
  {
    id: 2,
    name: "Snake Plant",
    type: "Indoor • Succulent",
    image: "https://images.unsplash.com/photo-1597848212624-a6eb4a53e97a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "healthy",
    lastWatered: "7 days",
    temperature: "24°C",
    light: "Low light",
    humidity: "40%",
    isFavorite: false
  },

];

export const tasksData = [
  {
    id: 1,
    title: "Water Tomato Plants",
    priority: "high",
    completed: false,
    lastWatered: "4 days ago",
    soilCondition: "Soil dry",
    progress: 15
  },
  {
    id: 2,
    title: "Check for pests on Roses",
    priority: "high",
    completed: false,
    issue: "Possible aphid infestation",
    urgency: "Urgent",
    progress: 5
  },
  // Add more tasks...
];

export const statsData = {
  totalPlants: 24,
  needWatering: 8,
  pendingTasks: 12
};


