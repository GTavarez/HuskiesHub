// Mirrors PACKAGE_LABELS in the backend's lesson-requests controller — keep
// in sync. Fixed set, deliberately no standalone "single lesson" option.
const LESSON_PACKAGE_OPTIONS = [
  { value: "fall_lesson_package", label: "Fall Lesson Package — $700 (10 lessons)" },
  { value: "academy_plus_1", label: "Academy + 1 Lesson — $189/mo" },
  { value: "academy_plus_2", label: "Academy + 2 Lessons — $259/mo" },
];

export { LESSON_PACKAGE_OPTIONS };
