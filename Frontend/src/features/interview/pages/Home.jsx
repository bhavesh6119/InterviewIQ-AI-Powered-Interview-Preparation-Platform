import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/home.scss";

const Home = () => {
  const navigate = useNavigate();

  const [jobDescription, setJobDescription] = useState('');
  const [selfDescription, setSelfDescription] = useState('');
  const [resumeName, setResumeName] = useState('No file selected');

  const handleGenerate = () => {
    navigate('/interview/demo');
  };

  return (
    <main className='Home'>
      <div className='home-shell'>
        <header className='home-header'>
          <h1>
            Create Your Custom <span>Interview</span> Plan
          </h1>
          <p>
            Let our AI analyze the job requirements and your unique profile to
            build a winning strategy.
          </p>
        </header>

        <section className='interview-input-group'>
          <div className='panel left-panel'>
            <div className='panel-header'>
              <div className='panel-title'>
                <span className='panel-icon'>✎</span>
                <span>Target Job Description</span>
              </div>
              <span className='badge'>Required</span>
            </div>

            <textarea
              name='jobDescription'
              id='jobDescription'
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder='Paste the full job description here...'
            ></textarea>

            <div className='panel-footer'>
              <span>{jobDescription.length} / 5000 chars</span>
            </div>
          </div>

          <div className='panel right-panel'>
            <div className='panel-header'>
              <div className='panel-title'>
                <span className='panel-icon'>◎</span>
                <span>Your Profile</span>
              </div>
            </div>

            <div className='upload-box'>
              <div className='upload-meta'>
                <span className='meta-label'>Upload Resume</span>
                <span className='meta-badge'>Best Results</span>
              </div>

              <label className='file-label' htmlFor='resume'>
                <span className='upload-icon'>⇪</span>
                <span>{resumeName}</span>
              </label>

              <span className='file-note'>PDF or DOCX (Max 5MB)</span>
              <input
                hidden
                type='file'
                name='resume'
                id='resume'
                accept='.pdf,.doc,.docx'
                onChange={(e) => setResumeName(e.target.files?.[0]?.name ?? 'No file selected')}
              />
            </div>

            <div className='self-description'>
              <label htmlFor='selfDescription'>Quick Self-Description</label>
              <textarea
                name='selfDescription'
                id='selfDescription'
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                placeholder='Briefly describe your experience, key skills, and years of experience if you don’t have a resume handy...'
              ></textarea>
            </div>

            <div className='required-note'>
              <span className='dot'></span>
              Either a Resume or a Self Description is required to generate a personalized plan.
            </div>

            <button className='button primary-button' type='button' onClick={handleGenerate}>
              <span className='star'>✦</span>
              Generate My Interview Strategy
            </button>
          </div>
        </section>

        <footer className='home-footer'>
          <span>AI-Powered Strategy Generation • Approx 30s</span>
        </footer>
      </div>
    </main>
  );
};

export default Home;