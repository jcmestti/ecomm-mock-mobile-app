export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  color: string;
  symbol: string;
  description: string;
};

export const products: Product[] = [
  { id: 'NS-1001', name: 'Trail Daypack', brand: 'Northstar', category: 'Bags', price: 89, color: '#C56A45', symbol: 'PACK', description: 'A lightweight 18L daypack with padded straps, two quick-access pockets, and a weather-resistant finish.' },
  { id: 'NS-1002', name: 'Summit Bottle', brand: 'Northstar', category: 'Drinkware', price: 32, color: '#477B72', symbol: '1L', description: 'Double-wall stainless steel bottle that keeps drinks cold for 24 hours and hot for 12.' },
  { id: 'NS-1003', name: 'Field Cap', brand: 'Northstar', category: 'Apparel', price: 28, color: '#C2A052', symbol: 'CAP', description: 'A breathable, quick-drying cap with an adjustable recycled nylon strap.' },
  { id: 'NS-1004', name: 'Camp Mug', brand: 'Northstar', category: 'Drinkware', price: 24, color: '#536C83', symbol: '12oz', description: 'Durable enamel-coated camp mug sized for coffee by the fire or at your desk.' },
  { id: 'NS-1005', name: 'Ridge Blanket', brand: 'Northstar', category: 'Outdoor', price: 74, color: '#8D5B50', symbol: 'WARM', description: 'A soft recycled-wool blend blanket made for cool evenings and weekend escapes.' },
  { id: 'NS-1006', name: 'Utility Tote', brand: 'Northstar', category: 'Bags', price: 46, color: '#6F7654', symbol: 'TOTE', description: 'A structured canvas tote with reinforced handles and an interior organizer pocket.' },
  { id: 'NS-1007', name: 'Merino Socks', brand: 'Northstar', category: 'Apparel', price: 22, color: '#675B76', symbol: 'PAIR', description: 'Cushioned merino-blend socks that regulate temperature from trail to town.' },
  { id: 'NS-1008', name: 'Pocket Lantern', brand: 'Northstar', category: 'Outdoor', price: 38, color: '#B77835', symbol: 'LAMP', description: 'A compact rechargeable lantern with three brightness levels and a warm ambient glow.' },
  { id: 'NS-1009', name: 'Travel Pouch', brand: 'Northstar', category: 'Bags', price: 34, color: '#557078', symbol: 'ZIP', description: 'A versatile zip pouch for cables, toiletries, and small travel essentials.' },
];

export const findProduct = (id: string) => products.find((product) => product.id === id);
