export const getProductCategoryName = (item = {}, detail = item) => (
  item?.categoriaProducto?.nombre
  || item?.producto?.categoriaProducto?.nombre
  || detail?.categoriaProducto?.nombre
  || 'No especificada'
);
