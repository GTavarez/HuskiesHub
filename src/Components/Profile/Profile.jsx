import { useContext } from "react";
import "./Profile.css";
import CurrentUserContext from "../../../context/CurrentUserContext";

function Profile() {
  const currentUser = useContext(CurrentUserContext);
  return <div className="profile">
  <section className="profile__sidebar"></section>
  </div>;
}
export default Profile;
