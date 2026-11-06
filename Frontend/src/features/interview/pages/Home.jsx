import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/home.scss";
import { useInterview } from '../hooks/useInterview';
import { useAuth } from '../../auth/hooks/useAuth';

const Home = () => {

    const { loading, generateReport, reports, getReports } = useInterview();
    const { handleLogout } = useAuth();
    const navigate = useNavigate();

    const [jobDescription, setJobDescription] = useState('');
    const [selfDescription, setSelfDescription] = useState('');
    const [resumeName, setResumeName] = useState('No file selected');
    const resumeInputRef = useRef();

    useEffect(() => {
        getReports();
    }, []);

    const handleGenerateReport = async () => {
        const resumeFile = resumeInputRef.current?.files?.[0];

        if (!resumeFile) {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile: null });
            if (!data) return;
            navigate(`/interview/${data._id}`);
            return;
        }

        const data = await generateReport({ jobDescription, selfDescription, resumeFile });

        if (!data) {
            return;
        }

        navigate(`/interview/${data._id}`);
    };

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>
                    Loading your Interview Plan...
                </h1>
            </main>
        )
    }

    const handleGenerate = () => {
        navigate('/interview/demo');
    };

    const onLogout = async () => {
        const success = await handleLogout();

        if (success) {
            navigate('/login');
        }
    };

    return (
        <main className='Home'>
        <div className='home-shell'>
            <div className='home-toolbar'>
                <span className='toolbar-spacer'></span>
                <button type='button' className='logout-button' onClick={onLogout}>
                    Logout
                </button>
            </div>
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
                onChange={(e)=>{setjobDescription(e.target.value)}}
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
                    ref= {resumeInputRef}
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
                    onChange={(e)=>{setSelfDescription(e.target.value)}}
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

                <button 
                className='button primary-button' 
                type='button' 
                onClick={handleGenerateReport}>
                <span className='star'>✦</span>
                Generate My Interview Strategy
                </button>
            </div>
            </section>

            {reports.length > 0 ? (
                <section className='recent reports'>
                    <div className='reports-header'>
                        <h2>My Recent Interview Plans</h2>
                    </div>
                    <ul className='reports-list'>
                        {reports.map((report) => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <div className='report-main'>
                                    <h3>{report.title || 'Untitled Position'}</h3>
                                    <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                </div>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                    Match Score: {report.matchScore}%
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : (
                <section className='recent reports empty-state'>
                    <div className='empty-state-box'>
                        <div className='empty-icon'>✦</div>
                        <h2>No plans created yet</h2>
                        <p>Generate your first interview strategy to see it here.</p>
                    </div>
                </section>
            )}

            <footer className='home-footer'>
            <span>AI-Powered Strategy Generation • Approx 30s</span>
            </footer>
        </div>
        </main>
    );
};

export default Home;