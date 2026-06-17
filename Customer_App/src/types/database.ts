export type DressCategory = 'blouse' | 'lehenga' | 'chudithar' | 'half_saree' | 'salwar' | 'gown' | 'suit';

export interface BlouseMeasurements {
    bust: number;
    waist: number;
    frontNeckDepth: number;
    backNeckDepth: number;
    shoulder: number;
    sleeveLength: number;
    armhole: number;
    sleeveRound: number;
    blouseLength: number;
}

export interface LehengaMeasurements {
    waist: number;
    hips: number;
    length: number;
}

export interface ChuditharMeasurements {
    topLength: number;
    chest: number;
    waist: number;
    hips: number;
    bottomLength: number;
    ankle: number;
    sleeveLength: number;
    shoulder: number;
    neckDepth: number;
}

export interface HalfSareeMeasurements {
    skirtLength: number;
    skirtWaist: number;
    skirtHips: number;
    blouseBust: number;
    blouseWaist: number;
    blouseFrontNeck: number;
    blouseBackNeck: number;
    blouseShoulder: number;
    blouseSleeve: number;
    dhavaniLength: number;
}

// Flexible measurement profile
export type Measurements = {
    blouse?: BlouseMeasurements;
    lehenga?: LehengaMeasurements;
    chudithar?: ChuditharMeasurements;
    half_saree?: HalfSareeMeasurements;
    [key: string]: any; // Allow extensibility for other dress types
};

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role?: 'admin' | 'customer';
    phoneNumber: string | null;
    measurementsProfiles: Measurements;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    } | null;
    createdAt: any; // Date | Timestamp
}

export interface Design {
    id: string;
    name: string;
    category: DressCategory;
    basePrice: number;
    imageUrls: string[];
    description: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'fabric_received' | 'pattern_cutting' | 'stitching' | 'stitching_progress' | 'embroidery' | 'finished' | 'pending_qc' | 'ready_for_delivery' | 'delivered';
export type PaymentStatus = 'unpaid' | 'advance_paid' | 'fully_paid';

export interface OrderPricing {
    baseCost: number;
    embroideryWorkCost: number;
    fabricCost: number;
    totalAmount: number;
}

export interface Order {
    id: string; // Auto-generated Firestore ID
    userId: string;
    orderType: 'catalog_design' | 'custom_upload';
    designId: string | null;
    design_title?: string;
    amount?: number;
    referenceImages: string[]; // URLs of uploaded photos
    dressType: DressCategory;
    measurementsUsed: any; // Snapshot of the measurements at the time of order
    measurementMethod?: string;
    customizationNotes: string;
    pricing: OrderPricing;
    paymentStatus: PaymentStatus;
    payment_status?: string;
    status: OrderStatus;
    deliveryPartnerId: string | null;
    tailorId: string | null;
    trackingHistory: {
        status: OrderStatus;
        timestamp: any;
        note?: string;
    }[];
    qc_photo?: string | null;
    qc_rejected_note?: string | null;
    createdAt: any;
}

export interface Review {
    id: string;
    designId: string;
    orderId: string;
    userId: string;
    userName: string;
    rating: number; // 1-5
    comment: string;
    images?: string[];
    createdAt: any;
}

export interface DeliveryPartner {
    id: string;
    name: string;
    phoneNumber: string;
    vehicleType: string;
    status: 'available' | 'busy' | 'offline';
}

export interface Tailor {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    skills: DressCategory[];
    status: 'active' | 'inactive';
    createdAt: any;
}

export interface ChatMessage {
    id?: string;
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'tailor' | 'admin';
    text: string;
    imageUrl?: string | null;
    audioUrl?: string | null;
    timestamp: any;
}
