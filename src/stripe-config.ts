export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TwooVPZuQ46ZfP',
    priceId: 'price_1SyvAv3FK8mPYUTPI6l8bYZ6',
    name: 'Elite Sports Complex',
    description: '1 hour booking of futsal at Elite Sports Complex',
    price: 3800.00,
    currency: 'LKR',
    mode: 'payment'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};