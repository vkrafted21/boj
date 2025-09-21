import React from "react";
import { Card, Button } from "react-bootstrap";
import "./JobCard.css";

export default function JobCard({ job, deleteJob, editJob, applyJob, isRecruiter, viewDetails }) {
    return (
        <Card className="job-card mb-3">
            <Card.Body>
                {/* Title */}
                <Card.Title className="job-title">
                    {job.title} - {job.company}
                </Card.Title>

                {/* Essentials only */}
                <div className="job-info">
                    <p><strong>Location:</strong> {job.location}</p>
                    <p><strong>Category:</strong> {job.job_category}</p>
                    <p><strong>Remote:</strong> {job.is_remote_work ? "Yes" : "No"}</p>
                    <p><strong>Salary:</strong> {job.salary_from} - {job.salary_to}</p>
                    <p><strong>Created:</strong> {job.created_at ? new Date(job.created_at).toLocaleDateString() : "N/A"}</p>
                </div>

                {/* Actions */}
                <div className="job-actions">
                    <Button 
                        variant="outline-light" 
                        className="me-2" 
                        onClick={() => viewDetails(job)}
                    >
                        View Details
                    </Button>

                    {deleteJob && (
                        <Button 
                            variant="danger" 
                            className="me-2" 
                            onClick={() => deleteJob(job.id)}
                        >
                            Delete
                        </Button>
                    )}

                    {editJob && (
                        <Button 
                            variant="warning" 
                            className="me-2" 
                            onClick={() => editJob(job)}
                        >
                            Edit
                        </Button>
                    )}

                    {applyJob && (
                        <Button 
                            variant="success" 
                            onClick={() => applyJob(job.id)}
                        >
                            Apply
                        </Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}
