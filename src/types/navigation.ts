export type RootStackParamList = {
  Home: undefined;
  Products: { category?: string } | undefined;
  ProductDetails: { productId: string; listName: string };
  Cart: undefined;
  Checkout: undefined;
  Confirmation: { transactionId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
