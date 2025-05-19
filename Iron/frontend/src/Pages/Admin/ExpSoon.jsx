import { Alert, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import React, { useEffect, useState } from "react";

import axios from "axios";

const ExpSoon = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [status, setStatus] = useState("");

  // Fetch all jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/quotation/get_all_jobs"
        );
        setJobs(response.data.jobs);
      } catch (err) {
        setError("Error fetching jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Helper to check if start_date is within today and next 7 days
  const isStartDateWithinNext7Days = (start_date) => {
    if (!start_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(start_date);
    start.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((start - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  // Open modal to update job
  const handleOpenModal = (job) => {
    setSelectedJob(job);
    setStartDate(job.start_date);
    setFinishDate(job.finish_date);
    setStatus(job.status);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  // Handle job update
  const handleUpdateJob = async () => {
    try {
      const response = await axios.put(
        "http://localhost:4000/api/quotation/update_job",
        {
          jobId: selectedJob.id,
          startDate,
          finishDate,
          status,
        }
      );
      if (response.data.success) {
        // Update the jobs in the UI after successful update
        setJobs(
          jobs.map((job) =>
            job.id === selectedJob.id
              ? {
                  ...job,
                  start_date: startDate,
                  finish_date: finishDate,
                  status,
                }
              : job
          )
        );
        handleCloseModal(); // Close the modal
      }
    } catch (err) {
      setError("Error updating job");
    }
  };

  return (
    <div className="container mt-5 leftpart">
      <h2>Exp Zoon Job</h2>

      {loading && (
        <div className="d-flex justify-content-center">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && jobs.length === 0 && (
        <Alert variant="info">No jobs available.</Alert>
      )}

      {!loading && !error && jobs.length > 0 && (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Job Name</th>
              <th>Required Date</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs
              .filter((job) => isStartDateWithinNext7Days(job.start_date))
              .map((job) => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>{job.job_name}</td>
                  <td>
                    {job.start_date
                      ? new Date(job.start_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    {job.finish_date
                      ? new Date(job.finish_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{job.status}</td>
                  <td>
                    <Button
                      variant="primary"
                      onClick={() => handleOpenModal(job)}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      )}

      {/* Modal for updating job */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Update Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Label>JobID : {selectedJob ? selectedJob.id : ""}</Form.Label>
            <Form.Group controlId="formJobStartDate">
              <Form.Label>Required Date</Form.Label>
              <Form.Control
                type="date"
                readOnly
                value={startDate ? startDate.slice(0, 10) : ""}
              />
            </Form.Group>

            <Form.Group controlId="formJobFinishDate">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={finishDate ? finishDate.slice(0, 10) : ""}
                onChange={(e) => setFinishDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="formJobStatus">
              <Form.Label>Status</Form.Label>
              <Form.Control
                as="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Delivered">Delivered</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleUpdateJob}>
            Update Job
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExpSoon;
