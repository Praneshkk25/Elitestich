
export interface CustomizationOption {
    id: string;
    name: string;
    image: string; // URL to an image/icon
    price: number; // Additional cost
}

export interface CustomizationCategory {
    id: string;
    name: string; // e.g., "Neck Design", "Sleeve Design"
    options: CustomizationOption[];
}

export interface ProductCustomization {
    category: string; // Matches the main product category e.g., "Saree Blouse"
    sections: CustomizationCategory[];
}

export const customizationOptions: ProductCustomization[] = [
    {
        category: 'Saree Blouse',
        sections: [
            {
                id: 'neck',
                name: 'Neck Design',
                options: [
                    { id: 'n1', name: 'V Neck', image: '/images/Blouse Design/V neck.jpeg', price: 0 },
                    { id: 'n2', name: 'U Neck', image: '/images/Blouse Design/U neck.jpeg', price: 0 },
                    { id: 'n3', name: 'Round Neck', image: '/images/Blouse Design/round.jpeg', price: 150 },
                    { id: 'n4', name: 'Square Neck', image: '/images/Blouse Design/square.jpeg', price: 0 },
                    { id: 'n5', name: 'Boat Neck', image: '/images/Blouse Design/Boat neck.jpg', price: 200 },
                ]
            },
            {
                id: 'sleeve',
                name: 'Sleeve Design',
                options: [
                    { id: 's0', name: 'No Sleeve', image: '/images/Blouse Design/no sleeve.png', price: 0 },
                    { id: 's1', name: 'Short Sleeve', image: '/images/Blouse Design/short sleeve.png', price: 0 },
                    { id: 's2', name: 'Elbow Sleeve', image: '/images/Blouse Design/elbow sleeve.png', price: 100 },
                    { id: 's3', name: 'Full Sleeve', image: '/images/Blouse Design/full sleeve.png', price: 200 },
                    { id: 's4', name: 'Puff Sleeve', image: '/images/Blouse Design/puff sleeve.png', price: 250 },
                    { id: 's5', name: 'Cap Sleeve', image: '/images/Blouse Design/cap sleeve.png', price: 0 },
                ]
            },
            {
                id: 'knot',
                name: 'Back Knot',
                options: [
                    { id: 'k1', name: 'No Knot', image: '/images/Blouse Design/no knot.png', price: 0 },
                    { id: 'k2', name: 'With Knot', image: '/images/Blouse Design/with knot.png', price: 50 },
                ]
            },
            {
                id: 'back_design',
                name: 'Back Design',
                options: [
                    { id: 'bd1', name: 'Pot Neck', image: '/images/Blouse Design/pot neck back.png', price: 150 },
                    { id: 'bd2', name: 'Bow Back', image: '/images/Blouse Design/bow back.png', price: 200 },
                    { id: 'bd3', name: 'Keyhole', image: '/images/Blouse Design/keyhole back.png', price: 100 },
                ]
            }
        ]
    },
    {
        category: 'Chudithar',
        sections: [
            {
                id: 'neck',
                name: 'Neck Design',
                options: [
                    { id: 'cn1', name: 'V Neck', image: '/images/Blouse Design/V neck.jpeg', price: 0 },
                    { id: 'cn2', name: 'U Neck', image: '/images/Blouse Design/U neck.jpeg', price: 0 },
                    { id: 'cn3', name: 'Round Neck', image: '/images/Blouse Design/round.jpeg', price: 150 },
                    { id: 'cn4', name: 'Square Neck', image: '/images/Blouse Design/square.jpeg', price: 0 },
                ]
            },
            {
                id: 'bottom',
                name: 'Bottom Wear Style',
                options: [
                    { id: 'cb1', name: 'Regular Salwar', image: 'https://placehold.co/100x100?text=Salwar', price: 0 },
                    { id: 'cb2', name: 'Patiala', image: 'https://placehold.co/100x100?text=Patiala', price: 200 },
                    { id: 'cb3', name: 'Cigarette Pant', image: 'https://placehold.co/100x100?text=Pant', price: 150 },
                ]
            }
        ]
    },
    {
        category: 'Lehenga',
        sections: [
            {
                id: 'neck',
                name: 'Neck Design',
                options: [
                    { id: 'ln1', name: 'V Neck', image: '/images/Blouse Design/V neck.jpeg', price: 0 },
                    { id: 'ln2', name: 'U Neck', image: '/images/Blouse Design/U neck.jpeg', price: 0 },
                    { id: 'ln3', name: 'Round Neck', image: '/images/Blouse Design/round.jpeg', price: 150 },
                    { id: 'ln4', name: 'Square Neck', image: '/images/Blouse Design/square.jpeg', price: 0 },
                ]
            },
            {
                id: 'blouse',
                name: 'Blouse Style',
                options: [
                    { id: 'lb1', name: 'Crop Top', image: 'https://placehold.co/100x100?text=Crop', price: 0 },
                    { id: 'lb2', name: 'Peplum', image: 'https://placehold.co/100x100?text=Peplum', price: 250 },
                    { id: 'lb3', name: 'Corset', image: 'https://placehold.co/100x100?text=Corset', price: 300 },
                ]
            },
            {
                id: 'skirt',
                name: 'Skirt Flair',
                options: [
                    { id: 'ls1', name: 'A-Line', image: 'https://placehold.co/100x100?text=A-Line', price: 0 },
                    { id: 'ls2', name: 'Full Flair (Can-Can)', image: 'https://placehold.co/100x100?text=Flair', price: 500 },
                    { id: 'ls3', name: 'Fish Cut', image: 'https://placehold.co/100x100?text=Fish+Cut', price: 300 },
                ]
            }
        ]
    },
    {
        category: 'Half Saree',
        sections: [
            {
                id: 'neck',
                name: 'Neck Design',
                options: [
                    { id: 'hsn1', name: 'V Neck', image: '/images/Blouse Design/V neck.jpeg', price: 0 },
                    { id: 'hsn2', name: 'U Neck', image: '/images/Blouse Design/U neck.jpeg', price: 0 },
                    { id: 'hsn3', name: 'Round Neck', image: '/images/Blouse Design/round.jpeg', price: 150 },
                    { id: 'hsn4', name: 'Square Neck', image: '/images/Blouse Design/square.jpeg', price: 0 },
                ]
            },
            {
                id: 'blouse',
                name: 'Blouse Pattern',
                options: [
                    { id: 'hsb1', name: 'Classic Short', image: 'https://placehold.co/100x100?text=Classic', price: 0 },
                    { id: 'hsb2', name: 'Long Blouse', image: 'https://placehold.co/100x100?text=Long', price: 150 },
                ]
            },
            {
                id: 'sleeve',
                name: 'Sleeve Design',
                options: [
                    { id: 'hss1', name: 'Short Sleeve', image: 'https://placehold.co/100x100?text=Short', price: 0 },
                    { id: 'hss2', name: 'Elbow Sleeve', image: 'https://placehold.co/100x100?text=Elbow', price: 100 },
                    { id: 'hss3', name: 'Puff Sleeve', image: 'https://placehold.co/100x100?text=Puff', price: 200 },
                ]
            }
        ]
    }
];

export function getCustomizationOptions(category: string): ProductCustomization | undefined {
    return customizationOptions.find(c => c.category === category);
}
