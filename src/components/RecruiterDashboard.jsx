import React, { useState, useEffect } from "react";
import './RecruiterDashboard.css';

import { db } from "../firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import JobForm from "./JobForm";
import { Form, Button, Modal, Alert } from "react-bootstrap";

export default function RecruiterDashboard({ users }) {
    if (!users) {
        return <div className="no-access">Please log in as a recruiter to view this page.</div>;
    }

    const [jobs, setJobs] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editJob, setEditJob] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    const jobsCollection = collection(db, "jobs");

    const fetchJobs = async () => {
        const data = await getDocs(jobsCollection);
        setJobs(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };

    useEffect(() => { fetchJobs(); }, []);

    // Add Job
    const addJob = async (job) => {
        await addDoc(jobsCollection, { 
            ...job, 
            recruiterId: users.uid, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        fetchJobs();
        setSuccessMessage("✅ Job added successfully!");
        setTimeout(() => setSuccessMessage(""), 3000); // auto-hide after 3s
    };

    // Delete Job
    const deleteJobById = async (id) => {
        await deleteDoc(doc(db, "jobs", id));
        fetchJobs();
    };

    // Edit Job
    const startEditJob = (job) => {
        setEditJob(job);
        setEditForm({
            ...job,
            qualifications: Array.isArray(job.qualifications) ? job.qualifications.join(", ") : job.qualifications || "",
        });
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(f => ({
            ...f,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const saveEditJob = async () => {
        if (!editJob) return;
        const updatedJob = {
            ...editForm,
            salary_from: Number(editForm.salary_from),
            salary_to: Number(editForm.salary_to),
            number_of_opening: Number(editForm.number_of_opening),
            is_remote_work: Boolean(editForm.is_remote_work),
            qualifications: editForm.qualifications.split(",").map(q => q.trim()),
            updated_at: new Date().toISOString(),
        };
        await updateDoc(doc(db, "jobs", editJob.id), updatedJob);
        setEditJob(null);
        setEditForm({});
        fetchJobs();
    };

    // View Details
    const viewDetails = (job) => {
        setSelectedJob(job);
        setShowModal(true);
    };

    const filteredJobs = jobs
        .filter(job => job.title?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "salary") return (b.salary_from || 0) - (a.salary_from || 0);
            if (sortBy === "deadline") return new Date(a.application_deadline) - new Date(b.application_deadline);
            return 0;
        });

    const recruiterJobs = filteredJobs.filter(job => job.recruiterId === users.uid);

    return (
        <div className="recruiter-dashboard">
            
            {/* Success Message */}
            {successMessage && (
                <Alert variant="success" className="mt-2">{successMessage}</Alert>
            )}


            {/* Job Form */}
            <div className="job-form">
                <JobForm onSubmit={addJob} />
            </div>

           

            {/* Job Details Modal */}
            <JobDetailModal 
                show={showModal} 
                handleClose={() => setShowModal(false)} 
                job={selectedJob} 
            />

            {/* Edit Job Modal */}
            <Modal show={!!editJob} onHide={() => setEditJob(null)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Job</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-2">
                            <Form.Control name="title" placeholder="Title" value={editForm.title || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="company" placeholder="Company" value={editForm.company || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="location" placeholder="Location" value={editForm.location || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="job_category" placeholder="Job Category" value={editForm.job_category || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="salary_from" type="number" placeholder="Salary From" value={editForm.salary_from || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="salary_to" type="number" placeholder="Salary To" value={editForm.salary_to || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="employment_type" placeholder="Employment Type" value={editForm.employment_type || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="application_deadline" placeholder="Application Deadline" value={editForm.application_deadline || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="number_of_opening" type="number" placeholder="Number of Openings" value={editForm.number_of_opening || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Check
                                type="checkbox"
                                label="Remote Work"
                                name="is_remote_work"
                                checked={!!editForm.is_remote_work}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control as="textarea" name="description" placeholder="Description" value={editForm.description || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="qualifications" placeholder='Qualifications (comma separated)' value={editForm.qualifications || ""} onChange={handleEditChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Control name="contact" placeholder="Contact" value={editForm.contact || ""} onChange={handleEditChange} required />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setEditJob(null)}>Cancel</Button>
                    <Button variant="primary" onClick={saveEditJob}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
