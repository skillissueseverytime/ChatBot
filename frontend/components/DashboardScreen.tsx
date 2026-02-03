'use client';

import { useState, useEffect } from 'react';

interface UserData {
    nickname: string;
    karma_score: number;
    daily_matches_remaining: number;
}

interface DashboardScreenProps {
    userData: UserData;
    onFindMatch: (filter: string) => void;
    isLoading: boolean;
    onEditProfile: () => void;
}

export default function DashboardScreen({ userData, onFindMatch, isLoading, onEditProfile }: DashboardScreenProps) {
    const [selectedFilter, setSelectedFilter] = useState('any');

    const handleFilterClick = (filter: string) => {
        setSelectedFilter(filter);
    };

    const handleFindMatch = () => {
        onFindMatch(selectedFilter);
    };

    const [stats, setStats] = useState({ online_users: 0, active_chats: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:8000/debug/queues');
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        online_users: data.online_users || 0,
                        active_chats: data.active_chats || 0
                    });
                }
            } catch (e) {
                console.error("Failed to fetch stats");
            }
        };

        fetchStats();
        // Refresh every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="dashboard-screen">
            <div className="dashboard-container">
                <header className="dashboard-header" style={{ justifyContent: 'center' }}>
                    <div className="user-info">
                        <span className="user-avatar">✨</span>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="user-name">{userData.nickname || 'Anonymous'}</span>
                                <button className="btn-icon-small" onClick={onEditProfile} title="Edit Profile" style={{ background: 'none', border: 'none', cursor: 'cursor', padding: '4px', color: '#a78bfa' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="karma-badge">
                                <span className="karma-icon">💫</span>
                                <span>{userData.karma_score}</span> Karma
                            </div>
                        </div>
                    </div>
                </header>

                <div className="match-section" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h3>Find a Chat Partner</h3>
                        <p className="match-subtitle">Select who you'd like to talk to</p>
                    </div>

                    <div className="filter-options" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <button
                            className={`filter-btn ${selectedFilter === 'any' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('any')}
                        >
                            <span className="filter-icon">🌟</span>
                            <span>Anyone</span>
                        </button>
                        <button
                            className={`filter-btn ${selectedFilter === 'female' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('female')}
                        >
                            <span className="filter-icon">🌸</span>
                            <span>Women</span>
                        </button>
                        <button
                            className={`filter-btn ${selectedFilter === 'male' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('male')}
                        >
                            <span className="filter-icon">🔷</span>
                            <span>Men</span>
                        </button>
                    </div>

                    <button className="btn-primary btn-large" onClick={handleFindMatch} disabled={isLoading} style={{ marginTop: '1rem', width: '100%', maxWidth: '400px', alignSelf: 'center', padding: '1.2rem' }}>
                        {isLoading ? (
                            <div className="btn-loader"></div>
                        ) : (
                            <span className="btn-text">Find Match</span>
                        )}
                    </button>
                </div>

                <div className="live-status" style={{ marginTop: '4rem', display: 'flex', gap: '3rem', justifyContent: 'center' }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.online_users}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Online Users</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.active_chats}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Active Chats</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
