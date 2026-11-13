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

const JOBCANDII_BASE_URL =
  import.meta.env?.VITE_JOBCANDII_API_URL ||
  import.meta.env?.VITE_API_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://job-candii.onrender.com");

const API_BASE_URL = `${JOBCANDII_BASE_URL}/api/job`;
const COMPANY_API_URL = `${JOBCANDII_BASE_URL}/api/company`;

/**
 * Tracks external job views from GoodWord into JobCandii.
 * Increments goodwordViews in JobCandii MongoDB without altering normal view counts.
 */
function recordGoodWordView(jobId) {
  if (!jobId) return;

  console.log(`[GoodWord] Recording external view for Job ID: ${jobId}`);
  const payload = JSON.stringify({ source: "goodword" });
  const headers = { "Content-Type": "application/json" };

  // Primary endpoint request with keepalive
  fetch(`${API_BASE_URL}/${jobId}/external-view`, {
    method: "POST",
    headers,
    body: payload,
    keepalive: true,
  })
    .then((res) => {
      console.log(`[GoodWord] External view tracked (Status: ${res.status}) for ${jobId}`);
      if (!res.ok && !API_BASE_URL.includes("localhost:5000")) {
        fetch(`http://localhost:5000/api/job/${jobId}/external-view`, {
          method: "POST",
          headers,
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    })
    .catch((err) => {
      console.warn(`[GoodWord] Primary tracking fetch failed, trying local fallback:`, err);
      if (!API_BASE_URL.includes("localhost:5000")) {
        fetch(`http://localhost:5000/api/job/${jobId}/external-view`, {
          method: "POST",
          headers,
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    });
}

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

  // Live JobCandii data state for cards and company profile
  const [jobsMap, setJobsMap] = useState({});
  const [companyMap, setCompanyMap] = useState({});
  const [isJobsLoading, setIsJobsLoading] = useState(true);

  // Ensure the page always starts from the very top on load or reload
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const rafId = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Fetch live jobs data and live company profiles from JobCandii on mount
  
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [jobsRes, companyRes] = await Promise.allSettled([
          fetch(API_BASE_URL),
          fetch(COMPANY_API_URL)
        ]);

        if (companyRes.status === "fulfilled" && companyRes.value.ok) {
          const compData = await companyRes.value.json();
          if (Array.isArray(compData) && isMounted) {
            const cMap = {};
            compData.forEach((c) => {
              if (c._id) cMap[c._id] = c.name;
              if (c.id) cMap[c.id] = c.name;
            });
            setCompanyMap(cMap);
          }
        }

        if (jobsRes.status === "fulfilled" && jobsRes.value.ok) {
          const data = await jobsRes.value.json();
          if (Array.isArray(data) && isMounted) {
            const map = {};
            data.forEach((job) => {
              if (job._id) map[job._id] = job;
              if (job.id) map[job.id] = job;
            });
            setJobsMap(map);
          }
        }
      } catch (err) {
        console.warn("Could not load live data from JobCandii on mount : ", err);
      } finally {
        if (isMounted) setIsJobsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = (opportunity) => {
    setActiveModalJob(opportunity);
    setError(null);

    // Track external view in JobCandii
    if (opportunity?.jobCandiiId) {
      recordGoodWordView(opportunity.jobCandiiId);
    }

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

  // Light, subtle 3D Tilt Hover Animation
  const handleCardMouseMove = (e) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Gentle micro-tilt angles: max ~1.8deg for a light, refined feel
    const rotateX = ((y - centerY) / centerY) * -1.8;
    const rotateY = ((x - centerX) / centerX) * 1.8;

    card.style.transform = `perspective(2000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
    card.style.setProperty("--glare-x", `${((x / rect.width) * 100).toFixed(1)}%`);
    card.style.setProperty("--glare-y", `${((y / rect.height) * 100).toFixed(1)}%`);
    card.style.setProperty("--glare-opacity", "1");
    card.style.transition = "transform 0.12s ease-out, box-shadow 0.25s ease, border-color 0.25s ease";
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = "perspective(2000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    card.style.setProperty("--glare-opacity", "0");
    card.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease, border-color 0.3s ease";
  };

  return (
    <div className="announcement-page">
      {/* 1. Top Navigation Bar */}
      <nav className="portal-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <img
              src={goodwordLogo}
              alt="Goodwork Entrepreneurship Center Logo"
              className="navbar-logo"
            />
          </div>
          <div className="navbar-meta">
            <span className="navbar-badge">
              <span className="live-dot" />
              Active Opportunities
            </span>
            <a
              href={JOB_CANDII_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-cta-btn"
            >
              Browse on JobCandii ↗
            </a>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="portal-hero">
        <div className="portal-hero-bg" aria-hidden="true" />
        <div className="hero-container">
          <span className="hero-kicker">
            Find Internships, Practical Experience &amp; Career Opportunities
          </span>
          <h1 className="hero-title">
            Drop Resume &amp; Launch Your Career
          </h1>
          <p className="hero-subtitle">
            Explore curated internship pathways at Goodwork Entrepreneurship Center designed to build practical skills, deliver real-world projects, and accelerate professional growth.
          </p>
        </div>
      </header>

      {/* 3. Floating Introduction Showcase (Replacing Search Bar) */}
      <section className="intro-showcase-section">
        <div className="intro-card">
          <div className="intro-card-header">
            <div className="intro-pill">
              <span className="intro-pill-sparkle">✦</span>
              <span>Goodwork Entrepreneurship Center</span>
            </div>
            <span className="intro-tag">Practical Learning &amp; Internships</span>
          </div>

          <h2 className="intro-card-title">
            Hands-On Practical Experience &amp; Professional Skill Development
          </h2>

          <p className="intro-card-text">
            The Goodwork Entrepreneurship Center provides immersive internship and learning opportunities for students and emerging talent to gain practical experience, develop professional skills, and work on real-world projects alongside experienced industry mentors.
          </p>

          <div className="intro-highlights-row">
            <div className="intro-highlight-item">
              <span className="highlight-icon" aria-hidden="true">
                <svg
                  className="feature-svg-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="14" x="2" y="7" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  <path d="M12 12v2" />
                </svg>
              </span>
              <div className="highlight-text">
                <strong>Real-World Projects</strong>
                <span>Hands-on problem solving</span>
              </div>
            </div>
            <div className="intro-highlight-item">
              <span className="highlight-icon" aria-hidden="true">
                <svg
                  className="feature-svg-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <div className="highlight-text">
                <strong>Dedicated Mentorship</strong>
                <span>Direct professional guidance</span>
              </div>
            </div>
            <div className="intro-highlight-item">
              <span className="highlight-icon" aria-hidden="true">
                <svg
                  className="feature-svg-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </span>
              <div className="highlight-text">
                <strong>Career Acceleration</strong>
                <span>Industry-ready practical skills</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Opportunities Section: "Jobs You May Be Interested In" */}
      <main className="announcement-main" id="opportunities-section">
        <div className="section-header-centered">
          <span className="section-kicker">ACTIVE OPENINGS</span>
          <h2 className="section-heading">Jobs You May Be Interested In</h2>
          <p className="section-subheading">
            Review detailed requirements, live applicant counts, and apply directly through JobCandii.
          </p>
        </div>

        <div className="board-bar">
          <span className="board-badge">Official Opportunities</span>
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
                id={`opp-card-${opp.id}`}
                href={JOB_CANDII_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="opportunity-card"
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                aria-label={`Apply for ${opp.title} on JobCandii`}
              >
                <div className="card-header">
                  <span className="card-domain">{opp.domain}</span>
                  <span className="card-type-chip">{opp.type}</span>
                </div>

                <h3 className="card-title">{opp.title}</h3>

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

      {/* 5. Footer */}
      <footer className="announcement-footer">
        <div className="footer-content">
          <p className="footer-title">
            Goodwork Entrepreneurship Center
          </p>
          <p className="footer-tagline">
            Empowering students and aspiring professionals with practical industry experience.
          </p>
          <span className="footer-subtext">
            Applications are submitted and processed through JobCandii.
          </span>
          <p className="footer-copyright">
            © {new Date().getFullYear()} Goodwork Entrepreneurship Center. All rights reserved.
          </p>
        </div>
      </footer>

      {/* 6. Job Details Modal */}
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <h2 id="modal-job-title" className="modal-title">
                {jobDetails?.title || activeModalJob.title}
              </h2>

              <div className="modal-meta-row">
                <span className="modal-meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="16" height="20" x="4" y="2" rx="2"/>
                    <path d="M9 22v-4h6v4"/>
                    <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>
                  </svg>
                  {(jobDetails?.companyId && companyMap[jobDetails.companyId]) ||
                    jobDetails?.company ||
                    "GoodWord Entrepreneurship Center"}
                </span>
                <span className="modal-meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {jobDetails?.location || "Chennai"}
                </span>
                <span className="modal-meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="14" x="2" y="7" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                  {jobDetails?.type || activeModalJob.type}
                </span>
                {jobDetails?.workMode && (
                  <span className="modal-meta-item">
                    <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                      <path d="M2 12h20"/>
                    </svg>
                    {jobDetails.workMode}
                  </span>
                )}
                {jobDetails?.experience && (
                  <span className="modal-meta-item">
                    <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                    {jobDetails.experience} Level
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
                              <span className="check-bullet" aria-hidden="true">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
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
                        <h3 className="section-title">Requirements &amp; Qualifications</h3>
                        <ul className="modal-checklist">
                          {jobDetails.requirements.map((req, i) => (
                            <li key={i}>
                              <span className="check-bullet" aria-hidden="true">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
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
                        <h3 className="section-title">Perks &amp; Benefits</h3>
                        <ul className="modal-checklist">
                          {jobDetails.benefits.map((b, i) => (
                            <li key={i}>
                              <span className="check-bullet star-bullet" aria-hidden="true">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              </span>
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
