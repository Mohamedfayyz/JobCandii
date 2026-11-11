import { useState, useEffect } from "react";
import "./App.css";
import goodwordLogo from "./assets/goodword-logo.png";

// ============================================================================
// OPPORTUNITIES DATA - Goodwork Entrepreneurship Center
// Exactly FIVE (5) official internship opportunities.
// Mapped by unique JobCandii MongoDB ID.
// ============================================================================
const OPPORTUNITIES = [
  {
    id: 1,
    jobCandiiId: "6af40f571fb474b2f67c8d65",
    title: "IT – Web Development Intern",
    domain: "Information Technology",
    type: "Internship",
    stipend: "Not Disclosed",
    duration: "3 Months",
    description:
      "Develop responsive web interfaces, optimize site performance, and assist in maintaining modern web platforms and internal digital tools."
  },
  {
    id: 2,
    jobCandiiId: "6aedc6f1994d5865fc31a2e0",
    title: "Full Stack Development Intern",
    domain: "Software Development",
    type: "Internship",
    stipend: "Not Disclosed",
    duration: "3 Months",
    description:
      "Build dynamic full-stack applications, implement frontend features, integrate RESTful APIs, and support backend database workflows."
  },
  {
    id: 3,
    jobCandiiId: "6aedc759994d5865fc31a2e1",
    title: "UI / UX Design Intern",
    domain: "Design & Creative",
    type: "Internship",
    stipend: "Not Disclosed",
    duration: "3 Months",
    description:
      "Design user-friendly interfaces, create wireframes and interactive prototypes, and contribute to cohesive visual design systems."
  },
  {
    id: 4,
    jobCandiiId: "6aedc835994d5865fc31a550",
    title: "Purchase Executive Intern",
    domain: "Procurement & Operations",
    type: "Internship",
    stipend: "Not Disclosed",
    duration: "3 Months",
    description:
      "Support procurement workflows, vendor communication, purchase order processing, and market quotation analysis for business operations."
  },
  {
    id: 5,
    jobCandiiId: "6aedc892994d5865fc31a551",
    title: "Mechanical Designer Intern",
    domain: "Engineering & Design",
    type: "Internship",
    stipend: "Not Disclosed",
    duration: "3 Months",
    description:
      "Create detailed 2D/3D CAD models, assist in mechanical prototyping, and prepare technical drawings for new product developments."
  }
];

const JOB_CANDII_URL =
  "https://job-candii.vercel.app/dashboard/seeker?module=browse";

const API_BASE_URL = "https://job-candii.onrender.com/api/job";

/**
 * Fetches job details from JobCandii API with resilient fallback.
 * Attempts GET /api/job/:id first, then falls back to GET /api/job list lookup.
 */
async function fetchJobDetails(jobId) {
  // 1. Attempt direct single-job endpoint
  try {
    const directRes = await fetch(`${API_BASE_URL}/${jobId}`);
    if (directRes.ok) {
      const contentType = directRes.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await directRes.json();
        if (data && (data._id || data.id)) {
          return data;
        }
      }
    }
  } catch (err) {
    console.warn("Direct endpoint fetch failed, falling back to list endpoint:", err);
  }

  // 2. Resilient fallback to GET /api/job
  const listRes = await fetch(API_BASE_URL);
  if (!listRes.ok) {
    throw new Error(`Unable to fetch job details from server (HTTP ${listRes.status})`);
  }
  const allJobs = await listRes.json();
  const matched = Array.isArray(allJobs)
    ? allJobs.find((j) => j._id === jobId || j.id === jobId)
    : null;

  if (!matched) {
    throw new Error("Job details could not be found in JobCandii.");
  }
  return matched;
}

export default function App() {
  const [activeModalJob, setActiveModalJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live JobCandii data state for cards (applicants count, location, full data)
  const [jobsMap, setJobsMap] = useState({});
  const [isJobsLoading, setIsJobsLoading] = useState(true);

  // Fetch live jobs data once on mount for efficient card rendering
  useEffect(() => {
    let isMounted = true;

    async function loadJobsData() {
      try {
        const res = await fetch(API_BASE_URL);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && isMounted) {
          const map = {};
          data.forEach((job) => {
            if (job._id) map[job._id] = job;
            if (job.id) map[job.id] = job;
          });
          setJobsMap(map);
        }
      } catch (err) {
        console.warn("Could not load live jobs from JobCandii on mount:", err);
      } finally {
        if (isMounted) setIsJobsLoading(false);
      }
    }

    loadJobsData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = (opportunity) => {
    setActiveModalJob(opportunity);
    setError(null);

    // If already available from live jobs fetch, use immediately
    const cached = jobsMap[opportunity.jobCandiiId];
    if (cached) {
      setJobDetails(cached);
      setIsLoading(false);
      return;
    }

    setJobDetails(null);
    setIsLoading(true);

    fetchJobDetails(opportunity.jobCandiiId)
      .then((data) => {
        setJobDetails(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load job details.");
        setIsLoading(false);
      });
  };

  const handleCloseModal = () => {
    setActiveModalJob(null);
    setJobDetails(null);
    setError(null);
    setIsLoading(false);
  };

  // Close modal with Escape key and disable background body scrolling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };

    if (activeModalJob) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeModalJob]);

  // Verified JobCandii direct job URL
  const jobCandiiApplyUrl = activeModalJob?.jobCandiiId
    ? `https://job-candii.vercel.app/jobs/${activeModalJob.jobCandiiId}`
    : JOB_CANDII_URL;

  return (
    <div className="announcement-page">
      {/* 1. Header */}
      <header className="announcement-header">
        <div className="logo-container">
          <img
            src={goodwordLogo}
            alt="Goodwork Entrepreneurship Center Logo"
            className="school-logo"
          />
        </div>
        <div className="header-meta">
          <span className="school-name">GOODWORK ENTREPRENEURSHIP CENTER</span>
          <h1>Entrepreneurship Center – Opportunities</h1>
          <p>Explore our latest internship and job openings.</p>
        </div>
      </header>

      {/* 2. Announcement Section: Exactly 5 Cards */}
      <main className="announcement-main">
        <div className="board-bar">
          <span className="board-badge">Active Openings</span>
          <span className="board-count">05 Positions Available</span>
        </div>

        <div className="opportunities-grid">
          {OPPORTUNITIES.map((opp) => {
            const liveJob = jobsMap[opp.jobCandiiId];
            const applicantsCount =
              liveJob?.applicantCount !== undefined
                ? liveJob.applicantCount
                : isJobsLoading
                ? "..."
                : 0;
            const locationText =
              liveJob?.location ||
              (isJobsLoading ? "Loading..." : "Location not specified");

            return (
              <a
                key={opp.id}
                href={JOB_CANDII_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="opportunity-card"
                aria-label={`Apply for ${opp.title} on JobCandii`}
              >
                <div className="card-header">
                  <span className="card-domain">{opp.domain}</span>
                  <span className="card-type-chip">{opp.type}</span>
                </div>

                <h2 className="card-title">{opp.title}</h2>

                <p className="card-desc">{opp.description}</p>

                {/* Card Details: 1. Applicants, 2. Duration, 3. Stipend */}
                <div className="card-details">
                  <div className="detail-item applicants-item">
                    <span className="detail-label">Applicants:</span>
                    <span className="detail-value applicants-count">
                      {applicantsCount}
                    </span>
                  </div>
                  {opp.duration && (
                    <div className="detail-item duration-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{opp.duration}</span>
                    </div>
                  )}
                  {opp.stipend && (
                    <div className="detail-item stipend-item">
                      <span className="detail-label">Stipend:</span>
                      <span className="detail-value stipend-pill">
                        {opp.stipend}
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <span className="card-location">📍 {locationText}</span>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="info-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenModal(opp);
                      }}
                      aria-label={`View details for ${opp.title}`}
                    >
                      <span className="info-icon">ℹ</span> View Details
                    </button>
                    <span className="apply-btn">
                      Apply Now <span className="arrow">↗</span>
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="announcement-footer">
        <p>
          Goodwork Entrepreneurship Center · Entrepreneurship Center
        </p>
        <span className="footer-subtext">
          Applications are submitted and processed through JobCandii.
        </span>
      </footer>

      {/* 3. Job Details Modal */}
      {activeModalJob && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-job-title"
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-top">
                <span className="modal-domain-badge">
                  {jobDetails?.department || activeModalJob.domain}
                </span>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCloseModal}
                  aria-label="Close job details modal"
                >
                  ✕
                </button>
              </div>

              <h2 id="modal-job-title" className="modal-title">
                {jobDetails?.title || activeModalJob.title}
              </h2>

              <div className="modal-meta-row">
                <span className="modal-meta-item">
                  🏢 {jobDetails?.company || "Goodwork Entrepreneurship Center"}
                </span>
                <span className="modal-meta-item">
                  📍 {jobDetails?.location || "Chennai"}
                </span>
                <span className="modal-meta-item">
                  💼 {jobDetails?.type || activeModalJob.type}
                </span>
                {jobDetails?.workMode && (
                  <span className="modal-meta-item">
                    🌐 {jobDetails.workMode}
                  </span>
                )}
                {jobDetails?.experience && (
                  <span className="modal-meta-item">
                    🎯 {jobDetails.experience} Level
                  </span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {isLoading && (
                <div className="modal-loading-state">
                  <div className="loading-spinner" />
                  <p>Loading full job details from JobCandii...</p>
                </div>
              )}

              {error && (
                <div className="modal-error-state">
                  <div className="error-icon">⚠️</div>
                  <p className="error-title">Unable to Load Job Details</p>
                  <p className="error-desc">{error}</p>
                  <button
                    type="button"
                    className="retry-btn"
                    onClick={() => handleOpenModal(activeModalJob)}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!isLoading && !error && jobDetails && (
                <div className="modal-content-details">
                  {/* Highlights Strip */}
                  <div className="modal-highlights-grid">
                    <div className="highlight-box">
                      <span className="highlight-label">Compensation</span>
                      <span className="highlight-val highlight-gold">
                        {jobDetails.salaryMin && jobDetails.salaryMax
                          ? `₹${jobDetails.salaryMin.toLocaleString("en-IN")} – ₹${jobDetails.salaryMax.toLocaleString("en-IN")} / Mo`
                          : "Stipend Disclosed on Selection"}
                      </span>
                    </div>

                    <div className="highlight-box">
                      <span className="highlight-label">Duration</span>
                      <span className="highlight-val">
                        {activeModalJob.duration || "3 Months"}
                      </span>
                    </div>

                    <div className="highlight-box">
                      <span className="highlight-label">Openings</span>
                      <span className="highlight-val">
                        {jobDetails.openings || 1} Position(s)
                      </span>
                    </div>

                    {jobDetails.applicationDeadline && (
                      <div className="highlight-box">
                        <span className="highlight-label">Deadline</span>
                        <span className="highlight-val highlight-deadline">
                          {new Date(jobDetails.applicationDeadline).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* About the Role */}
                  {jobDetails.description && (
                    <div className="modal-section">
                      <h3 className="section-title">About the Role</h3>
                      <p className="section-desc">{jobDetails.description}</p>
                    </div>
                  )}

                  {/* Responsibilities */}
                  {Array.isArray(jobDetails.responsibilities) &&
                    jobDetails.responsibilities.length > 0 && (
                      <div className="modal-section">
                        <h3 className="section-title">Key Responsibilities</h3>
                        <ul className="modal-checklist">
                          {jobDetails.responsibilities.map((resp, i) => (
                            <li key={i}>
                              <span className="check-bullet">✓</span>
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Requirements */}
                  {Array.isArray(jobDetails.requirements) &&
                    jobDetails.requirements.length > 0 && (
                      <div className="modal-section">
                        <h3 className="section-title">Requirements & Qualifications</h3>
                        <ul className="modal-checklist">
                          {jobDetails.requirements.map((req, i) => (
                            <li key={i}>
                              <span className="check-bullet">✓</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Required Skills */}
                  {Array.isArray(jobDetails.skillsRequired) &&
                    jobDetails.skillsRequired.length > 0 && (
                      <div className="modal-section">
                        <h3 className="section-title">Required Skills</h3>
                        <div className="skills-pill-wrap">
                          {jobDetails.skillsRequired.map((skill, i) => (
                            <span key={i} className="skill-pill">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Education */}
                  {jobDetails.education && (
                    <div className="modal-section">
                      <h3 className="section-title">Education</h3>
                      <p className="section-desc">{jobDetails.education}</p>
                    </div>
                  )}

                  {/* Benefits */}
                  {Array.isArray(jobDetails.benefits) &&
                    jobDetails.benefits.length > 0 && (
                      <div className="modal-section">
                        <h3 className="section-title">Perks & Benefits</h3>
                        <ul className="modal-checklist">
                          {jobDetails.benefits.map((b, i) => (
                            <li key={i}>
                              <span className="check-bullet">★</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={handleCloseModal}
              >
                Close
              </button>
              <a
                href={jobCandiiApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-apply-btn"
              >
                Apply on JobCandii <span className="arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
