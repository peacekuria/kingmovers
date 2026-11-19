// Nairobi County reference data. Coordinates are approximate estate centroids.
export const NAIROBI_CENTER = [-1.2864, 36.8172];

export const ESTATES = [
  { id: 'cbd', name: 'Nairobi CBD', lat: -1.2864, lng: 36.8172 },
  { id: 'westlands', name: 'Westlands', lat: -1.2676, lng: 36.8108 },
  { id: 'parklands', name: 'Parklands', lat: -1.26, lng: 36.82 },
  { id: 'kilimani', name: 'Kilimani', lat: -1.2921, lng: 36.7856 },
  { id: 'kileleshwa', name: 'Kileleshwa', lat: -1.2833, lng: 36.7833 },
  { id: 'lavington', name: 'Lavington', lat: -1.28, lng: 36.77 },
  { id: 'upperhill', name: 'Upper Hill', lat: -1.3, lng: 36.815 },
  { id: 'karen', name: 'Karen', lat: -1.3197, lng: 36.7073 },
  { id: 'langata', name: "Lang'ata", lat: -1.36, lng: 36.74 },
  { id: 'southb', name: 'South B', lat: -1.31, lng: 36.835 },
  { id: 'southc', name: 'South C', lat: -1.32, lng: 36.825 },
  { id: 'eastleigh', name: 'Eastleigh', lat: -1.275, lng: 36.85 },
  { id: 'donholm', name: 'Donholm', lat: -1.295, lng: 36.885 },
  { id: 'embakasi', name: 'Embakasi', lat: -1.32, lng: 36.9 },
  { id: 'utawala', name: 'Utawala', lat: -1.285, lng: 36.96 },
  { id: 'kasarani', name: 'Kasarani', lat: -1.22, lng: 36.9 },
  { id: 'roysambu', name: 'Roysambu', lat: -1.218, lng: 36.888 },
  { id: 'kahawa', name: 'Kahawa West', lat: -1.185, lng: 36.905 },
  { id: 'runda', name: 'Runda', lat: -1.218, lng: 36.81 },
];

// Each item: weight (kg) and volume (m³) used by the quote estimator.
const item = (name, kg, m3) => ({ name, kg, m3 });

const KITCHEN = [item('Gas cooker', 30, 0.4), item('Fridge', 60, 0.8), item('Utensils (boxes)', 20, 0.3), item('Water dispenser', 12, 0.15)];
const BED = [item('Bed frame', 45, 1.2), item('Mattress', 25, 0.9), item('Wardrobe', 70, 1.5), item('Clothes (boxes)', 25, 0.4)];
const LIVING = [item('Sofa set (5-seater)', 90, 2.5), item('TV & stand', 30, 0.6), item('Coffee table', 15, 0.3), item('Carpet', 12, 0.2)];

export const TEMPLATES = {
  Bedsitter: { label: 'Bedsitter', icon: '🛏️', rooms: { 'Main room': [item('Single bed', 30, 0.8), item('Mattress', 18, 0.6), item('Gas cooker', 20, 0.3), item('Utensils (box)', 10, 0.15), item('Clothes (boxes)', 15, 0.3), item('Plastic chairs', 6, 0.2)] } },
  Studio: { label: 'Studio', icon: '🏙️', rooms: { 'Living & sleeping': [item('Queen bed', 40, 1.0), item('Mattress', 22, 0.8), item('Loveseat', 35, 1.0), item('TV', 10, 0.2), item('Clothes (boxes)', 20, 0.35)], Kitchenette: [item('Fridge (small)', 35, 0.5), item('Gas cooker', 25, 0.35), item('Utensils (boxes)', 15, 0.25)] } },
  '1BR': { label: '1 Bedroom', icon: '🏠', rooms: { Bedroom: BED, 'Living room': LIVING, Kitchen: KITCHEN } },
  '2BR': { label: '2 Bedroom', icon: '🏡', rooms: { 'Master bedroom': BED, 'Second bedroom': [item('Bed frame', 40, 1.0), item('Mattress', 22, 0.8), item('Study desk', 25, 0.5), item('Books (boxes)', 30, 0.3)], 'Living room': [...LIVING, item('Dining table + 6 chairs', 80, 1.8)], Kitchen: [...KITCHEN, item('Microwave', 12, 0.1)] } },
};

// Real Nairobi photography (Unsplash License, see public/images/CREDITS.md).
// Add a matching MP4 under /public/videos to play footage over any photo.
export const HERO_SLIDES = [
  { img: '/images/nairobi-kicc.jpg', sm: '/images/nairobi-kicc-sm.jpg', caption: 'City Hall & KICC, Nairobi CBD', video: '/videos/hero.mp4' },
  { img: '/images/nairobi-upperhill.jpg', sm: '/images/nairobi-upperhill-sm.jpg', caption: 'Upper Hill at golden hour' },
  { img: '/images/nairobi-greencity.jpg', sm: '/images/nairobi-greencity-sm.jpg', caption: 'The green city in the sun' },
];

export const CITY_PHOTOS = [
  { id: 'cbd', title: 'Heart of the city', area: 'Nairobi CBD', img: '/images/nairobi-kicc.jpg', video: '/videos/cbd.mp4' },
  { id: 'westlands', title: 'Business & high-rise living', area: 'Westlands', img: '/images/nairobi-westlands.jpg', video: '/videos/westlands.mp4' },
  { id: 'uhuru', title: 'City lights after dark', area: 'Uhuru Park', img: '/images/nairobi-uhuru-night.jpg', video: '/videos/night.mp4' },
  { id: 'leafy', title: 'Leafy suburbs at dawn', area: 'Kileleshwa & Lavington', img: '/images/nairobi-dawn.jpg', video: '/videos/suburbs.mp4' },
];
