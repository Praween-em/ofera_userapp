export const SERVICE_CATEGORY_IMAGES: { [key: string]: any } = {
    'Designers': require('../assets/Designers.png'),
    'Editors': require('../assets/Editors.png'),
    'IT Support': require('../assets/It support.png'),
    'Studios': require('../assets/Studios .png'),
    'Coaching Centers': require('../assets/education&learning.png'),
    'Education & Learning': require('../assets/education&learning.png'),
    'Cooking & Chefs': require('../assets/food&kitchen.png'),
    'Food & Kitchen': require('../assets/food&kitchen.png'),
    'Electrician': require('../assets/electrician.png'),
    'Electricians': require('../assets/electrician.png'),
    'Electrical': require('../assets/electrician.png'),
    'Lawyers': require('../assets/lawyers.png'),
    'Legal Consultants': require('../assets/legal consultants .png'),
    'Legal Consultant': require('../assets/legal consultants .png'),
    'Packers & Movers': require('../assets/packers and movers .png'),
    'Photographs': require('../assets/photographs.png'),
    'Photographers': require('../assets/photographs.png'),
    'Photography': require('../assets/photographs.png'),
    'Salons': require('../assets/salons .png'),
    'Salon': require('../assets/salons .png'),
    'Salon for Women': require('../assets/salons .png'),
    'Men\'s Grooming': require('../assets/salons .png'),
    'Veterinary': require('../assets/petcare.png'),
    'Veternary': require('../assets/petcare.png'),
    'Pet Care': require('../assets/petcare.png'),
    'Website Developers': require('../assets/website developers .png'),
    'Welding Workers': require('../assets/welding workers .png'),
    'Automotive': require('../assets/car&vehical.png'),
    'JCB': require('../assets/jcb_rental.png'),
    'Health & Wellness': require('../assets/HEalth&wellness.png'),
    'Entertainment': require('../assets/Events&entertainments.png'),
    'Events & Entertainments': require('../assets/Events&entertainments.png'),
    'Elderly Care': require('../assets/senior&special.png'),
    'Senior & Special': require('../assets/senior&special.png'),
    // Mapping current seed names
    'Home Maintenance': require('../assets/homeMaintainance.png'),
    'Cleaning & Hygiene': require('../assets/cleaning&hyigene.png'),
    'Personal Care': require('../assets/salons .png'),
    'Professional Experts': require('../assets/lawyers.png'),
    'Plumbers': require('../assets/electrician.png'),
    'Carpenters': require('../assets/welding workers .png'),
    'AC Service & Repair': require('../assets/electrician.png'),
    'Pest Control': require('../assets/cleaning&hyigene.png'),
    'Car': require('../assets/car&vehical.png'),
};

export const getServiceIcon = (name: string) => {
    if (!name) return null;
    // Try exact match first
    if (SERVICE_CATEGORY_IMAGES[name]) return SERVICE_CATEGORY_IMAGES[name];

    // Try Case-insensitive match or contains match
    const lowerName = name.toLowerCase();
    for (const key in SERVICE_CATEGORY_IMAGES) {
        if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
            return SERVICE_CATEGORY_IMAGES[key];
        }
    }

    return null;
};
