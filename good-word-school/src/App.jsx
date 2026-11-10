import "./App.css";
import goodwordLogo from "./assets/goodword-logo.png";

// ============================================================================
// OPPORTUNITIES DATA - Goodwork Entrepreneurship Center
// Exactly FIVE (5) official internship opportunities.
// ============================================================================
const OPPORTUNITIES = [
  {
    id: 1,
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

export default function App() {
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
          {OPPORTUNITIES.map((opp) => (
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

              {/* Display stipend and duration only if provided */}
              {(opp.stipend || opp.duration) && (
                <div className="card-details">
                  {opp.duration && (
                    <div className="detail-item">
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
              )}

              <div className="card-footer">
                <span className="card-location">📍 Entrepreneurship Center</span>
                <span className="apply-btn">
                  Apply Now <span className="arrow">↗</span>
                </span>
              </div>
            </a>
          ))}
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
    </div>
  );
}
