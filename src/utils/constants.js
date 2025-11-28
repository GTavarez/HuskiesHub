import team18UGold from "../assets/team2.jpg";
import team18UPremier from "../assets/team18UPremier.jpg";

const baseUrl = import.meta.env.PROD
  ? "https://huskieshub-backend-891073803869.us-central1.run.app"
  : "http://localhost:8080";

export const playersData = [
  {
    _id: 1,
    name: "Empire State Huskies Yoffee",
    ageGroup: "18U Premier",
    banner: team18UPremier,
    players: [
      {
        _id: 101,
        name: "Antonella Sottile",
        jersey: 1,
        position: "P, CF",
        gradYear: 2026,
        highSchool: "Immaculate Heart Academy",
        GPA: 3.8,
        image: "as.jpg",
      },
      {
        _id: 102,
        name: "Ana Feliciano",
        jersey: 5,
        position: "",
        gradYear: 2027,
        highSchool: "Pompton Lakes High School",
        GPA: 3.79,
        image: "",
      },
      {
        _id: 103,
        name: "Sofia Rocha",
        jersey: 14,
        position: "OF",
        gradYear: 2026,
        highSchool: "Nutley High School",
        GPA: 3.4,
        image: "sr.jpg",
      },
      {
        _id: 104,
        name: "Gabriella Brieva",
        jersey: 24,
        position: "C, 3B",
        gradYear: 2028,
        highSchool: "Wanaque High School",
        GPA: "",
        image: "gb.jpg",
      },
      {
        _id: 105,
        name: "Ashley Witkowski",
        jersey: 2,
        position: "IF, OF",
        gradYear: 2027,
        highSchool: "Pascack Valley High School",
        GPA: 4.0,
        image: "aw.jpg",
      },
      {
        _id: 106,
        name: "Emilia Kelley",
        jersey: 10,
        position: "C, OF",
        gradYear: 2026,
        highSchool: "Ridgewood High School",
        GPA: 3.5,
        image: "ek.jpg",
      },
      {
        _id: 107,
        name: "Izzy Marut",
        jersey: 16,
        position: "OF",
        gradYear: 2028,
        highSchool: "Butler High School",
        GPA: 3.8,
        image: "im.jpg",
      },
      {
        _id: 108,
        name: "Jordyn Struyk",
        jersey: 99,
        position: "OF, IF",
        gradYear: 2029,
        highSchool: "High School",
        GPA: "",
        image: "js.jpg",
      },
      {
        _id: 109,
        name: "Lexi Feliciano",
        jersey: 4,
        position: "",
        gradYear: 2027,
        highSchool: "Pompton Lakes High School",
        GPA: 3.5,
        image: "lf.jpg",
      },
      {
        _id: 110,
        name: "Kylee Bianchini",
        jersey: 13,
        position: "1B, 3B",
        gradYear: 2026,
        highSchool: "Wayne Valley High School",
        GPA: 3.3,
        image: "kb.jpg",
      },
      {
        _id: 111,
        name: "Natalie Davis",
        jersey: 17,
        position: "OF",
        gradYear: 2026,
        highSchool: "Fair Lawn High School",
        GPA: 3.8,
        image: "nd.jpg",
      },
      {
        _id: 112,
        name: "Arianna Morran",
        jersey: 12,
        position: "P",
        gradYear: 2027,
        highSchool: "West Milford High School",
        GPA: 3.5,
        image: "am.jpg",
      },
    ],
  },

  {
    _id: 2,
    name: "Empire State Huskies Yoffee",
    ageGroup: "18U Gold",
    banner: team18UGold,
    players: [
      {
        _id: 201,
        name: "Lucy Sobel",
        jersey: "00",
        position: "P, Utility",
        gradYear: 2026,
        highSchool: "Ramsey High School",
        GPA: 4.1,
        isCommitted: true,
        committedCollege: "Middlebury College",
        image: "ls.jpg",
      },
      {
        _id: 202,
        name: "Trinity Horn",
        jersey: 9,
        position: "RHP, OF",
        gradYear: 2027,
        highSchool: "Ramapo High School",
        GPA: 3.8,
        isCommitted: false,
        committedCollege: "",
        image: "th.jpg",
      },
      {
        _id: 203,
        name: "Natalie Davis",
        jersey: 17,
        position: "OF, 1B",
        gradYear: 2026,
        highSchool: "Fair Lawn High School",
        GPA: 3.8,
        isCommitted: false,
        committedCollege: "",
        image: "nd.jpg",
      },
      {
        _id: 204,
        name: "Madelyn Saraceno",
        jersey: 22,
        position: "CF, Utility",
        gradYear: 2028,
        highSchool: "Ridgwood High School",
        GPA: 3.5,
        isCommitted: false,
        committedCollege: "",
        image: "",
      },
      {
        _id: 205,
        name: "Sophia Biroc",
        jersey: 3,
        position: "RHP, OF",
        gradYear: 2026,
        highSchool: "Wayne Valley High School",
        GPA: 3.75,
        isCommitted: true,
        committedCollege: "Roanoke College",
        image: "sb.jpg",
      },
      {
        _id: 206,
        name: "Ava Conolly",
        jersey: 10,
        position: "C, 3B, 1B",
        gradYear: 2026,
        highSchool: "Wayne Hills High School",
        GPA: 3.7,
        isCommitted: true,
        committedCollege: "Washington College",
        image: "ac.jpg",
      },
      {
        _id: 207,
        name: "Charlotte Feng",
        jersey: 19,
        position: "C, 2B, 3B",
        gradYear: 2026,
        highSchool: "Morris Tech High School",
        GPA: 4.68,
        isCommitted: true,
        committedCollege: "MIT",
        image: "cf.jpg",
      },
      {
        _id: 208,
        name: "Ella Mchugh",
        jersey: 28,
        position: "SS, 2B, Utility",
        gradYear: 2027,
        highSchool: "Pearl River High School",
        GPA: 3.8,
        isCommitted: false,
        committedCollege: "",
        image: "em.jpg",
      },
      {
        _id: 209,
        name: "Cali Dembowski",
        jersey: 7,
        position: "C, OF",
        gradYear: 2026,
        highSchool: "Pascack Valley High School",
        GPA: 4.2,
        isCommitted: false,
        committedCollege: "",
        image: "cd.jpg",
      },
      {
        _id: 210,
        name: "Angie Franzese",
        jersey: 13,
        position: "MIF",
        gradYear: 2026,
        highSchool: "Pearl River High School",
        GPA: 3.2,
        isCommitted: true,
        committedCollege: "Albertus Magnus",
        image: "af.jpg",
      },
      {
        _id: 211,
        name: "Therese Adams",
        jersey: 21,
        position: "3B,MIF, OF",
        gradYear: 2026,
        highSchool: "Ramapo High School",
        GPA: 4.0,
        isCommitted: false,
        committedCollege: "",
        image: "",
      },
      {
        _id: 212,
        name: "Lily Kriz",
        jersey: 44,
        position: "C, 3B Utility",
        gradYear: 2026,
        highSchool: "Ramsey High School",
        GPA: 4.96,
        isCommitted: false,
        committedCollege: "",
        image: "lk.jpg",
      },
    ],
  },
];
// ==========================
// LOAD PLAYER IMAGES GLOBALLY
// ==========================
const imageModules = import.meta.glob(
  "../assets/players/*.{jpg,jpeg,png,avif}",
  {
    eager: true,
    import: "default",
  }
);

// Attach full image URLs to your playersData
playersData.forEach((team) => {
  team.players.forEach((player) => {
    if (!player.image) {
      player.image = "/default.avif"; // fallback
      return;
    }

    const lower = player.image.toLowerCase();

    const match = Object.entries(imageModules).find(([path]) =>
      path.toLowerCase().includes(lower)
    );

    player.image = match ? match[1] : "/default.avif";
  });
});
export { baseUrl };
export const coachesData = [
  {
    _id: 1,
    name: "Allie Yoffee",
    role: "Head Coach",
    bio: " Allie Yoffee is the founder and head coach of the Empire State Huskies. With over a decade of coaching experience, she has led numerous teams to state and national championships. Her dedication to player development and passion for the game make her an invaluable asset to the Huskies organization.",
    email: "alliey@gmail.com",
    phone: "201-410-0431",
    image: "",
  },
  {
    _id: 2,
    name: "Jessica Shulman",
    role: "Assistant Coach",
    bio: " Jessica Shulman brings a wealth of experience to the Huskies as an assistant coach. A former collegiate athlete, Jessica specializes in hitting mechanics and offensive strategy. Her hands-on approach and ability to connect with players help foster a positive and competitive team environment.",
    email: " ",
    phone: " ",
    image: "",
  },
  {
    _id: 3,
    name: "Megan Wargo",
    role: "Pitching Coach",
    bio: " Megan Wargo is the Huskies' dedicated pitching coach, known for her technical expertise and personalized coaching style. With a background in collegiate softball, Megan focuses on developing pitchers' mechanics, mental toughness, and game strategy. Her commitment to each player's growth is evident in the Huskies' strong pitching performances.",
    email: " ",
    phone: " ",
    image: "",
  },
];
export const clinicsData = [
  {
    id: 1,
    title: "Winter Pitching & Hitting Clinic",
    date: "January 12, 2026",
    time: "6:00 PM – 8:30 PM",
    location: "Wayne Valley High School – Wayne, NJ",
    level: "14U–18U",
    description:
      "High-rep small-group work with the Huskies staff focused on mechanics, strength, and game situations.",
    price: "$85",
    registerLink:
      "mailto:info@huskieshub.com?subject=Winter Clinic Registration",
  },
  {
    id: 2,
    title: "Defensive Skills & Speed Camp",
    date: "February 9, 2026",
    time: "5:30 PM – 8:00 PM",
    location: "Indoor Facility – TBA",
    level: "12U–18U",
    description:
      "Infield and outfield defense, footwork, and speed/agility training designed to translate directly to games.",
    price: "$75",
    registerLink: "mailto:info@huskieshub.com?subject=Defense & Speed Camp",
  },
];
