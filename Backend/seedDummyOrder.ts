import { adminDb as db } from './lib/firebaseAdmin';

const seedOrder = async () => {
  try {
    const newOrder = {
      customer_name: "Priya Sharma",
      userId: "test_user_id_123",
      design_title: "Bridal Red Lehenga",
      amount: 15000,
      status: "confirmed",
      delivery_status: "pending",
      assigned_to: null,
      tailorId: null,
      dressType: "lehenga",
      orderType: "custom_upload",
      designId: null,
      referenceImages: [
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop"
      ],
      measurementsUsed: {
        chest: 34,
        waist: 28,
        hips: 38,
        shoulder: 14,
        length: 42
      },
      customizationNotes: "Please make the blouse neck a deep V, and ensure the lehenga skirt has double can-can for extra volume. Add gold tassels at the back.",
      pricing: {
        basePrice: 12000,
        customizationPrice: 3000,
        total: 15000
      },
      paymentStatus: "paid",
      trackingHistory: [
        {
          status: "confirmed",
          timestamp: new Date()
        }
      ],
      createdAt: new Date()
    };

    const docRef = await db.collection('orders').add(newOrder);
    console.log(`Successfully created dummy order with ID: ${docRef.id}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating dummy order:', error);
    process.exit(1);
  }
};

seedOrder();
