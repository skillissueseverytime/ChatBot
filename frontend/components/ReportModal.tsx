'use client';

import { useState } from 'react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, details: string) => void;
}

export default function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');

    const handleSubmit = () => {
        if (!selectedReason) return;
        onSubmit(selectedReason, details);
        setSelectedReason('');
        setDetails('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal active">
            <div className="modal-content">
                <h3>Report User</h3>
                <p>Help us keep the community safe. Why are you reporting this user?</p>

                <div className="report-reasons">
                    <label className="report-option">
                        <input
                            type="radio"
                            name="report-reason"
                            value="harassment"
                            checked={selectedReason === 'harassment'}
                            onChange={(e) => setSelectedReason(e.target.value)}
                        />
                        <span>Harassment or bullying</span>
                    </label>
                    <label className="report-option">
                        <input
                            type="radio"
                            name="report-reason"
                            value="inappropriate"
                            checked={selectedReason === 'inappropriate'}
                            onChange={(e) => setSelectedReason(e.target.value)}
                        />
                        <span>Inappropriate content</span>
                    </label>
                    <label className="report-option">
                        <input
                            type="radio"
                            name="report-reason"
                            value="spam"
                            checked={selectedReason === 'spam'}
                            onChange={(e) => setSelectedReason(e.target.value)}
                        />
                        <span>Spam or scam</span>
                    </label>
                    <label className="report-option">
                        <input
                            type="radio"
                            name="report-reason"
                            value="other"
                            checked={selectedReason === 'other'}
                            onChange={(e) => setSelectedReason(e.target.value)}
                        />
                        <span>Other</span>
                    </label>
                </div>

                <textarea
                    className="report-details"
                    placeholder="Additional details (optional)..."
                    maxLength={500}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                ></textarea>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary btn-danger"
                        onClick={handleSubmit}
                        disabled={!selectedReason}
                    >
                        Submit Report
                    </button>
                </div>
            </div>
        </div>
    );
}
