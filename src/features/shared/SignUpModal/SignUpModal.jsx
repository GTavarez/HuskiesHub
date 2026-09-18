import "./SignUpModal.css";
import ModalWithForm from "../ModalWithForm/ModalWithForm.jsx";

import { useForm } from "../../../hooks/useForm.js";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeams } from "../../../api/teams.js";
import { queryKeys } from "../../../api/queryKeys.js";

function SignUpModal({
  isOpen,
  onClose,
  activeModal,
  onSignInModal,
  onRegister,
}) {
  const defaultValues = useMemo(
    () => ({
      name: "",
      email: "",
      phone: "",
      password: "",
    }),
    []
  );

  const { values, handleChange, setValues } = useForm(defaultValues);
  const [isCoach, setIsCoach] = useState(false);
  const [coachTeamId, setCoachTeamId] = useState("");

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
    enabled: isCoach,
  });

  const passwordMatches = values.password === values.confirmPassword;

  useEffect(() => {
    if (activeModal) {
      setValues(defaultValues); // Reset form when modal opens
      setIsCoach(false);
      setCoachTeamId("");
    }
  }, [activeModal, setValues, defaultValues]);
  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      confirmPassword: values.confirmPassword,
      coachTeamId: isCoach ? coachTeamId : null,
    });
  };
  return (
    <ModalWithForm
      buttonText="Sign up"
      title="Sign up"
      name="Sign up"
      onClose={onClose}
      onSubmit={handleSubmit}
      isOpen={isOpen}
      hideSubmitButton={true}
    >
      <label className="modal__label">
        Name{" "}
        <input
          className="modal__input"
          type="text"
          name="name"
          required
          id="name"
          value={values.name}
          minLength="1"
          maxLength="30"
          placeholder="Name"
          onChange={handleChange}
        />
      </label>
      <label className="modal__label">
        Email{" "}
        <input
          className="modal__input"
          type="email"
          name="email"
          id="email"
          required
          minLength="1"
          maxLength="30"
          placeholder="email"
          value={values.email}
          onChange={handleChange}
        />
      </label>
      <label className="modal__label">
        Phone{" "}
        <input
          className="modal__input"
          type="tel"
          name="phone"
          id="phone"
          maxLength="20"
          placeholder="Phone (optional)"
          value={values.phone}
          onChange={handleChange}
        />
      </label>
      <label className="modal__label modal__checkbox-label">
        <input
          type="checkbox"
          checked={isCoach}
          onChange={(e) => setIsCoach(e.target.checked)}
        />{" "}
        I'm a Huskies Coach
      </label>
      {isCoach && (
        <label className="modal__label">
          Which team do you coach?{" "}
          <select
            className="modal__input"
            value={coachTeamId}
            onChange={(e) => setCoachTeamId(e.target.value)}
            required
          >
            <option value="">Select a team…</option>
            {teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
          <span className="modal__coach-note">
            A club admin will approve coach access before your dashboard unlocks.
          </span>
        </label>
      )}
      <label className="modal__label">
        Password{" "}
        <input
          className="modal__input"
          type="password"
          name="password"
          id="password"
          minLength="8"
          value={values.password}
          required
          onChange={handleChange}
          placeholder="Password"
        />
      </label>
      <label className="modal__label">
        Confirm Password{" "}
        <input
          className="modal__input"
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          minLength="8"
          value={values.confirmPassword}
          required
          onChange={handleChange}
          placeholder="Confirm Password"
        />
      </label>
      {!passwordMatches && (
        <span className="modal__password_match">Password must match</span>
      )}
      <div className="modal__auth-buttons">
        <button
          disabled={!passwordMatches || values.password === ""}
          type="submit"
          className="modal__submit"
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => {
            onSignInModal();
            onClose();
          }}
          className="modal__login-button"
        >
          or Log In
        </button>
      </div>
    </ModalWithForm>
  );
}
export default SignUpModal;
