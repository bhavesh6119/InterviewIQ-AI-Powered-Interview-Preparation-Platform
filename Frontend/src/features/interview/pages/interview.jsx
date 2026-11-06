import React, { useState, useEffect } from 'react';
import '../styles/interview.scss';
import { useInterview } from '../hooks/useInterview';
import { useParams } from 'react-router-dom';
import { generateResumePdf } from '../services/interview.api';


const NAV_ITEMS = [
  { id: 'technical', label: 'Technical Questions', icon: '›' },
  { id: 'behavioral', label: 'Behavioral Questions', icon: '◦' },
  { id: 'roadmap', label: 'Road Map', icon: '◈' }
];

const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className='q-card'>
      <div className='q-card__header' onClick={() => setOpen((prev) => !prev)}>
        <span className='q-card__index'>Q{index + 1}</span>
        <p className='q-card__question'>{item.question}</p>
        <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
          ▾
        </span>
      </div>

      {open && (
        <div className='q-card__body'>
          <div className='q-card__section'>
            <span className='q-card__tag q-card__tag--intention'>Intention</span>
            <p>{item.intention}</p>
          </div>
          <div className='q-card__section'>
            <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
            <p>{item.answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const RoadMapDay = ({ day }) => (
  <div className='roadmap-day'>
    <div className='roadmap-day__header'>
      <span className='roadmap-day__badge'>Day {day.day}</span>
      <h3 className='roadmap-day__focus'>{day.focus}</h3>
    </div>
    <ul className='roadmap-day__tasks'>
      {day.tasks.map((task, i) => (
        <li key={i}>
          <span className='roadmap-day__bullet' />
          {task}
        </li>
      ))}
    </ul>
  </div>
);

const Interview = () => {
  const [activeNav, setActiveNav] = useState('technical');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const { report, getReportById, loading } = useInterview();
  const { interviewId } = useParams()

  useEffect(()=>{
    if(interviewId){
        getReportById(interviewId)
    }
  },[ interviewId ])

 const handleDownloadResume = async () => {
  if (!interviewId) return;

  setIsDownloading(true);
  setDownloadError('');

  try {
    const pdfBlob = await generateResumePdf({ interviewReportId: interviewId });

    if (!(pdfBlob instanceof Blob) || pdfBlob.type.includes('json')) {
      throw new Error('Resume generation failed. Please try again.');
    }

    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report?.title || 'candidate-resume'}.pdf`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Resume download failed:', error);
    setDownloadError(error?.message || 'Resume generation failed. Please try again.');
  } finally {
    setIsDownloading(false);
  }
};

    if(loading){
        return (
            <main className='loading-screen'>
                <h1>
                    Loading...
                </h1>
            </main>
        )
    }

  if (!report) {
    return (
      <div className='interview-page'>
        <div className='interview-layout'>
          <div style={{ padding: '2rem', color: '#e6edf3' }}>
            Unable to load interview report. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  const technicalQuestions = Array.isArray(report.technicalQuestions) ? report.technicalQuestions : [];
  const behaviouralQuestions = Array.isArray(report.behaviouralQuestions)
    ? report.behaviouralQuestions
    : Array.isArray(report.behavioralQuestions)
      ? report.behavioralQuestions
      : [];
  const preparationPlan = Array.isArray(report.preparationPlan) ? report.preparationPlan : [];
  const skillGaps = Array.isArray(report.skillGaps) ? report.skillGaps : [];

  const scoreColor =
    report.matchScore >= 80 ? 'score--high' :
      report.matchScore >= 60 ? 'score--mid' : 'score--low';

  return (
    <div className='interview-page'>
      <div className='interview-layout'>
        <nav className='interview-nav'>
          <div className='nav-content'>
            <p className='interview-nav__label'>Sections</p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                onClick={() => setActiveNav(item.id)}
                type='button'
              >
                <span className='interview-nav__icon'>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <button
            type='button'
            className={`button primary-button ${isDownloading ? 'is-loading' : ''}`}
            onClick={handleDownloadResume}
            disabled={isDownloading}
          >
            {isDownloading ? 'Preparing Resume...' : 'Download Resume'}
          </button>
        </nav>

        {downloadError && (
          <div className='interview-download-error' aria-live='polite'>
            {downloadError}
          </div>
        )}

        <div className='interview-divider' />

        <main className='interview-content'>
          {activeNav === 'technical' && (
            <section>
              <div className='content-header'>
                <h2>Technical Questions</h2>
                <span className='content-header__count'>{technicalQuestions.length} questions</span>
              </div>
              <div className='q-list'>
                {technicalQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === 'behavioral' && (
            <section>
              <div className='content-header'>
                <h2>Behavioral Questions</h2>
                <span className='content-header__count'>{behaviouralQuestions.length} questions</span>
              </div>
              <div className='q-list'>
                {behaviouralQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === 'roadmap' && (
            <section>
              <div className='content-header'>
                <h2>Preparation Road Map</h2>
                <span className='content-header__count'>{preparationPlan.length}-day plan</span>
              </div>
              <div className='roadmap-list'>
                {preparationPlan.map((day) => (
                  <RoadMapDay key={day.day} day={day} />
                ))}
              </div>
            </section>
          )}
        </main>

        <div className='interview-divider' />

        <aside className='interview-sidebar'>
          <div className='match-score'>
            <p className='match-score__label'>Match Score</p>
            <div className={`match-score__ring ${scoreColor}`}>
              <span className='match-score__value'>{report.matchScore}</span>
              <span className='match-score__pct'>%</span>
            </div>
            <p className='match-score__sub'>Strong match for this role</p>
          </div>

          <div className='sidebar-divider' />

          <div className='skill-gaps'>
            <p className='skill-gaps__label'>Skill Gaps</p>
            <div className='skill-gaps__list'>
              {skillGaps.map((gap, i) => (
                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                  {gap.skill}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Interview;