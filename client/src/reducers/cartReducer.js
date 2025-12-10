let initialState = [];

if (typeof window !== 'undefined') {
  if (localStorage.getItem('cart')) {
    initialState = JSON.parse(localStorage.getItem('cart'));
  } else {
    initialState = [];
  }
}

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const itemToAdd = action.payload;
      const existItem = state.find((item) => item.product_id === itemToAdd.product_id);

      if (existItem) {
        return state.map((item) =>
          item.product_id === itemToAdd.product_id
            ? { ...item, count: (item.count || 0) + (itemToAdd.count || 1) }
            : item,
        );
      } else {
        return [...state, { ...itemToAdd, count: itemToAdd.count || 1 }];
      }
    }

    case 'UPDATE_QUANTITY':
      return state.map((item) =>
        item.product_id === action.payload.product_id
          ? { ...item, count: action.payload.count }
          : item,
      );

    case 'UPDATE_CART':
      return action.payload;

    case 'REMOVE_CART_ITEMS': {
      // Xóa những item có product_id nằm trong mảng payload
      const productIdsToRemove = action.payload || [];
      return state.filter((item) => !productIdsToRemove.includes(item.product_id));
    }

    case 'CLEAR_CART':
      return [];

    default:
      return state;
  }
};
