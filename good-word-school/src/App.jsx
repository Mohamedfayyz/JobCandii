import "./App.css";
import schoolLogo from "./assets/good-word-logo.png";

// ============================================================================
// EDITABLE OPPORTUNITIES DATA - Good Word Incubation Centre
//
// Exactly FOUR (4) available job/internship opportunities.
// Update the fields below when verified announcement details are provided.
// If stipend or duration is not provided, set to null or empty string ("").
// ============================================================================
const OPPORTUNITIES = [
  {
    id: 1,
    title: "[Opportunity Title Placeholder 1 - e.g., Web Development Intern]",
    domain: "Technology & Development",
    type: "Internship", // Internship | Part-time | Full-time
    stipend: "Stipend Provided (Placeholder)",
    duration: "3 - 6 Months",
    description:
      "Contribute to hands-on technology and development projects supported by the Good Word Incubation Centre."
  },
  {
    id: 2,
    title: "[Opportunity Title Placeholder 2 - e.g., UI/UX Design Intern]",
    domain: "Design & Creative",
    type: "Internship",
    stipend: "Stipend Provided (Placeholder)",
    duration: "3 Months",
    description:
      "Create interface prototypes, branding materials, and digital graphics for incubation initiatives."
  },
  {
    id: 3,
    title: "[Opportunity Title Placeholder 3 - e.g., Digital Marketing Intern]",
    domain: "Digital Marketing",
    type: "Internship",
    stipend: "Stipend Provided (Placeholder)",
    duration: "3 - 6 Months",
    description:
      "Assist with online outreach, campaign planning, and social growth for incubated startup projects."
  },
  {
    id: 4,
    title: "[Opportunity Title Placeholder 4 - e.g., Operations Associate]",
    domain: "Business Development",
    type: "Part-time / Full-time",
    stipend: "Honorarium / Stipend (Placeholder)",
    duration: "6 Months",
    description:
      "Support incubation centre operations, startup coordination, and entrepreneurship activities."
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
            src={schoolLogo}
            alt="Good Word Public School Logo"
            className="school-logo"
          />
        </div>
        <div className="header-meta">
          <span className="school-name">GOOD WORD PUBLIC SCHOOL</span>
          <h1>Incubation Centre – Opportunities</h1>
          <p>Explore our latest internship and job openings.</p>
        </div>
      </header>

      {/* 2. Announcement Section: Exactly 4 Cards */}
      <main className="announcement-main">
        <div className="board-bar">
          <span className="board-badge">Active Openings</span>
          <span className="board-count">04 Positions Available</span>
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
                <span className="card-location">📍 Incubation Centre</span>
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
          Good Word Public School · Incubation Centre
        </p>
        <span className="footer-subtext">
          Applications are submitted and processed through JobCandii.
        </span>
      </footer>
    </div>
  );
}
