import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
  },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;

      // ✅ Changed to use _id instead of id
      const exists = state.items.find((p) => p._id === item._id);

      if (exists) {
        exists.quantity = action.payload.quantity;
      } else {
        state.items.push({ ...item, quantity: action.payload.quantity });
      }
    },

    removeFromCart: (state, action) => {
      // ✅ Changed to use _id instead of id
      state.items = state.items.filter((item) => item._id !== action.payload);
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;