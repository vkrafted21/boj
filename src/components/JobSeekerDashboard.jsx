import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import { Form, Row, Col, Button, InputGroup, Container } from "react-bootstrap";
import './JobSeekerDashboard.css';

export default function JobSeekerDashboard({ users }) {
    const [jobs, setJobs] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState("");
    const [loading, setLoading] = useState(true);

    const jobsCollection = collection(db, "jobs");
    const appsCollection = collection(db, "applications");

    const jobsPerPage = 12; // Better number for grid layout

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const data = await getDocs(jobsCollection);
            setJobs(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchJobs(); 
    }, []);

    const applyJob = async (jobId) => {
        try {
            await addDoc(appsCollection, { 
                jobId, 
                userId: users.uid, 
                appliedAt: new Date().toISOString() 
            });
            alert("Applied successfully!");
        } catch (error) {
            console.error("Error applying for job:", error);
            alert("Error applying for job. Please try again.");
        }
    };

    const viewDetails = (job) => {
        setSelectedJob(job);
        setShowModal(true);
    };

    const filteredJobs = jobs
        .filter(job => job.title?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "salary") return (b.salary_from || 0) - (a.salary_from || 0);
            if (sortBy === "deadline") {
                const dateA = new Date(a.application_deadline);
                const dateB = new Date(b.application_deadline);
                return dateA - dateB;
            }
            return 0;
        });

    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    const startIndex = (currentPage - 1) * jobsPerPage;
    const currentJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

    const goFirst = () => setCurrentPage(1);
    const goPrev = () => setCurrentPage(p => Math.max(p - 1, 1));
    const goNext = () => setCurrentPage(p => Math.min(p + 1, totalPages));
    const goLast = () => setCurrentPage(totalPages);

    const handleJumpPage = () => {
        const pageNum = Number(jumpPage);
        if (pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
        }
        setJumpPage("");
    };

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, sortBy]);

    return (
        <div className="jobseeker-dashboard">
            <Container fluid>
                {/* Search + Sort */}
                <div className="search-bar">
                    <Form.Control
                        placeholder="Search jobs by title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <Form.Select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="">Sort By</option>
                        <option value="salary">Salary (High to Low)</option>
                        <option value="deadline">Deadline (Earliest First)</option>
                    </Form.Select>
                </div>

                {/* Results Summary */}
                <div className="results-summary">
                    <p>
                        Showing {currentJobs.length} of {filteredJobs.length} jobs
                        {search && ` for "${search}"`}
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading jobs...</p>
                    </div>
                )}

                {/* Jobs Grid */}
                {!loading && (
                    <>
                        {currentJobs.length === 0 ? (
                            <div className="no-jobs">
                                <h3>No jobs found</h3>
                                <p>Try adjusting your search criteria or check back later for new opportunities.</p>
                            </div>
                        ) : (
                            <Row className="jobs-grid">
                                {currentJobs.map((job) => (
                                    <Col xs={12} sm={6} lg={4} xl={3} key={job.id} className="mb-4">
                                        <div className="job-card-wrapper">
                                            <JobCard 
                                                job={job} 
                                                applyJob={applyJob} 
                                                viewDetails={viewDetails} 
                                                isJobSeeker={true}
                                            />
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <div className="pagination-buttons">
                                    <Button 
                                        variant="outline-light" 
                                        onClick={goFirst} 
                                        disabled={currentPage === 1}
                                        size="sm"
                                    >
                                        ⟪ First
                                    </Button>
                                    <Button 
                                        variant="outline-light" 
                                        onClick={goPrev} 
                                        disabled={currentPage === 1}
                                        size="sm"
                                    >
                                        ‹ Prev
                                    </Button>
                                    
                                    <span className="page-info">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    
                                    <Button 
                                        variant="outline-light" 
                                        onClick={goNext} 
                                        disabled={currentPage === totalPages}
                                        size="sm"
                                    >
                                        Next ›
                                    </Button>
                                    <Button 
                                        variant="outline-light" 
                                        onClick={goLast} 
                                        disabled={currentPage === totalPages}
                                        size="sm"
                                    >
                                        Last ⟫
                                    </Button>
                                </div>

                                <div className="jump-to-page">
                                    <InputGroup size="sm">
                                        <Form.Control
                                            placeholder="Go to page"
                                            value={jumpPage}
                                            onChange={(e) => setJumpPage(e.target.value)}
                                            type="number"
                                            min="1"
                                            max={totalPages}
                                        />
                                        <Button 
                                            variant="outline-light" 
                                            onClick={handleJumpPage}
                                            disabled={!jumpPage}
                                        >
                                            Go
                                        </Button>
                                    </InputGroup>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Modal */}
                <JobDetailModal
                    show={showModal}
                    handleClose={() => setShowModal(false)}
                    job={selectedJob}
                />
            </Container>
        </div>
    );
}