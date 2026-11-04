import React, { useState } from 'react';
import '../styles/interview.scss';

const report = {
  matchScore: 88,
  technicalQuestions: [
    {
      question: 'Explain the Node.js event loop and how it handles asynchronous I/O operations.',
      intention: 'Assess understanding of runtime execution and non-blocking behavior.',
      answer: 'Node.js uses the event loop to process callbacks without blocking the main thread. Async I/O operations are delegated to the libuv thread pool, and completion callbacks are queued back to the event loop.'
    },
    {
      question: 'How do you optimize a MongoDB aggregation pipeline for high-volume data?',
      intention: 'Check pipeline design and performance thinking.',
      answer: 'I would reduce document scanning by indexing fields used in match and sort stages, project only required fields, and push heavy transformations earlier to minimize output size.'
    },
    {
      question: 'Can you describe the Cache-Aside pattern and when you would use Redis in a Node.js application?',
      intention: 'Understand caching strategy and trade-offs.',
      answer: 'Cache-Aside loads data from the database into Redis on first access, then serves future requests from cache. I would use Redis for hot data, session state, or rate limiting.'
    },
    {
      question: 'What are the challenges of migrating a monolithic application to a modular service-based architecture?',
      intention: 'Assess system design and migration planning maturity.',
      answer: 'The biggest challenges are breaking contracts safely, data consistency, operational complexity, and keeping backward compatibility during incremental rollout.'
    }
  ],
  behavioralQuestions: [
    {
      question: 'Tell me about a time you had to fix a production issue under pressure.',
      intention: 'Evaluate ownership and crisis response.',
      answer: 'I triaged the incident quickly, isolated the failing dependency, communicated status, and implemented a reversible fix while monitoring metrics.'
    },
    {
      question: 'Describe a situation where you had to align stakeholders with conflicting priorities.',
      intention: 'Measure collaboration and communication.',
      answer: 'I gathered each stakeholder’s goals, clarified the shared objective, and proposed a phased delivery plan that balanced dependencies and risk.'
    }
  ],
  skillGaps: [
    { skill: 'Message Queues (Kafka|RabbitMQ)', severity: 'high' },
    { skill: 'Advanced Docker & CI/CD Pipelines', severity: 'medium' },
    { skill: 'Distributed Systems Design', severity: 'medium' },
    { skill: 'Production-level Redis management', severity: 'low' }
  ],
  preparationPlan: [
    {
      day: 1,
      focus: 'Core backend fundamentals',
      tasks: ['Review async patterns and event loop behavior', 'Practice Node.js debugging scenarios']
    },
    {
      day: 2,
      focus: 'Database performance tuning',
      tasks: ['Study indexes and aggregation pipelines', 'Run MongoDB query optimization exercises']
    },
    {
      day: 3,
      focus: 'Caching and system design',
      tasks: ['Review Redis patterns', 'Model cache invalidation and failure cases']
    }
  ]
};

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

          <button type='button' className='button primary-button'>
            Download Resume
          </button>
        </nav>

        <div className='interview-divider' />

        <main className='interview-content'>
          {activeNav === 'technical' && (
            <section>
              <div className='content-header'>
                <h2>Technical Questions</h2>
                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
              </div>
              <div className='q-list'>
                {report.technicalQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === 'behavioral' && (
            <section>
              <div className='content-header'>
                <h2>Behavioral Questions</h2>
                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
              </div>
              <div className='q-list'>
                {report.behavioralQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === 'roadmap' && (
            <section>
              <div className='content-header'>
                <h2>Preparation Road Map</h2>
                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
              </div>
              <div className='roadmap-list'>
                {report.preparationPlan.map((day) => (
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
              {report.skillGaps.map((gap, i) => (
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