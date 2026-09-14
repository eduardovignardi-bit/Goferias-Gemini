export type PropertySource = "GoFerias" | "Airbnb" | "Booking"

export type Property = {
  id: string
  title: string
  images: string[]
  source: PropertySource
  aiOptimized: boolean
  bedrooms: number
  bathrooms: number
  guests: number
  beachDistance: number // meters
  pricePerNight: number
  rating: number
  reviews: number
  type: "Apartamento" | "Casa" | "Studio" | "Cobertura"
  amenities: Array<"ar-condicionado" | "piscina" | "proximo-praia">
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Apartamento 2 Qts com Vista Mar",
    images: ["/properties/apto-vista-mar.png", "/properties/frente-praia.png", "/properties/apto-familia.png"],
    source: "GoFerias",
    aiOptimized: true,
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    beachDistance: 120,
    pricePerNight: 420,
    rating: 4.9,
    reviews: 128,
    type: "Apartamento",
    amenities: ["ar-condicionado", "proximo-praia"],
  },
  {
    id: "2",
    title: "Casa com Piscina Privativa",
    images: ["/properties/casa-piscina.png", "/properties/frente-praia.png"],
    source: "GoFerias",
    aiOptimized: true,
    bedrooms: 3,
    bathrooms: 3,
    guests: 8,
    beachDistance: 480,
    pricePerNight: 890,
    rating: 4.8,
    reviews: 74,
    type: "Casa",
    amenities: ["ar-condicionado", "piscina", "proximo-praia"],
  },
  {
    id: "3",
    title: "Cobertura Duplex com Terraço",
    images: ["/properties/cobertura-terraco.png", "/properties/frente-praia.png"],
    source: "Airbnb",
    aiOptimized: false,
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    beachDistance: 250,
    pricePerNight: 650,
    rating: 4.7,
    reviews: 203,
    type: "Cobertura",
    amenities: ["ar-condicionado", "proximo-praia"],
  },
  {
    id: "4",
    title: "Studio Aconchegante Centro Ingleses",
    images: ["/properties/studio-aconchegante.png"],
    source: "Booking",
    aiOptimized: false,
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    beachDistance: 800,
    pricePerNight: 210,
    rating: 4.5,
    reviews: 56,
    type: "Studio",
    amenities: ["ar-condicionado"],
  },
  {
    id: "5",
    title: "Apartamento Família 3 Qts",
    images: ["/properties/apto-familia.png", "/properties/apto-vista-mar.png"],
    source: "GoFerias",
    aiOptimized: true,
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    beachDistance: 350,
    pricePerNight: 540,
    rating: 4.9,
    reviews: 91,
    type: "Apartamento",
    amenities: ["ar-condicionado", "proximo-praia"],
  },
  {
    id: "6",
    title: "Casa de Praia com Piscina e Churrasqueira",
    images: ["/properties/casa-piscina.png", "/properties/cobertura-terraco.png"],
    source: "Booking",
    aiOptimized: false,
    bedrooms: 4,
    bathrooms: 3,
    guests: 10,
    beachDistance: 600,
    pricePerNight: 1150,
    rating: 4.6,
    reviews: 42,
    type: "Casa",
    amenities: ["piscina"],
  },
  {
    id: "7",
    title: "Studio Frente Mar Premium",
    images: ["/properties/studio-aconchegante.png", "/properties/frente-praia.png"],
    source: "Airbnb",
    aiOptimized: false,
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    beachDistance: 80,
    pricePerNight: 380,
    rating: 4.8,
    reviews: 167,
    type: "Studio",
    amenities: ["ar-condicionado", "proximo-praia"],
  },
  {
    id: "8",
    title: "Apartamento 2 Qts com Piscina no Condomínio",
    images: ["/properties/apto-vista-mar.png", "/properties/casa-piscina.png"],
    source: "GoFerias",
    aiOptimized: true,
    bedrooms: 2,
    bathrooms: 1,
    guests: 4,
    beachDistance: 420,
    pricePerNight: 470,
    rating: 4.7,
    reviews: 88,
    type: "Apartamento",
    amenities: ["ar-condicionado", "piscina", "proximo-praia"],
  },
]

export const amenityLabels: Record<Property["amenities"][number], string> = {
  "ar-condicionado": "Ar condicionado",
  piscina: "Piscina",
  "proximo-praia": "Próximo à praia",
}
