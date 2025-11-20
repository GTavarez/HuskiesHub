import { useState } from "react";

export function useForm(defaultValues) {
  const [values, setValues] = useState(defaultValues);
  const resetForm = () => {
    setValues(defaultValues);
  };
  function handleChange(evt) {
    const { name, value } = evt.target;
    setValues({ ...values, [name]: value });
  }
  return { values, setValues, handleChange, resetForm };
}
