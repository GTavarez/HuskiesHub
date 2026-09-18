import { Link, useSearchParams } from "react-router-dom";
import "../../shared/portal.css";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const isSetup = searchParams.get("setup") === "1";

  return (
    <section className="portal">
      <div className="portal__panel">
        <h1 className="portal__title">
          {isSetup ? "Payment Method Updated" : "Payment Successful"}
        </h1>
        <p className="portal__subtitle">
          {isSetup
            ? "Your card has been saved and will be used for future payments."
            : "Thank you! Your payment is being processed and will appear in your payment history shortly."}
        </p>
        <Link className="portal__button" to="/parent" style={{ display: "inline-block" }}>
          Back to Parent Portal
        </Link>
      </div>
    </section>
  );
}

export default PaymentSuccess;
