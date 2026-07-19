import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadAdminImage } from "../../../api/admin.js";
import { useToast } from "../../../context/ToastContext.js";
import { resolveImageUrl } from "../../../utils/media.js";
import BiDashboard from "../../analytics/BiDashboard/BiDashboard.jsx";
import AnnouncementsPanel from "../AnnouncementsPanel/AnnouncementsPanel.jsx";
import DocumentsPanel from "../DocumentsPanel/DocumentsPanel.jsx";
import ProductsPanel from "../ProductsPanel/ProductsPanel.jsx";
import RegistrationsPanel from "../RegistrationsPanel/RegistrationsPanel.jsx";
import WaiverPanel from "../WaiverPanel/WaiverPanel.jsx";
import CollegeCoachApprovalsPanel from "../CollegeCoachApprovalsPanel/CollegeCoachApprovalsPanel.jsx";
import RoleRequestsPanel from "../RoleRequestsPanel/RoleRequestsPanel.jsx";
import TournamentsPanel from "../TournamentsPanel/TournamentsPanel.jsx";
import CoachPaymentsPanel from "../CoachPaymentsPanel/CoachPaymentsPanel.jsx";
import LessonSlotsPanel from "../LessonSlotsPanel/LessonSlotsPanel.jsx";
import AiAssistant from "../../analytics/AiAssistant/AiAssistant.jsx";
import "../../shared/portal.css";
import "./AdminDashboard.css";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "assistant", label: "Assistant" },
  { key: "media", label: "Media" },
  { key: "announcements", label: "Announcements" },
  { key: "documents", label: "Documents" },
  { key: "products", label: "Products" },
  { key: "registrations", label: "Registrations & Payments" },
  { key: "waiver", label: "Waiver" },
  { key: "role-requests", label: "Role Requests" },
  { key: "college-coach", label: "College Coach Approvals" },
  { key: "tournaments", label: "Tournaments" },
  { key: "coach-payments", label: "Coach Payments" },
  { key: "lesson-slots", label: "Lesson Slots" },
];

function MediaUploadForm({ token }) {
  const { pushToast } = useToast();
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState(null);
  const [lastUploadedSlug, setLastUploadedSlug] = useState("");

  const previewUrl = useMemo(() => {
    const value = (lastUploadedSlug || slug).trim();
    if (!value) return "";
    return resolveImageUrl(encodeURIComponent(value));
  }, [lastUploadedSlug, slug]);

  const uploadMutation = useMutation({
    mutationFn: ({ slugValue, imageFile }) =>
      uploadAdminImage({
        token,
        slug: slugValue,
        file: imageFile,
      }),
    onSuccess: (_, variables) => {
      setLastUploadedSlug(variables.slugValue);
      pushToast({
        type: "success",
        message: `Uploaded image for slug "${variables.slugValue}".`,
      });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Admin upload failed.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedSlug = slug.trim().toLowerCase();

    if (!normalizedSlug || !file) {
      pushToast({
        type: "error",
        message: "Slug and image file are required.",
      });
      return;
    }

    uploadMutation.mutate({
      slugValue: normalizedSlug,
      imageFile: file,
    });
  };

  return (
    <>
      <form className="admin__form" onSubmit={handleSubmit}>
        <label className="admin__label" htmlFor="admin-slug">
          Image Slug
        </label>
        <input
          id="admin-slug"
          className="admin__input"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Example: as"
          required
        />

        <label className="admin__label" htmlFor="admin-file">
          Image File
        </label>
        <input
          id="admin-file"
          className="admin__file"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />

        <button
          className="admin__button"
          type="submit"
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload Image"}
        </button>
      </form>

      {previewUrl && (
        <div className="admin__preview">
          <p className="admin__preview-label">Preview URL</p>
          <a href={previewUrl} target="_blank" rel="noreferrer">
            {previewUrl}
          </a>
        </div>
      )}
    </>
  );
}

function AdminDashboard({ token }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <section className="portal">
      <div className="portal__panel">
        <h1 className="portal__title">Admin Dashboard</h1>
        <p className="portal__subtitle">
          Manage club operations, payments, and approvals.
        </p>

        <div className="portal__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`portal__tab${
                activeTab === tab.key ? " portal__tab--active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && <BiDashboard token={token} />}
        {activeTab === "assistant" && <AiAssistant context="admin" token={token} />}
        {activeTab === "media" && <MediaUploadForm token={token} />}
        {activeTab === "announcements" && <AnnouncementsPanel token={token} />}
        {activeTab === "documents" && <DocumentsPanel token={token} />}
        {activeTab === "products" && <ProductsPanel token={token} />}
        {activeTab === "registrations" && <RegistrationsPanel token={token} />}
        {activeTab === "waiver" && <WaiverPanel token={token} />}
        {activeTab === "role-requests" && <RoleRequestsPanel token={token} />}
        {activeTab === "college-coach" && (
          <CollegeCoachApprovalsPanel token={token} />
        )}
        {activeTab === "tournaments" && <TournamentsPanel token={token} />}
        {activeTab === "coach-payments" && <CoachPaymentsPanel token={token} />}
        {activeTab === "lesson-slots" && <LessonSlotsPanel token={token} />}
      </div>
    </section>
  );
}

export default AdminDashboard;
