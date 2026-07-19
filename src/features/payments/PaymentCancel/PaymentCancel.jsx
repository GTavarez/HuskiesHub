import { Link } from "react-router-dom";
import "../../shared/portal.css";

function PaymentCancel() {
  return (
    <section className="portal">
      <div className="portal__panel">
        <h1 className="portal__title">Payment Canceled</h1>
        <p className="portal__subtitle">
          No charge was made. You can try again anytime from the parent portal.
        </p>
        <Link className="portal__button" to="/parent" style={{ display: "inline-block" }}>
          Back to Parent Portal
        </Link>
      </div>
    </section>
  );
}

export default PaymentCancel;
