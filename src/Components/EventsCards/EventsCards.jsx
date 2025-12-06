import "./EventsCards.css";
import example1 from "../../assets/example1.jpg";
import event1 from "../../assets/event1.jpg";
import event2 from "../../assets/event2.jpg";
import event3 from "../../assets/event3.jpg";

function EventsCards() {
  return (
    <section className="events__cards">
      <div className="events__cards_container">
        <h2 className="events__cards_title">Season Events</h2>
        <div className="events__cards_grid">
          <div className="events__card">
            <img className="events__card__image" src={event2} />
            <div className="events__card-overlay">
              <h3>Beacon Xtreme Fall Benefit</h3>
              <p>Sept 20th • Beacon, NY</p>
            </div>
          </div>
          <div className="events__card">
            <img className="events__card__image" src={event1} />
            <div className="events__card-overlay">
              <h3>Xtreme Fall Classic</h3>
              <p>Sept 27th • Ewing, NJ</p>
            </div>
          </div>
          <div className="events__card">
            <img className="events__card__image" src={event3} />
            <div className="events__card-overlay">
              <h3>Huskies Friendly</h3>
              <p>Oct 5th • Pequannock, NJ</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default EventsCards;
