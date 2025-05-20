import {
  Alert,
  Button,
  Form,
  Modal,
  Spinner,
  Table,
  Badge,
  Tab,
  Tabs,
  Card,
} from "react-bootstrap";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { LockFill, ArrowClockwise } from "react-bootstrap-icons";

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [assignedResources, setAssignedResources] = useState({
    employees: [],
    machines: [],
  });
  const [unavailableEmployees, setUnavailableEmployees] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [activeTab, setActiveTab] = useState("available");
  const [filterText, setFilterText] = useState("");
  const [quotations, setQuotations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastDataRefresh, setLastDataRefresh] = useState(Date.now());
  const [refreshingData, setRefreshingData] = useState(false);
  const [jobsOnSameDay, setJobsOnSameDay] = useState([]);

  // Enhanced ID normalization function with better error handling
  const normalizeId = (id) => {
    // If null or undefined, return null
    if (id === null || id === undefined) return null;

    // If already a number, return it
    if (typeof id === "number") return id;

    // Try to parse as integer
    try {
      const parsedId = parseInt(id, 10);
      // Check if parsing was successful (not NaN)
      return isNaN(parsedId) ? null : parsedId;
    } catch (e) {
      console.error("Error parsing ID:", id, e);
      return null;
    }
  };

  // Add these two functions to your JobManagement component:

  // Function to update job resources (add more employees/machines)
  const handleUpdateResources = async () => {
    // Validate the selection first
    if (!validateResourceSelection()) {
      return; // Stop if there are blocking validation errors
    }

    try {
      setIsSubmitting(true); // Add a loading state

      // Ensure we're using normalized IDs
      const normalizedJobId = normalizeId(selectedJob.id);
      const normalizedEmployeeIds = selectedEmployees
        .map((id) => normalizeId(id))
        .filter((id) => id !== null);
      const normalizedMachineIds = selectedMachines
        .map((id) => normalizeId(id))
        .filter((id) => id !== null);

      console.log("Sending update request:", {
        jobId: normalizedJobId,
        employeeIdsToAdd: normalizedEmployeeIds,
        machineIdsToAdd: normalizedMachineIds,
      });

      try {
        const response = await axios.post(
          "http://localhost:4000/api/jobs/update",
          {
            jobId: normalizedJobId,
            employeeIdsToAdd: normalizedEmployeeIds,
            machineIdsToAdd: normalizedMachineIds,
          }
        );

        if (response.data.success) {
          // Show a success message
          alert(
            `Successfully added ${response.data.addedEmployees} employees and ${response.data.addedMachines} machines`
          );

          // Close the modal
          handleCloseAssignModal();

          // Refresh the job list to show updated status
          fetchJobs();
        }
      } catch (err) {
        console.error("Update error:", err);
        handleAssignmentError(err);
      }
    } catch (err) {
      console.error("Unexpected error in update function:", err);
      setValidationErrors(["Unexpected error. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to remove resources from a job
  const handleRemoveResources = async (
    jobId,
    employeeIds = [],
    machineIds = []
  ) => {
    if (!jobId || (!employeeIds.length && !machineIds.length)) {
      alert("No resources selected for removal");
      return;
    }

    // Confirm before removing
    if (
      !window.confirm(
        `Are you sure you want to remove ${employeeIds.length} employees and ${machineIds.length} machines from this job?`
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      const normalizedJobId = normalizeId(jobId);
      const normalizedEmployeeIds = employeeIds
        .map((id) => normalizeId(id))
        .filter((id) => id !== null);
      const normalizedMachineIds = machineIds
        .map((id) => normalizeId(id))
        .filter((id) => id !== null);

      console.log("Sending removal request:", {
        jobId: normalizedJobId,
        employeeIds: normalizedEmployeeIds,
        machineIds: normalizedMachineIds,
      });

      try {
        const response = await axios.post(
          "http://localhost:4000/api/jobs/remove",
          {
            jobId: normalizedJobId,
            employeeIds: normalizedEmployeeIds,
            machineIds: normalizedMachineIds,
          }
        );

        if (response.data.success) {
          alert(
            `Successfully removed ${response.data.removedEmployees} employees and ${response.data.removedMachines} machines. Remaining: ${response.data.remainingEmployees} employees and ${response.data.remainingMachines} machines.`
          );

          // Close view modal if open
          if (showViewModal) {
            handleCloseViewModal();
          }

          // Refresh the job list to show updated status
          fetchJobs();
        }
      } catch (err) {
        console.error("Removal error:", err);
        setError(
          `Error removing resources: ${
            err.response?.data?.message || err.message
          }`
        );
      }
    } catch (err) {
      console.error("Unexpected error in removal function:", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a helper function to handle assignment errors
  const handleAssignmentError = (err) => {
    console.log("Error response:", err.response?.data);

    // Better handling of error responses
    if (err.response?.status === 400) {
      // Handle validation errors from the server
      const serverErrors = [err.response.data.message || "Unknown error"];

      // If the server sent specific conflicting resource data
      if (err.response.data.conflictingEmployees) {
        const conflictingEmployeeNames = err.response.data.conflictingEmployees
          .map((emp) => emp.name)
          .join(", ");

        serverErrors.push(`Conflicting employees: ${conflictingEmployeeNames}`);
      }

      if (err.response.data.inactiveEmployees) {
        const inactiveEmployeeNames = err.response.data.inactiveEmployees
          .map((emp) => emp.name)
          .join(", ");

        serverErrors.push(`Inactive employees: ${inactiveEmployeeNames}`);
      }

      if (err.response.data.unavailableMachines) {
        const unavailableMachineNames = err.response.data.unavailableMachines
          .map((machine) => `${machine.machineName} (${machine.status})`)
          .join(", ");

        serverErrors.push(`Unavailable machines: ${unavailableMachineNames}`);
      }

      setValidationErrors(serverErrors);
    } else if (err.response?.status === 500) {
      // Handle server errors
      setValidationErrors([
        "Server error: " + (err.response.data.message || "Unknown error"),
      ]);
    } else {
      // Handle network or other errors
      setValidationErrors([
        "Error processing request: " + (err.message || "Unknown error"),
      ]);
    }
  };

  const renderMachineCards = () => {
    const filteredMachines = getFilteredMachines();

    if (filteredMachines.length === 0) {
      return (
        <Alert variant="info">No machines found matching your criteria.</Alert>
      );
    }

    return (
      <div className="row row-cols-1 row-cols-md-2 g-3">
        {filteredMachines.map((machine) => {
          // Normalize machine ID
          const machineId = normalizeId(machine.id);

          // Skip invalid IDs
          if (machineId === null) return null;

          const isAvailable = isMachineAvailable(machine);
          const isSelected = selectedMachines.includes(machineId);

          return (
            <div key={machineId} className="col">
              <Card
                className={`h-100 ${isSelected ? "border-primary" : ""} ${
                  !isAvailable ? "opacity-75" : ""
                }`}
                style={{
                  cursor: !isAvailable ? "not-allowed" : "pointer",
                  borderLeft: !isAvailable ? "5px solid #dc3545" : "",
                  position: "relative",
                  // Add distinct background for unavailable machines
                  backgroundColor: !isAvailable ? "#fff5f5" : "",
                }}
                onClick={() => isAvailable && toggleMachineSelection(machineId)}
              >
                {/* Enhanced status icon for machines */}
                {!isAvailable && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      zIndex: 2,
                      backgroundColor: "#dc3545",
                      borderRadius: "50%",
                      padding: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                    }}
                  >
                    <LockFill color="white" size={16} />
                  </div>
                )}

                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{machine.machineName}</strong>
                      <div>
                        <Badge
                          bg={
                            machine.status === "Active"
                              ? "success"
                              : "secondary"
                          }
                          className="me-1"
                        >
                          {machine.status}
                        </Badge>
                      </div>
                    </div>
                    <Form.Check
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isAvailable}
                      onChange={() =>
                        isAvailable && toggleMachineSelection(machineId)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>
    );
  };

  // IMPROVED: Consistent date formatting that works both for display and backend communication
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";

    try {
      // First, check if it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split("-").map(Number);
        return `${month}/${day}/${year}`;
      }

      // For other date formats, use a more robust approach
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date for display:", dateString);
        return "N/A";
      }

      // Format using local methods for consistency
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();

      return `${month}/${day}/${year}`;
    } catch (e) {
      console.error("Error formatting date for display:", e);
      return "N/A";
    }
  };

  // NEW: Function to return the standardized YYYY-MM-DD format for backend
  const formatDateForBackend = (dateString) => {
    if (!dateString) return null;

    try {
      // If already in YYYY-MM-DD format, use directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      // Create a date object and ensure consistent handling
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date for backend:", dateString);
        return null;
      }

      // Format as YYYY-MM-DD for backend
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formatting date for backend:", e);
      return null;
    }
  };

  // Enhanced employee activity check
  const isEmployeeActive = (employee) => {
    if (employee === null || employee === undefined) return false;

    // Handle various representations of the active property
    if (typeof employee.active === "boolean") return employee.active;
    if (typeof employee.active === "number") return employee.active === 1;
    if (typeof employee.active === "string") {
      const activeStr = employee.active.toLowerCase();
      return (
        activeStr === "1" ||
        activeStr === "true" ||
        activeStr === "yes" ||
        activeStr === "active"
      );
    }

    return false;
  };

  // Helper functions for error handling
  const hasBlockingErrors = () => {
    // Check for specific blocking error patterns
    return validationErrors.some(
      (error) =>
        error.includes("Cannot assign") ||
        error.includes("Error") ||
        error.includes("Invalid")
    );
  };

  const getAlertVariant = () => {
    if (hasBlockingErrors()) {
      return "danger"; // True errors show as red
    }
    return "info"; // Informational warnings show as blue
  };

  // Implement data fetching as a memoized function for reuse
  const fetchAllData = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshingData(true);
      }

      const [jobsRes, employeesRes, machinesRes, quotationsRes] =
        await Promise.all([
          axios.get("http://localhost:4000/api/quotation/get_all_jobs"),
          axios.get("http://localhost:4000/api/employee/get"),
          axios.get("http://localhost:4000/api/machine/get"),
          axios.get("http://localhost:4000/api/quotation/admin"),
        ]);

      console.log("Data refreshed at:", new Date().toISOString());

      // Process employees to standardize the active property and IDs
      const processedEmployees = employeesRes.data.employees.map((emp) => {
        // Normalize ID
        const normalizedId = normalizeId(emp.id);

        // Standardize the active property to a boolean
        const isActive = isEmployeeActive(emp);

        return {
          ...emp,
          id: normalizedId, // Store normalized ID
          active: isActive, // Store as boolean for consistent checking
        };
      });

      // Enhance jobs with quotation data but preserve date strings from backend
      const enhancedJobs = jobsRes.data.jobs.map((job) => {
        // Find matching quotation for this job
        const matchingQuotation = quotationsRes.data.quotations.find(
          (q) => normalizeId(q.id) === normalizeId(job.quotation_id)
        );

        return {
          ...job,
          id: normalizeId(job.id), // Normalize the job ID
          quotation_id: normalizeId(job.quotation_id),
          quotation_immediate: matchingQuotation?.immediate || null,
          // Keep original date strings from backend - they're already properly formatted
          start_date: job.start_date,
          finish_date: job.finish_date,
        };
      });

      // Process machines to normalize IDs
      const processedMachines = machinesRes.data.machines.map((machine) => ({
        ...machine,
        id: normalizeId(machine.id), // Normalize the machine ID
      }));

      setJobs(enhancedJobs);
      setEmployees(processedEmployees);
      setMachines(processedMachines);
      setQuotations(quotationsRes.data.quotations);
      setLastDataRefresh(Date.now());

      return {
        jobs: enhancedJobs,
        employees: processedEmployees,
        machines: processedMachines,
      };
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        "Error fetching data: " + (err.response?.data?.message || err.message)
      );
      return null;
    } finally {
      if (showLoadingState) {
        setLoading(false);
      } else {
        setRefreshingData(false);
      }
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Simplified job fetching to reuse the main data fetch function
  const fetchJobs = async () => {
    await fetchAllData(false);
  };

  // Add a manual refresh function
  const handleManualRefresh = async () => {
    setError("");
    await fetchAllData(false);
  };

  // IMPROVED: Enhanced assign modal function with better conflict checking
  const handleOpenAssignModal = async (job) => {
    // Clear previous state
    setSelectedJob(job);
    setSelectedEmployees([]);
    setSelectedMachines([]);
    setValidationErrors([]);
    setFilterText("");
    setActiveTab("available");
    setUnavailableEmployees({}); // Reset unavailable employees
    setJobsOnSameDay([]); // Reset jobs on same day

    // Don't allow resource assignment for completed jobs
    if (job.status === "Completed") {
      setValidationErrors(["Cannot assign resources to a completed job"]);
      setShowAssignModal(true);
      return;
    }

    try {
      // Check if data needs refreshing (older than 1 minute)
      const dataAgeMinutes = (Date.now() - lastDataRefresh) / (1000 * 60);
      if (dataAgeMinutes > 1) {
        console.log("Data is stale, refreshing before checking conflicts");
        await fetchAllData(false);
      }

      // Check if job has start_date
      if (!job.start_date) {
        console.warn("Job has no start date for scheduling conflicts");
        setValidationErrors(["Job has no start date set for scheduling"]);
        setShowAssignModal(true);
        return;
      }

      // IMPROVED: Ensure consistent date format for backend
      const jobDate = formatDateForBackend(job.start_date);
      console.log("Job start date for conflict check:", jobDate);

      if (!jobDate) {
        console.warn("Invalid job date for scheduling");
        setValidationErrors(["Invalid job date for scheduling"]);
        setShowAssignModal(true);
        return;
      }

      try {
        // IMPROVED: Get jobs on the exact same day with better error handling
        const jobsOnSameDayRes = await axios.get(
          `http://localhost:4000/api/jobs/by-date/${jobDate}`
        );

        const sameDayJobs = jobsOnSameDayRes.data.jobs || [];
        setJobsOnSameDay(sameDayJobs);

        if (sameDayJobs.length > 0) {
          console.log(`Found ${sameDayJobs.length} jobs on ${jobDate}`);
        } else {
          console.log(`No other jobs found on ${jobDate}`);
          setShowAssignModal(true);
          return; // No conflicts possible if no other jobs on same date
        }

        // Create a map for unavailable employees with better error handling
        const unavailable = {};

        // IMPROVED: Get all assigned resources in one go to reduce API calls
        const assignedPromises = sameDayJobs.map((existingJob) => {
          // Skip the current job
          if (normalizeId(existingJob.id) === normalizeId(job.id)) {
            return Promise.resolve(null);
          }

          return axios
            .get(`http://localhost:4000/api/jobs/assigned/${existingJob.id}`)
            .catch((err) => {
              console.error(
                `Error fetching assigned resources for job ${existingJob.id}:`,
                err
              );
              return { data: { employees: [] } }; // Return empty default on error
            });
        });

        const assignedResults = await Promise.all(assignedPromises);

        // Process all assigned resources to mark employees as unavailable
        assignedResults.forEach((response, index) => {
          if (!response || !response.data) return;

          const existingJob = sameDayJobs[index];
          // Skip if same as current job or null response
          if (
            !existingJob ||
            normalizeId(existingJob.id) === normalizeId(job.id)
          )
            return;

          if (response.data.employees && response.data.employees.length > 0) {
            response.data.employees.forEach((emp) => {
              const empId = normalizeId(emp.id);
              if (empId !== null) {
                // Use the formatDateForDisplay function to format the date consistently
                const conflictDate = formatDateForDisplay(
                  existingJob.start_date
                );
                unavailable[
                  empId
                ] = `Already assigned to job "${existingJob.job_name}" (#${existingJob.id}) on ${conflictDate}`;
              }
            });
          }
        });

        // Also mark inactive employees as unavailable
        employees.forEach((emp) => {
          const empId = normalizeId(emp.id);
          if (empId !== null && !isEmployeeActive(emp)) {
            unavailable[empId] = "Employee is inactive";
          }
        });

        setUnavailableEmployees(unavailable);

        // Show warnings in the modal if there are conflicts
        const busyEmployeeNames = [];
        Object.entries(unavailable).forEach(([empId, reason]) => {
          if (reason.includes("Already assigned")) {
            const emp = employees.find(
              (e) => normalizeId(e.id) === parseInt(empId, 10)
            );
            if (emp) busyEmployeeNames.push(emp.name);
          }
        });

        if (busyEmployeeNames.length > 0) {
          setValidationErrors([
            `Some employees are already assigned to other jobs on this date: ${busyEmployeeNames.join(
              ", "
            )}`,
          ]);
        }
      } catch (err) {
        console.error("Error checking resource availability:", err);
        setValidationErrors([
          `Error checking resource availability: ${
            err.response?.data?.message || err.message
          }`,
        ]);
      }
    } catch (err) {
      console.error("Error preparing assignment modal:", err);
      setValidationErrors([
        `Error preparing assignment modal: ${
          err.response?.data?.message || err.message
        }`,
      ]);
    }

    setShowAssignModal(true);
  };

  // Close assign modal
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedJob(null);
    setValidationErrors([]);
    setUnavailableEmployees({});
    setJobsOnSameDay([]);
  };

  // IMPROVED: Validate resource selection with clearer error handling
  const validateResourceSelection = () => {
    // We'll store warnings separately from blocking errors
    const warnings = [];
    const blockingErrors = [];

    if (selectedJob?.status === "Completed") {
      blockingErrors.push("Cannot assign resources to a completed job");
      setValidationErrors([...warnings, ...blockingErrors]);
      return false;
    }

    // IMPROVED: Check for employee schedule conflicts - using normalized IDs
    // But only if they're actually selected
    const conflictingEmployees = selectedEmployees.filter(
      (id) =>
        unavailableEmployees[id] &&
        unavailableEmployees[id].includes("Already assigned")
    );

    if (conflictingEmployees.length > 0) {
      const employeeNames = conflictingEmployees
        .map((id) => {
          const emp = employees.find((e) => normalizeId(e.id) === id);
          return emp
            ? `${emp.name} (${unavailableEmployees[id]})`
            : `Employee #${id}`;
        })
        .join(", ");

      // This is a blocking error - user explicitly selected unavailable employees
      blockingErrors.push(
        `Cannot assign these employees due to scheduling conflicts: ${employeeNames}`
      );
    }

    // Check for inactive employees specifically - also blocking if selected
    const inactiveEmployees = selectedEmployees.filter((id) => {
      const emp = employees.find((e) => normalizeId(e.id) === id);
      return emp && !isEmployeeActive(emp);
    });

    if (inactiveEmployees.length > 0) {
      const inactiveNames = inactiveEmployees
        .map((id) => {
          const emp = employees.find((e) => normalizeId(e.id) === id);
          return emp ? emp.name : `Employee #${id}`;
        })
        .join(", ");

      blockingErrors.push(`Cannot assign inactive employees: ${inactiveNames}`);
    }

    // Check for unavailable machines (In Maintenance, Retired, or Inactive)
    const unavailableMachines = selectedMachines.filter((id) => {
      const machine = machines.find((m) => normalizeId(m.id) === id);
      return (
        machine &&
        (machine.status === "In Maintenance" ||
          machine.status === "Retired" ||
          machine.status === "Inactive")
      );
    });

    if (unavailableMachines.length > 0) {
      const machineNames = unavailableMachines
        .map((id) => {
          const machine = machines.find((m) => normalizeId(m.id) === id);
          return machine
            ? `${machine.machineName} (${machine.status})`
            : `Machine #${id}`;
        })
        .join(", ");

      blockingErrors.push(`Cannot assign these machines: ${machineNames}`);
    }

    // Combine warnings and blocking errors, but only blocking errors prevent submission
    setValidationErrors([...warnings, ...blockingErrors]);
    return blockingErrors.length === 0;
  };

  // IMPROVED: Handle resource assignment with better error handling and loading state
  const handleAssignResources = async () => {
    // Validate the selection first
    if (!validateResourceSelection()) {
      return; // Stop if there are blocking validation errors
    }

    try {
      setIsSubmitting(true); // Add a loading state

      // IMPROVED: Ensure we're using normalized IDs
      const normalizedJobId = normalizeId(selectedJob.id);
      const normalizedEmployeeIds = selectedEmployees
        .map((id) => normalizeId(id))
        .filter((id) => id !== null);
      const normalizedMachineIds = selectedMachines
        .map((id) => normalizeId(id))
        .filter((id) => id !== null);

      console.log("Sending assignment request:", {
        jobId: normalizedJobId,
        employeeIds: normalizedEmployeeIds,
        machineIds: normalizedMachineIds,
      });

      try {
        const response = await axios.post(
          "http://localhost:4000/api/jobs/assign",
          {
            jobId: normalizedJobId,
            employeeIds: normalizedEmployeeIds,
            machineIds: normalizedMachineIds,
          }
        );

        if (response.data.success) {
          // Show a success message
          alert(
            `Successfully assigned ${response.data.assignedEmployees} employees and ${response.data.assignedMachines} machines`
          );

          // Close the modal
          handleCloseAssignModal();

          // Refresh the job list to show updated status
          fetchJobs();
        }
      } catch (err) {
        console.error("Assignment error:", err);

        // Add debugging for the error
        console.log("Error response:", err.response?.data);

        // Better handling of error responses
        if (err.response?.status === 400) {
          // Handle validation errors from the server
          const serverErrors = [err.response.data.message || "Unknown error"];

          // If the server sent specific conflicting resource data
          if (err.response.data.conflictingEmployees) {
            const conflictingEmployeeNames =
              err.response.data.conflictingEmployees
                .map((emp) => emp.name)
                .join(", ");

            serverErrors.push(
              `Conflicting employees: ${conflictingEmployeeNames}`
            );
          }

          if (err.response.data.inactiveEmployees) {
            const inactiveEmployeeNames = err.response.data.inactiveEmployees
              .map((emp) => emp.name)
              .join(", ");

            serverErrors.push(`Inactive employees: ${inactiveEmployeeNames}`);
          }

          if (err.response.data.unavailableMachines) {
            const unavailableMachineNames =
              err.response.data.unavailableMachines
                .map((machine) => `${machine.machineName} (${machine.status})`)
                .join(", ");

            serverErrors.push(
              `Unavailable machines: ${unavailableMachineNames}`
            );
          }

          setValidationErrors(serverErrors);
        } else if (err.response?.status === 500) {
          // Handle server errors
          setValidationErrors([
            "Server error: " + (err.response.data.message || "Unknown error"),
          ]);
        } else {
          // Handle network or other errors
          setValidationErrors([
            "Error assigning resources: " + (err.message || "Unknown error"),
          ]);
        }
      }
    } catch (err) {
      console.error("Unexpected error in assignment function:", err);
      setValidationErrors(["Unexpected error. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View assigned resources with better error handling
  const handleViewAssignedResources = async (job) => {
    setSelectedJob(job);
    setShowViewModal(true);

    try {
      // Add a check for stale data
      const dataAgeMinutes = (Date.now() - lastDataRefresh) / (1000 * 60);
      if (dataAgeMinutes > 1) {
        console.log("Data is stale, refreshing for resource view");
        await fetchAllData(false);
      }

      const response = await axios.get(
        `http://localhost:4000/api/jobs/assigned/${normalizeId(job.id)}`
      );

      // Normalize employee and machine IDs in the response
      const normalizedEmployees =
        response.data.employees?.map((emp) => ({
          ...emp,
          id: normalizeId(emp.id),
        })) || [];

      const normalizedMachines =
        response.data.machines?.map((machine) => ({
          ...machine,
          id: normalizeId(machine.id),
        })) || [];

      setAssignedResources({
        employees: normalizedEmployees,
        machines: normalizedMachines,
      });
    } catch (err) {
      setError(
        "Error fetching assigned resources: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // Close view modal
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setAssignedResources({ employees: [], machines: [] });
  };

  // Toggle employee selection with better ID handling
  const toggleEmployeeSelection = (empId) => {
    // Ensure we're working with a normalized ID
    const id = normalizeId(empId);

    if (id === null) {
      console.error("Invalid employee ID:", empId);
      return;
    }

    setSelectedEmployees((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  // Toggle machine selection with better ID handling
  const toggleMachineSelection = (machineId) => {
    // Ensure we're working with a normalized ID
    const id = normalizeId(machineId);

    if (id === null) {
      console.error("Invalid machine ID:", machineId);
      return;
    }

    setSelectedMachines((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  // Check if machine is available with a clearer function
  const isMachineAvailable = (machine) => {
    return machine?.status === "Active";
  };

  // IMPROVED: Filter employees with cleaner implementation
  const getFilteredEmployees = () => {
    return employees.filter((emp) => {
      // Skip any null or invalid employees
      if (!emp || emp.id === null) return false;

      const matchesSearch =
        emp.name?.toLowerCase().includes(filterText.toLowerCase()) ||
        emp.position?.toLowerCase().includes(filterText.toLowerCase());

      // Normalize ID
      const empId = normalizeId(emp.id);

      // Check if employee is unavailable (schedule conflict or inactive)
      const hasScheduleConflict =
        empId !== null && unavailableEmployees.hasOwnProperty(empId);

      // Check active status consistently
      const isActive = isEmployeeActive(emp);

      // Filter by tab
      if (activeTab === "available") {
        return matchesSearch && !hasScheduleConflict && isActive;
      } else if (activeTab === "unavailable") {
        return matchesSearch && (hasScheduleConflict || !isActive);
      } else {
        // "all" tab
        return matchesSearch;
      }
    });
  };

  // Filter machines with better ID handling
  const getFilteredMachines = () => {
    return machines.filter((machine) => {
      // Skip any null or invalid machines
      if (!machine || machine.id === null) return false;

      const matchesSearch = machine.machineName
        ?.toLowerCase()
        .includes(filterText.toLowerCase());

      // Check if machine is available
      const isAvailable = isMachineAvailable(machine);

      if (activeTab === "available") {
        return matchesSearch && isAvailable;
      } else if (activeTab === "unavailable") {
        return matchesSearch && !isAvailable;
      } else {
        // all tab
        return matchesSearch;
      }
    });
  };

  // IMPROVED: Render employee cards with clearer unavailable status handling
  const renderEmployeeCards = () => {
    const filteredEmployees = getFilteredEmployees();

    if (filteredEmployees.length === 0) {
      return (
        <Alert variant="info">No employees found matching your criteria.</Alert>
      );
    }

    return (
      <div className="row row-cols-1 row-cols-md-2 g-3">
        {filteredEmployees.map((emp) => {
          // Normalize ID consistently
          const empId = normalizeId(emp.id);

          // Skip invalid IDs
          if (empId === null) return null;

          // Check if employee is unavailable due to scheduling conflict
          const hasScheduleConflict =
            unavailableEmployees.hasOwnProperty(empId);

          // Check if the employee is selected
          const isSelected = selectedEmployees.includes(empId);

          // Check if employee is active consistently
          const isActive = isEmployeeActive(emp);

          // Get reason if unavailable
          const reason = unavailableEmployees[empId];
          const isBusyOnOtherJob =
            reason && reason.includes("Already assigned");

          // Should be disabled?
          const isDisabled = hasScheduleConflict || !isActive;

          return (
            <div key={empId} className="col">
              <Card
                className={`h-100 ${isSelected ? "border-primary" : ""}`}
                style={{
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.75 : 1,
                  borderLeft: isDisabled ? "5px solid #dc3545" : "",
                  backgroundColor: isBusyOnOtherJob ? "#fff5f5" : "",
                }}
                onClick={() => !isDisabled && toggleEmployeeSelection(empId)}
              >
                {/* Lock icon for busy employees */}
                {isBusyOnOtherJob && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      zIndex: 2,
                      backgroundColor: "#dc3545",
                      borderRadius: "50%",
                      padding: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                    }}
                  >
                    <LockFill color="white" size={16} />
                  </div>
                )}

                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{emp.name}</strong>
                      <div className="text-muted small">{emp.position}</div>
                      <div className="mt-1">
                        <Badge
                          bg={isActive ? "success" : "danger"}
                          className="me-1"
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Badge>

                        {isBusyOnOtherJob && (
                          <Badge bg="danger" className="me-1">
                            Locked
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Form.Check
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() =>
                        !isDisabled && toggleEmployeeSelection(empId)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {hasScheduleConflict && (
                    <div className="mt-2 small text-danger">{reason}</div>
                  )}
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="leftpart2">
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: "#1a2142", fontWeight: 600 }}>Job Management</h2>

          {/* Add refresh button */}
          <Button
            variant="outline-primary"
            onClick={handleManualRefresh}
            disabled={refreshingData}
            className="d-flex align-items-center"
          >
            {refreshingData ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Refreshing...
              </>
            ) : (
              <>
                <ArrowClockwise className="me-2" />
                Refresh Data
              </>
            )}
          </Button>
        </div>

        {loading && (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-3">Loading job data...</span>
          </div>
        )}

        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        {!loading && !error && jobs.length === 0 && (
          <Alert variant="info">
            No jobs available. Create a new job to get started.
          </Alert>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <Table striped bordered hover responsive className="mt-3 shadow-sm">
              <thead style={{ backgroundColor: "#f8fafc" }}>
                <tr>
                  <th>Job ID</th>
                  <th>Job Category</th>
                  <th>Job Description</th>
                  <th>Started Date</th>
                  <th>Required Date</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.jobID || job.id}</td>
                    <td>
                      {job.job_category ? (
                        <Badge bg="info" className="text-dark">
                          {job.job_category}
                        </Badge>
                      ) : (
                        <span className="text-muted">Not specified</span>
                      )}
                    </td>
                    <td>{job.job_name}</td>
                    
                    {/* Use consistent date formatting */}
                    <td>{formatDateForDisplay(job.start_date)}</td>
                    <td>{formatDateForDisplay(job.quotation_immediate)}</td>
                    <td>
                      <span
                        className={`badge ${
                          job.status === "Completed"
                            ? "bg-success"
                            : job.status === "In Progress"
                            ? "bg-warning text-dark"
                            : "bg-primary"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleOpenAssignModal(job)}
                        className="me-2"
                        disabled={job.status === "Completed"}
                        style={
                          job.status === "Completed"
                            ? { backgroundColor: "gray", borderColor: "gray" }
                            : {}
                        }
                      >
                        Assign Resources
                      </Button>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleViewAssignedResources(job)}
                      >
                        View Assigned
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {/* Assign Resources Modal */}
        <Modal
          show={showAssignModal}
          onHide={handleCloseAssignModal}
          size="lg"
          dialogClassName="resource-assignment-modal"
        >
          <Modal.Header closeButton className="bg-light">
           
          </Modal.Header>
          <Modal.Body>
            {validationErrors.length > 0 && (
              <Alert variant={getAlertVariant()} className="mb-3">
                <div className="fw-bold mb-2">
                  {hasBlockingErrors()
                    ? "Resource Assignment Errors:"
                    : "Resource Availability Information:"}
                </div>
                <ul className="mb-0">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <div className="d-flex justify-content-between mb-3">
              <div>
                <strong>Job Started Date:</strong>{" "}
                {selectedJob && formatDateForDisplay(selectedJob.start_date)}
              </div>
              <div>
                <strong>Category:</strong>{" "}
                {selectedJob?.job_category || "Not specified"}
              </div>
              <div>
                <strong>Required Date:</strong>{" "}
                {selectedJob &&
                  formatDateForDisplay(selectedJob.quotation_immediate)}
              </div>
            </div>

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              <Tab eventKey="available" title="Available Resources">
                <p className="text-muted small mb-2">
                  Showing resources that are available for this job date
                </p>
              </Tab>
              <Tab eventKey="unavailable" title="Unavailable Resources">
                <p className="text-muted small mb-2">
                  Showing resources that are not available for this job date
                </p>
              </Tab>
              <Tab eventKey="all" title="All Resources">
                <p className="text-muted small mb-2">
                  Showing all resources regardless of availability
                </p>
              </Tab>
            </Tabs>

            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Search resources by name or position..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </Form.Group>

            <div className="mb-4">
              <h5 className="mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
                <span>Employees</span>
                <span className="badge bg-primary">
                  {selectedEmployees.length} Selected
                </span>
              </h5>

              {renderEmployeeCards()}
            </div>

            <div className="mb-3">
              <h5 className="mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
                <span>Machines</span>
                <span className="badge bg-primary">
                  {selectedMachines.length} Selected
                </span>
              </h5>

              {renderMachineCards()}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="d-flex justify-content-between w-100">
              <div>
                <span className="me-3">
                  <Badge bg="success">
                    {
                      employees.filter((emp) => {
                        const empId = normalizeId(emp.id);
                        return (
                          empId !== null &&
                          isEmployeeActive(emp) &&
                          !unavailableEmployees[empId]
                        );
                      }).length
                    }{" "}
                    Available Employees
                  </Badge>
                </span>
                <span>
                  <Badge bg="success">
                    {
                      machines.filter((machine) => isMachineAvailable(machine))
                        .length
                    }{" "}
                    Available Machines
                  </Badge>
                </span>
              </div>
              <div>
                <Button
                  variant="secondary"
                  onClick={handleCloseAssignModal}
                  className="me-2"
                >
                  Cancel
                </Button>
                {selectedJob &&
                assignedResources &&
                (assignedResources.employees.length > 0 ||
                  assignedResources.machines.length > 0) ? (
                  // Show "Update" button if the job already has resources
                  <Button
                    variant="primary"
                    onClick={handleUpdateResources}
                    disabled={
                      hasBlockingErrors() ||
                      (selectedEmployees.length === 0 &&
                        selectedMachines.length === 0) ||
                      isSubmitting
                    }
                    style={{
                      backgroundColor: "#1a2142",
                      borderColor: "#1a2142",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Updating...
                      </>
                    ) : (
                      `Add Selected (${
                        selectedEmployees.length + selectedMachines.length
                      })`
                    )}
                  </Button>
                ) : (
                  // Show "Assign" button for initial assignment
                  <Button
                    variant="primary"
                    onClick={handleAssignResources}
                    disabled={
                      hasBlockingErrors() ||
                      (selectedEmployees.length === 0 &&
                        selectedMachines.length === 0) ||
                      isSubmitting
                    }
                    style={{
                      backgroundColor: "#1a2142",
                      borderColor: "#1a2142",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Assigning...
                      </>
                    ) : (
                      `Assign Selected (${
                        selectedEmployees.length + selectedMachines.length
                      })`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Modal.Footer>
        </Modal>

        {/* View Assigned Resources Modal - with resource removal capabilities */}
        <Modal show={showViewModal} onHide={handleCloseViewModal} size="lg">
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              Resources Assigned to: <strong>{selectedJob?.job_name}</strong>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex justify-content-between mb-3">
              <div>
                <strong>Job Started Date:</strong>{" "}
                {selectedJob && formatDateForDisplay(selectedJob.start_date)}
              </div>
              <div>
                <strong>Required Date:</strong>{" "}
                {selectedJob &&
                  formatDateForDisplay(selectedJob.quotation_immediate)}
              </div>
            </div>

            <div className="mb-4">
              <h5 className="mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
                <span>Employees ({assignedResources.employees.length})</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAssignModal(selectedJob)}
                  disabled={selectedJob?.status === "Completed"}
                >
                  Add More Resources
                </Button>
              </h5>
              {assignedResources.employees.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Assignments</th>
                      <th>Last Assigned</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedResources.employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>{emp.name}</td>
                        <td>{emp.position}</td>
                        <td>{emp.assignments_count}</td>
                        <td>
                          {emp.last_assigned_at
                            ? new Date(emp.last_assigned_at).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="text-center">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleRemoveResources(
                                selectedJob.id,
                                [emp.id],
                                []
                              )
                            }
                            disabled={
                              selectedJob?.status === "Completed" ||
                              isSubmitting
                            }
                          >
                            {isSubmitting ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                              />
                            ) : (
                              "Remove"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">No employees assigned to this job</Alert>
              )}
            </div>

            <div className="mb-3">
              <h5 className="mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
                <span>Machines ({assignedResources.machines.length})</span>
              </h5>
              {assignedResources.machines.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead className="bg-light">
                    <tr>
                      <th>Machine</th>
                      <th>Status</th>
                      <th>Assignments</th>
                      <th>Last Assigned</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedResources.machines.map((machine) => (
                      <tr key={machine.id}>
                        <td>{machine.machineName}</td>
                        <td>
                          <Badge
                            bg={
                              machine.status === "Active"
                                ? "success"
                                : machine.status === "In Maintenance"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {machine.status}
                          </Badge>
                        </td>
                        <td>{machine.assignments_count}</td>
                        <td>
                          {machine.last_assigned_at
                            ? new Date(
                                machine.last_assigned_at
                              ).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="text-center">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleRemoveResources(
                                selectedJob.id,
                                [],
                                [machine.id]
                              )
                            }
                            disabled={
                              selectedJob?.status === "Completed" ||
                              isSubmitting
                            }
                          >
                            {isSubmitting ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                              />
                            ) : (
                              "Remove"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">No machines assigned to this job</Alert>
              )}
            </div>

            {/* Add a section for bulk operations if needed */}
            {(assignedResources.employees.length > 0 ||
              assignedResources.machines.length > 0) && (
              <div className="mt-3 pb-3 pt-2 border-top">
                <h6 className="mb-3">Bulk Operations</h6>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      // Get all employee and machine IDs
                      const allEmployeeIds = assignedResources.employees.map(
                        (emp) => emp.id
                      );
                      const allMachineIds = assignedResources.machines.map(
                        (machine) => machine.id
                      );
                      handleRemoveResources(
                        selectedJob.id,
                        allEmployeeIds,
                        allMachineIds
                      );
                    }}
                    disabled={
                      selectedJob?.status === "Completed" || isSubmitting
                    }
                  >
                    Remove All Resources
                  </Button>

                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      handleCloseViewModal();
                      handleOpenAssignModal(selectedJob);
                    }}
                    disabled={selectedJob?.status === "Completed"}
                  >
                    Manage Resources
                  </Button>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseViewModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default JobManagement;
