import { notFound } from 'next/navigation';
import CustomizationInterface from './CustomizationInterface';
import { getCustomizationOptions } from '@/data/customizationOptions';
import { designs } from '@/data/designs';

interface PageProps {
    params: Promise<{
        category: string;
    }>;
}

export default async function CustomizePage({ params }: PageProps) {
    const { category } = await params;

    // Decode the category from URL (e.g. Saree%20Blouse -> Saree Blouse)
    const decodedCategory = decodeURIComponent(category);

    const customizationData = getCustomizationOptions(decodedCategory);

    if (!customizationData) {
        // Fallback or 404 if no options defined for this category
        // For now, let's just return 404, or we could show a "Coming Soon"
        return notFound();
    }

    // Find base price from designs data
    const designInfo = designs.find(d => d.category === decodedCategory);
    const basePrice = designInfo?.basePrice || 1500;

    return (
        <CustomizationInterface
            customizationData={customizationData}
            initialBasePrice={basePrice}
        />
    );
}
