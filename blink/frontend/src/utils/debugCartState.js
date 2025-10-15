// Utility to debug cart state in browser console
export const debugCartState = async () => {
  console.log("=== CART DEBUG ===");
  // Frontend cart context (if exposed)
  console.log("Frontend cart:", window.cartContext?.items);
  // Server cart
  const response = await fetch("/api/cart", { credentials: "include" });
  const serverCart = await response.json();
  console.log("Server cart:", serverCart);
  // Compare quantities
  const frontendItems = window.cartContext?.items || [];
  const serverItems = serverCart.items || [];
  console.log("=== QUANTITY COMPARISON ===");
  frontendItems.forEach((frontendItem) => {
    const serverItem = serverItems.find(
      (si) => si.product_id === frontendItem.id,
    );
    console.log(`Product ${frontendItem.title}:`, {
      frontend_qty: frontendItem.quantity,
      server_qty: serverItem?.quantity,
      match: frontendItem.quantity === serverItem?.quantity,
    });
  });
};

// To use: import { debugCartState } from '../utils/debugCartState'; then call debugCartState() in browser console.
