🥎 HuskiesHub Frontend
Empire State Huskies Softball — Modern React UI for Players, Coaches & Recruiters

📌 Overview

The HuskiesHub Frontend is the user-facing platform for the
Empire State Huskies Softball Organization — designed for:

🥎 Player profiles

📸 Player galleries

📅 Upcoming games & schedules

🧭 Field locations (Maps Integration)

🎓 College commit showcases

🔐 Secure sign-in / sign-up

🌐 Coach-only admin tools

Built with React + Vite, optimized for speed, responsive on all devices, and powered by your backend API & Google integrations.

⚙️ Tech Stack
Layer Technology
Framework React + Vite
Routing React Router
State Context API
API Custom REST Client (fetch / axios)
Auth JWT-based frontend session
Deployment Google Cloud Run (static hosting)
Styling CSS modules / custom design system
Maps Google Maps API
Charts Chart.js (if used)
🎨 Design Features

Modern softball-themed UI

Custom HuskiesHub color palette

Responsive cards, grids, and modals

Jersey-style number badges

Animated banners

Softball-inspired typography

🔐 Environment Variables (Frontend)

Create `.env` at project root:

VITE_API_URL=https://your-cloudrun-backend-url
VITE_SOCKET_URL=https://your-cloudrun-backend-url
VITE_MEDIA_BASE_URL=https://your-cloudrun-backend-url
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

⚠ The frontend never stores private secrets (no service account keys).

💻 Local Development
git clone https://github.com/yourusername/HuskiesHub-frontend.git
cd HuskiesHub-frontend
npm install
npm run dev

Your app runs at:

http://localhost:5173/

To build:

npm run build

📁 Project Structure
src/
│── assets/
│── components/
│ ├── PlayerCard/
│ ├── Navbar/
│ ├── Schedule/
│ ├── Gallery/
│── pages/
│ ├── Home.jsx
│ ├── Players.jsx
│ ├── Schedule.jsx
│ ├── Commits.jsx
│ ├── Admin.jsx
│── context/
│ └── CurrentUserContext.js
│── utils/
│ └── api.js
└── main.jsx

📡 API Integration

The frontend connects to your backend here:

VITE_API_URL=https://huskieshub-backend-xxx.run.app

Example Calls

Login

await api.signin({ email, password });

Fetch schedule

await api.getSchedule();

Fetch player image

`${VITE_API_URL}/images/ac.jpg`

🎥 Media & Images

All player images load directly from GridFS:

GET /images/<slug>.jpg

Your frontend uses these for:

Player cards

Profile pages

Galleries

Rosters

🗂️ Admin Tools (Frontend)

Only accessible when signed in as an admin:

Upload player images

Manage rosters

Replace / update images in GridFS

Trigger schedule refresh

Uses:

POST /admin?slug=<slug>
Authorization: Bearer <jwt> (admin-role user; sent automatically once signed in)

📅 Google Calendar Integration (Frontend)

The schedule page displays:

Opponents

Field locations

Game times

Softball icons

Color-coded events

Powered by backend Google Calendar sync.

🗺️ Locations (Fields)

Uses Google Maps API:

VITE_GOOGLE_MAPS_KEY=xxxx

Includes:

Map component

Marker points for fields

Modals with directions

“Open in Google Maps” buttons

🚀 Deployment (Frontend)
Build Production Bundle
npm run build

Vite outputs to /dist.

Container Build

The frontend includes a production `Dockerfile` and `nginx.conf` for SPA hosting on Cloud Run.
Set these build variables before deploy:

- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `VITE_MEDIA_BASE_URL`
- `VITE_OPENWEATHER_API_KEY` (optional)
- `VITE_GOOGLE_MAPS_API_KEY` (optional)

Deploy to Cloud Run (Static Hosting)

Your Dockerfile typically looks like:

FROM nginx:alpine
COPY dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

Deploy:

gcloud run deploy huskieshub-frontend \
 --source . \
 --region=us-central1 \
 --platform=managed \
 --allow-unauthenticated \
 --set-build-env-vars "VITE_API_URL=$VITE_API_URL,VITE_SOCKET_URL=$VITE_SOCKET_URL,VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL"

🏷️ GitHub Release Notes Template
v1.0.0 — Production Frontend Release

Full mobile-responsive UI

Player roster + profiles

Schedule + Google Calendar integration

Player gallery

JWT login / signup

Google Maps fields

Admin upload interface

Cloud Run deployment

🖼️ Screenshots
🏠 Homepage

🧑‍🤝‍🧑 Player Profiles

📅 Schedule

🤝 Contributing

Pull requests are welcome!
For major changes, open an issue first.

📄 License

MIT License.
