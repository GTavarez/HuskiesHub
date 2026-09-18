import { useQuery } from "@tanstack/react-query";
import { getTeamContacts } from "../../../api/players.js";
import { queryKeys } from "../../../api/queryKeys.js";

const ROLE_LABELS = { parent: "Parent", player: "Player", coach: "Coach", admin: "Admin" };

function CoachContactsPanel({ teamId, token }) {
  const { data: contacts = [] } = useQuery({
    queryKey: queryKeys.teamContacts(teamId),
    queryFn: () => getTeamContacts(teamId, token),
    enabled: Boolean(teamId && token),
  });

  return (
    <div>
      <h3 className="portal__section-title">Team Contacts</h3>
      {contacts.length === 0 && <p className="portal__empty">No contacts on file for this team yet.</p>}
      {contacts.map((contact) => (
        <div key={contact._id} className="portal__card portal__card--row">
          <div>
            <span className="portal__badge">{ROLE_LABELS[contact.role] || contact.role}</span>{" "}
            <strong>{contact.name}</strong>
            <p className="portal__card-meta">
              {contact.email}
              {contact.phone ? ` · ${contact.phone}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CoachContactsPanel;
