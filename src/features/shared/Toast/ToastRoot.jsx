import ToastContainer from "./ToastContainer.jsx";
import { useToast } from "../../../context/ToastContext.js";

function ToastRoot() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onDismiss={removeToast} />;
}

export default ToastRoot;
