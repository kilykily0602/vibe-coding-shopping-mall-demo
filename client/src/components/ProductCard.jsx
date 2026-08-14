import { Link } from "react-router-dom";

function ProductCard({ item, tall = false }) {
  const priceLabel =
    typeof item.price === "number"
      ? item.price.toLocaleString()
      : item.price;

  const productId = item.id || item._id;

  return (
    <article className="product-card">
      <Link to={`/products/${productId}`} className="product-card__link">
        <div
          className={`product-card__media${tall ? " product-card__media--tall" : ""}`}
        >
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
          />
        </div>
        <p className="product-card__brand">{item.brand || "MIZUHO"}</p>
        <h3>{item.name}</h3>
        <p className="product-card__price">{priceLabel}원</p>
      </Link>
    </article>
  );
}

export default ProductCard;
