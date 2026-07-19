import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  createProduct,
  deactivateProduct,
} from "../../../api/products.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const PRODUCT_TYPES = ["camp", "lesson", "apparel"];

function ProductsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [type, setType] = useState("camp");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => getProducts(undefined, token),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createProduct(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      setName("");
      setDescription("");
      setPrice("");
      pushToast({ type: "success", message: "Product added." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add product." });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => deactivateProduct(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      pushToast({ type: "success", message: "Product deactivated." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      pushToast({ type: "error", message: "Name and price are required." });
      return;
    }
    createMutation.mutate({
      type,
      name: name.trim(),
      description: description.trim(),
      priceCents: Math.round(Number(price) * 100),
    });
  };

  return (
    <div>
      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="product-type">
          Type
        </label>
        <select
          id="product-type"
          className="portal__select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {PRODUCT_TYPES.map((productType) => (
            <option key={productType} value={productType}>
              {productType}
            </option>
          ))}
        </select>

        <label className="portal__label" htmlFor="product-name">
          Name
        </label>
        <input
          id="product-name"
          className="portal__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Winter Hitting Camp"
        />

        <label className="portal__label" htmlFor="product-description">
          Description
        </label>
        <input
          id="product-description"
          className="portal__input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="portal__label" htmlFor="product-price">
          Price ($)
        </label>
        <input
          id="product-price"
          className="portal__input"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="99.00"
        />

        <button type="submit" className="portal__button" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving..." : "Add Product"}
        </button>
      </form>

      {products.length === 0 && <p className="portal__empty">No products yet.</p>}
      {products.map((product) => (
        <div key={product._id} className="portal__card portal__card--row">
          <div>
            <span className="portal__badge">{product.type}</span>{" "}
            <strong>{product.name}</strong>
            <p className="portal__card-meta">
              ${(product.priceCents / 100).toFixed(2)}
              {!product.active && " — inactive"}
            </p>
          </div>
          {product.active && (
            <button
              type="button"
              className="portal__link-button"
              onClick={() => deactivateMutation.mutate(product._id)}
            >
              Deactivate
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default ProductsPanel;
