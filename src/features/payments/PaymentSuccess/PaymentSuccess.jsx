import { Link } from "react-router-dom";
import "../../shared/portal.css";

function PaymentSuccess() {
  return (
    <section className="portal">
      <div className="portal__panel">
        <h1 className="portal__title">Payment Successful</h1>
        <p className="portal__subtitle">
          Thank you! Your payment is being processed and will appear in your
          payment history shortly.
        </p>
        <Link className="portal__button" to="/parent" style={{ display: "inline-block" }}>
          Back to Parent Portal
        </Link>
      </div>
    </section>
  );
}

export default PaymentSuccess;
