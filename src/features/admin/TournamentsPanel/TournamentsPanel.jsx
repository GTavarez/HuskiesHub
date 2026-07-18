import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTournaments,
  createTournament,
  getHotelReservationsForTournament,
  createHotelReservation,
  getPendingHotelReservations,
  updateHotelReservationStatus,
} from "../../../api/tournaments.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function centsToDollars(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

function HotelReservationForm({ tournamentId, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [hotelName, setHotelName] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomCount, setRoomCount] = useState("1");
  const [costCents, setCostCents] = useState("");

  const createMutation = useMutation({
    mutationFn: (payload) => createHotelReservation(tournamentId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotelReservations(tournamentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingHotelReservations() });
      setHotelName("");
      setConfirmationNumber("");
      setCheckIn("");
      setCheckOut("");
      setRoomCount("1");
      setCostCents("");
      pushToast({ type: "success", message: "Hotel reservation added." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add reservation." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hotelName || !checkIn || !checkOut) {
      pushToast({ type: "error", message: "Hotel name, check-in, and check-out are required." });
      return;
    }
    createMutation.mutate({
      hotelName,
      confirmationNumber,
      checkIn,
      checkOut,
      roomCount: Number(roomCount) || 1,
      costCents: Math.round(Number(costCents || 0) * 100),
    });
  };

  return (
    <form className="portal__form" onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      <label className="portal__label" htmlFor={`hotel-name-${tournamentId}`}>
        Hotel Name
      </label>
      <input
        id={`hotel-name-${tournamentId}`}
        className="portal__input"
        value={hotelName}
        onChange={(e) => setHotelName(e.target.value)}
      />

      <label className="portal__label" htmlFor={`hotel-conf-${tournamentId}`}>
        Confirmation Number
      </label>
      <input
        id={`hotel-conf-${tournamentId}`}
        className="portal__input"
        value={confirmationNumber}
        onChange={(e) => setConfirmationNumber(e.target.value)}
      />

      <div className="portal__row" style={{ gap: 8 }}>
        <input
          className="portal__input"
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
        <input
          className="portal__input"
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </div>

      <div className="portal__row" style={{ gap: 8 }}>
        <input
          className="portal__input"
          type="number"
          min="1"
          placeholder="Rooms"
          value={roomCount}
          onChange={(e) => setRoomCount(e.target.value)}
        />
        <input
          className="portal__input"
          type="number"
          min="0"
          step="0.01"
          placeholder="Cost ($)"
          value={costCents}
          onChange={(e) => setCostCents(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="portal__button"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Saving..." : "Add Reservation"}
      </button>
    </form>
  );
}

function TournamentRow({ tournament, token }) {
  const [expanded, setExpanded] = useState(false);

  const { data: reservations = [] } = useQuery({
    queryKey: queryKeys.hotelReservations(tournament._id),
    queryFn: () => getHotelReservationsForTournament(tournament._id, token),
    enabled: Boolean(expanded && token),
  });

  return (
    <div className="portal__card">
      <div className="portal__card-header">
        <span className="portal__badge">{tournament.status}</span>
        <strong>{tournament.name}</strong>
      </div>
      <p className="portal__card-meta">
        {new Date(tournament.startDate).toLocaleDateString()} –{" "}
        {new Date(tournament.endDate).toLocaleDateString()}
        {tournament.location ? ` · ${tournament.location}` : ""}
      </p>
      <button
        type="button"
        className="portal__link-button"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? "Hide hotel reservations" : "View hotel reservations"}
      </button>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          {reservations.length === 0 && (
            <p className="portal__empty">No hotel reservations yet.</p>
          )}
          {reservations.map((reservation) => (
            <div key={reservation._id} className="portal__row" style={{ padding: "6px 0" }}>
              <span>
                {reservation.hotelName} — {reservation.roomCount} room(s),{" "}
                {centsToDollars(reservation.costCents)} ({reservation.status})
              </span>
            </div>
          ))}
          <HotelReservationForm tournamentId={tournament._id} token={token} />
        </div>
      )}
    </div>
  );
}

function PendingHotelReservations({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: pending = [] } = useQuery({
    queryKey: queryKeys.pendingHotelReservations(),
    queryFn: () => getPendingHotelReservations(token),
    enabled: Boolean(token),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateHotelReservationStatus(id, { status }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingHotelReservations() });
      pushToast({ type: "success", message: "Reservation updated." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to update reservation." });
    },
  });

  if (pending.length === 0) {
    return <p className="portal__empty">No pending hotel reservations.</p>;
  }

  return (
    <div>
      {pending.map((reservation) => (
        <div key={reservation._id} className="portal__card portal__card--row">
          <span>
            {reservation.hotelName} — {centsToDollars(reservation.costCents)}
          </span>
          <div className="portal__row" style={{ gap: 8 }}>
            <button
              type="button"
              className="portal__link-button"
              disabled={updateStatusMutation.isPending}
              onClick={() => updateStatusMutation.mutate({ id: reservation._id, status: "confirmed" })}
            >
              Confirm
            </button>
            <button
              type="button"
              className="portal__link-button"
              disabled={updateStatusMutation.isPending}
              onClick={() => updateStatusMutation.mutate({ id: reservation._id, status: "cancelled" })}
            >
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");

  const { data: tournaments = [] } = useQuery({
    queryKey: queryKeys.tournaments(),
    queryFn: () => getTournaments(token),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createTournament(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments() });
      setName("");
      setStartDate("");
      setEndDate("");
      setLocation("");
      pushToast({ type: "success", message: "Tournament added." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add tournament." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      pushToast({ type: "error", message: "Name, start date, and end date are required." });
      return;
    }
    createMutation.mutate({ name, startDate, endDate, location });
  };

  return (
    <div>
      <h2 className="portal__section-title">Pending Hotel Reservations</h2>
      <PendingHotelReservations token={token} />

      <h2 className="portal__section-title" style={{ marginTop: 24 }}>
        Tournaments
      </h2>
      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="tournament-name">
          Name
        </label>
        <input
          id="tournament-name"
          className="portal__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="portal__row" style={{ gap: 8 }}>
          <input
            className="portal__input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            className="portal__input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <label className="portal__label" htmlFor="tournament-location">
          Location
        </label>
        <input
          id="tournament-location"
          className="portal__input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <button type="submit" className="portal__button" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving..." : "Add Tournament"}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        {tournaments.length === 0 && <p className="portal__empty">No tournaments yet.</p>}
        {tournaments.map((tournament) => (
          <TournamentRow key={tournament._id} tournament={tournament} token={token} />
        ))}
      </div>
    </div>
  );
}

export default TournamentsPanel;
