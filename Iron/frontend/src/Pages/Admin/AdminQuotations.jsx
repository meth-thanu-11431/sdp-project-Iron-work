import { Button, Col, Form, Modal, Row, Table, Alert, Spinner } from "react-bootstrap";
import React, { useEffect, useState } from "react";

const AdminQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [status, setStatus] = useState("Pending");
  const [stockErrors, setStockErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  // Track quotations that already have invoices
  const [quotationsWithInvoices, setQuotationsWithInvoices] = useState([]);
  // Add loading state for invoice creation
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Fetch Quotations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch quotations
        const response = await fetch(
          "http://localhost:4000/api/quotation/admin"
        );
        const data = await response.json();
        if (data.success) {
          setQuotations(data.quotations);
          
          // Fetch all invoices to check which quotations already have invoices
          const invoicesResponse = await fetch(
            "http://localhost:4000/api/quotation/get_all"
          );
          const invoicesData = await invoicesResponse.json();
          
          if (invoicesData.success && invoicesData.invoices) {
            // Create an array of quotation IDs that already have invoices
            const quotationIdsWithInvoices = invoicesData.invoices.map(
              invoice => invoice.quotation_id
            );
            setQuotationsWithInvoices(quotationIdsWithInvoices);
          }
        } else {
          console.error("Failed to fetch quotations:", data.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Fetch Materials
  const fetchMaterials = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/material/get_all"
      );
      const data = await response.json();
      if (data.success) {
        // Sort materials by name for easier selection
        const sortedMaterials = data.materials.sort((a, b) =>
          a.itemName.localeCompare(b.itemName)
        );
        setMaterials(sortedMaterials);

        if (sortedMaterials.length > 0) {
          // Initialize with the first material from the sorted list
          setInvoiceItems([
            {
              material_name: sortedMaterials[0].itemName,
              quantity: 1,
              unit_price: sortedMaterials[0].unitPrice,
              material_id: sortedMaterials[0].id,
              available_qty: sortedMaterials[0].availableQty,
            },
          ]);
        }
      } else {
        console.error("Failed to fetch materials:", data.message);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const handleUpdateClick = (quotation) => {
    setCurrentQuotation(quotation);
    setStatus(quotation.status); // Set the current status
    setJobDescription(quotation.job_description || ""); // Set job description (will be read-only)
    setShowModal(true);
    setSubmissionError("");
    fetchMaterials();
  };

  // Check if quotation already has an invoice
  const hasInvoice = (quotationId) => {
    return quotationsWithInvoices.includes(quotationId);
  };

  // Direct invoice creation function - no modal, just create the invoice
  const handleCreateInvoiceClick = async (quotation) => {
    // Check if invoice already exists for this quotation
    if (hasInvoice(quotation.id)) {
      alert("An invoice already exists for this quotation. Cannot create another invoice.");
      return;
    }
    
    try {
      // Show confirmation dialog
      if (
        !window.confirm(
          "Are you sure you want to create an invoice for this quotation?"
        )
      ) {
        return;
      }

      setCreatingInvoice(true);

      // First, try to retrieve saved materials for this quotation
      let materialsForInvoice = [];
      try {
        // Try to get materials from localStorage if they exist
        const savedMaterialsString = localStorage.getItem(
          `quotation_${quotation.id}_materials`
        );
        if (savedMaterialsString) {
          materialsForInvoice = JSON.parse(savedMaterialsString);
          console.log("Retrieved saved materials:", materialsForInvoice);
        } else {
          // If no saved materials, fetch materials for initialization
          await fetchMaterials();
          materialsForInvoice = invoiceItems;
          console.log("Using default materials:", materialsForInvoice);
        }
      } catch (materialError) {
        console.error("Error retrieving saved materials:", materialError);
        // Fallback to fetching materials
        await fetchMaterials();
        materialsForInvoice = invoiceItems;
      }

      // If we still don't have materials, show an error
      if (!materialsForInvoice || materialsForInvoice.length === 0) {
        alert(
          "Unable to retrieve materials for this quotation. Please update the quotation first."
        );
        setCreatingInvoice(false);
        return;
      }

      // Create invoice directly
      const invoiceData = {
        quotationId: quotation.id,
        invoiceAmount: parseFloat(quotation.quotation_amount || 0),
        materials: materialsForInvoice.map((item) => ({
          material_name: item.material_name,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          material_id: item.material_id,
        })),
      };

      console.log("Sending invoice creation request:", invoiceData);

      const invoiceResponse = await fetch(
        "http://localhost:4000/api/quotation/invoice_create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoiceData),
        }
      );

      const responseData = await invoiceResponse.json();

      if (invoiceResponse.status === 201 || responseData.success) {
        // Now reduce the stock of materials
        await reduceMaterialStock(materialsForInvoice);
        alert("Invoice created successfully!");

        // Add this quotation ID to our list of quotations with invoices
        setQuotationsWithInvoices([...quotationsWithInvoices, quotation.id]);

        // Refresh the quotations list
        const refreshResponse = await fetch(
          "http://localhost:4000/api/quotation/admin"
        );
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setQuotations(refreshData.quotations);
        }
      } else {
        throw new Error(responseData.message || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Error creating invoice: " + (error.message || "Unknown error"));
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setInvoiceItems([]);
    setStockErrors({});
    setSubmissionError("");
  };

  const handleMaterialChange = (index, event) => {
    const { name, value } = event.target;
    const updatedItems = [...invoiceItems];

    if (name === "material_name") {
      const selectedMaterial = materials.find((m) => m.itemName === value);
      if (selectedMaterial) {
        updatedItems[index] = {
          ...updatedItems[index],
          material_name: value,
          material_id: selectedMaterial.id,
          unit_price: selectedMaterial.unitPrice,
          available_qty: selectedMaterial.availableQty,
        };
      }
    } else {
      updatedItems[index][name] =
        name === "quantity" || name === "unit_price"
          ? parseFloat(value)
          : value;
    }

    setInvoiceItems(updatedItems);

    // Check stock when quantity changes or material changes
    if (name === "quantity" || name === "material_name") {
      checkStockAvailability(index, updatedItems[index]);
    }
  };

  const checkStockAvailability = (index, item) => {
    const material = materials.find((m) => m.id === item.material_id);

    if (material && item.quantity > material.availableQty) {
      setStockErrors((prev) => ({
        ...prev,
        [index]: `Only ${material.availableQty} available in stock`,
      }));
    } else {
      setStockErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const calculateSubTotal = () => {
    return invoiceItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return total + quantity * unitPrice;
    }, 0);
  };

  const calculateLaborCost = () => {
    return calculateSubTotal() * 0.1;
  };

  const calculateMachineCost = () => {
    return calculateSubTotal() * 0.08;
  };

  const calculateTotalCost = () => {
    return calculateSubTotal() + calculateLaborCost() + calculateMachineCost();
  };

  const validateForm = () => {
    // Check for stock errors
    if (Object.keys(stockErrors).length > 0) {
      setSubmissionError(
        "Please correct the quantities that exceed available stock"
      );
      return false;
    }

    // Check for empty materials list when approving
    if (
      status === "Approved" &&
      (!invoiceItems.length || invoiceItems.some((item) => !item.material_name))
    ) {
      setSubmissionError(
        "Please add at least one material to create a quotation"
      );
      return false;
    }

    // Check for zero quantities
    if (
      status === "Approved" &&
      invoiceItems.some((item) => !item.quantity || item.quantity <= 0)
    ) {
      setSubmissionError(
        "Quantity must be greater than zero for all materials"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      // First update the quotation amount when approving (sending to customer)
      if (status === "Approved") {
        const totalAmount = calculateTotalCost();

        // Update quotation amount
        await fetch("http://localhost:4000/api/quotation/update_amount", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quotationId: currentQuotation.id,
            quotation_amount: totalAmount,
          }),
        });

        // Store materials for later invoice creation
        // This would ideally be saved in the database, but for now we could use localStorage
        const materialsToStore = invoiceItems.map((item) => ({
          material_id: item.material_id,
          material_name: item.material_name,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
        }));

        localStorage.setItem(
          `quotation_${currentQuotation.id}_materials`,
          JSON.stringify(materialsToStore)
        );

        // Save materials for the quotation
        for (const item of invoiceItems) {
          await fetch("http://localhost:4000/api/quotation/save_material", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quotationId: currentQuotation.id,
              material_name: item.material_name,
              quantity: parseFloat(item.quantity),
              unit_price: parseFloat(item.unit_price),
              material_id: item.material_id,
            }),
          });
        }
      }

      // Update the quotation status
      const statusResponse = await fetch(
        "http://localhost:4000/api/quotation/status",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            quotationId: currentQuotation.id,
          }),
        }
      );

      const statusData = await statusResponse.json();
      if (!statusData.success) {
        throw new Error(
          statusData.message || "Failed to update quotation status"
        );
      }

      // Display appropriate message based on the action
      if (status === "Approved") {
        alert("Quotation has been sent to customer for approval.");
      } else if (status === "Rejected") {
        alert("Quotation has been rejected.");
      } else {
        alert("Quotation status updated to Pending.");
      }

      // Refresh the quotations list
      const refreshResponse = await fetch(
        "http://localhost:4000/api/quotation/admin"
      );
      const refreshData = await refreshResponse.json();
      if (refreshData.success) {
        setQuotations(refreshData.quotations);
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error processing quotation:", error);
      setSubmissionError(
        error.message || "An error occurred while processing the quotation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reduceMaterialStock = async (items) => {
    try {
      console.log("Reducing stock for items:", JSON.stringify(items));

      // Process each material sequentially to avoid race conditions
      for (const item of items) {
        try {
          console.log(
            `Starting stock reduction for material ID: ${item.material_id}`
          );

          // First, get the current stock level to ensure accuracy
          const stockResponse = await fetch(
            `http://localhost:4000/api/material/get_one/${item.material_id}`
          );
          console.log(`Get material response status: ${stockResponse.status}`);

          const stockData = await stockResponse.json();
          console.log(`Stock data received:`, stockData);

          if (!stockData.success || !stockData.material) {
            console.error(
              `Error fetching current stock for material ${
                item.material_id
              }: ${JSON.stringify(stockData)}`
            );
            continue;
          }

          const currentStock = parseFloat(stockData.material.availableQty);
          const quantity = parseFloat(item.quantity);
          const newStock = Math.max(0, currentStock - quantity); // Ensure stock doesn't go negative

          console.log(
            `Material ${item.material_id} (${stockData.material.itemName}):`
          );
          console.log(`- Current stock: ${currentStock}`);
          console.log(`- Quantity used: ${quantity}`);
          console.log(`- New stock should be: ${newStock}`);

          // Update the material stock - try both endpoints to see which one works
          console.log(
            `Sending update to /api/material/update_quantity endpoint`
          );

          const updateResponse = await fetch(
            "http://localhost:4000/api/material/update_quantity",
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: item.material_id,
                availableQty: newStock,
              }),
            }
          );

          console.log(`Update response status: ${updateResponse.status}`);
          const updateData = await updateResponse.json();
          console.log(`Update response data:`, updateData);

          if (!updateData.success) {
            console.error(
              `Error updating stock for material ${item.material_id}:`,
              updateData.message
            );
            console.log(`Trying alternate endpoint /api/material/update_all`);

            // Try the alternate endpoint if the first one fails
            const altUpdateResponse = await fetch(
              "http://localhost:4000/api/material/update_all",
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: item.material_id,
                  availableQty: newStock,
                }),
              }
            );

            console.log(
              `Alt update response status: ${altUpdateResponse.status}`
            );
            const altUpdateData = await altUpdateResponse.json();
            console.log(`Alt update response data:`, altUpdateData);

            if (!altUpdateData.success) {
              console.error(
                `Error updating stock with alternate endpoint:`,
                altUpdateData.message
              );
            }
          } else {
            console.log(
              `Successfully updated stock for material ${item.material_id} to ${newStock}`
            );
          }
        } catch (itemError) {
          console.error(
            `Error processing stock reduction for material ${item.material_id}:`,
            itemError
          );
        }
      }

      console.log("Stock update process completed.");
    } catch (error) {
      console.error("Error in reduceMaterialStock function:", error);
    }
  };

  // Function to get status badge
  const getStatusBadge = (status) => {
    if (!status) return <span className="badge bg-warning">Pending</span>;

    switch (status) {
      case "Approved":
        return <span className="badge bg-success">Approved</span>;
      case "Rejected":
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-warning">Pending</span>;
    }
  };

  return (
    <div className="p-4 leftpart">
      <h2 className="mb-4" style={{ color: "#1a2142", fontWeight: 600 }}>
        Quotation Management
      </h2>

      {/* Search Bar */}
      <Form className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search by customer name, job category or job ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form>

      {quotations.length === 0 ? (
        <Alert variant="info">No quotations found.</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="bg-light">
            <tr>
              <th>Job ID</th>
              <th>Quotation ID</th>
              <th>Customer Name</th>
              <th>Job Category</th>
              <th>Admin Status</th>
              <th>Customer Status</th>
              <th>Quotation Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations
              .filter((quotation) => {
                const search = (searchTerm || "").toLowerCase();
                const idStr = String(quotation.id ?? "").toLowerCase();
                // Use fallback empty strings for all fields
                const customerName = (
                  quotation.customer_name || ""
                ).toLowerCase();
                const jobID = (quotation.jobID || "").toLowerCase();
                const jobCategory = (
                  quotation.job_category || ""
                ).toLowerCase();
                return (
                  customerName.includes(search) ||
                  jobID.includes(search) ||
                  idStr.includes(search) ||
                  `qid ${idStr}`.includes(search) ||
                  jobCategory.includes(search)
                );
              })
              .map((quotation) => (
                <tr key={quotation.id}>
                  <td>{quotation.jobID}</td>
                  <td>QID {quotation.id}</td>
                  <td>{quotation.customer_name}</td>
                  <td>{quotation.job_category}</td>
                  <td>{getStatusBadge(quotation.status)}</td>
                  <td>{getStatusBadge(quotation.customer_status)}</td>
                  <td>
                    LKR {parseFloat(quotation.quotation_amount || 0).toFixed(2)}
                  </td>
                  <td>{new Date(quotation.created_at).toLocaleDateString()}</td>
                  <td>
                    {quotation.status === "Approved" &&
                    quotation.customer_status === "Approved" ? (
                      // Disable the button if an invoice already exists for this quotation
                      <Button
                        variant={hasInvoice(quotation.id) ? "secondary" : "success"}
                        onClick={() => !hasInvoice(quotation.id) && handleCreateInvoiceClick(quotation)}
                        disabled={hasInvoice(quotation.id) || creatingInvoice}
                      >
                        {creatingInvoice ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Creating...
                          </>
                        ) : hasInvoice(quotation.id) ? (
                          "Invoice Created"
                        ) : (
                          "Create Invoice"
                        )}
                      </Button>
                    ) : (
                      // Show Update button in all other cases
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateClick(quotation)}
                        disabled={
                          quotation.status === "Rejected" ||
                          quotation.customer_status === "Rejected"
                        }
                        style={{
                          backgroundColor:
                            quotation.status === "Rejected" ||
                            quotation.customer_status === "Rejected"
                              ? "#6c757d"
                              : "#1a2142",
                          borderColor:
                            quotation.status === "Rejected" ||
                            quotation.customer_status === "Rejected"
                              ? "#6c757d"
                              : "#1a2142",
                        }}
                      >
                        {quotation.status === "Rejected" ||
                        quotation.customer_status === "Rejected"
                          ? "Processed"
                          : "Update"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      )}

      {/* Update Quotation Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update Quotation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submissionError && (
            <Alert variant="danger" className="mb-3">
              {submissionError}
            </Alert>
          )}

          <Form>
            <Form.Group controlId="quotationDetails" className="mb-3">
              <p>
                <strong>Customer:</strong> {currentQuotation?.customer_name}
              </p>
              <p>
                <strong>Job Category:</strong> {currentQuotation?.job_category}
              </p>
              <p>
                <strong>Customer Status:</strong>{" "}
                {getStatusBadge(currentQuotation?.customer_status)}
                {currentQuotation?.customer_status === "Approved" && (
                  <span className="text-success ms-2">
                    <i className="fas fa-check-circle"></i> Customer has
                    approved this quotation
                  </span>
                )}
                {currentQuotation?.customer_status === "Rejected" && (
                  <span className="text-danger ms-2">
                    <i className="fas fa-times-circle"></i> Customer has
                    rejected this quotation
                  </span>
                )}
              </p>
            </Form.Group>
            <Form.Group controlId="jobDescriptionView">
              <Form.Label>
                <strong>Job Description:</strong>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Enter job description"
              />
            </Form.Group>
            <Form.Group controlId="status" className="mb-4">
              <Form.Label>Status</Form.Label>
              <Form.Control
                as="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Control>
              {status === "Approved" && (
                <Alert variant="info" className="mt-2">
                  <small>
                    <i className="fas fa-info-circle"></i> This will prepare the
                    quotation for customer approval. You can only create an
                    invoice after the customer approves.
                  </small>
                </Alert>
              )}
            </Form.Group>

            {status === "Approved" && (
              <>
                <h5 className="mb-3">Quotation Materials</h5>
                {invoiceItems.map((material, index) => (
                  <div key={index} className="mb-3 p-3 border rounded bg-light">
                    <Row className="align-items-end">
                      <Col md={4}>
                        <Form.Group controlId={`materialName${index}`}>
                          <Form.Label>Material</Form.Label>
                          <Form.Select
                            name="material_name"
                            value={material.material_name}
                            onChange={(e) => handleMaterialChange(index, e)}
                          >
                            {materials.map((mat) => (
                              <option
                                key={mat.id}
                                value={mat.itemName}
                                disabled={mat.availableQty <= 0}
                              >
                                {mat.itemName} (Stock: {mat.availableQty})
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={2}>
                        <Form.Group controlId={`materialQuantity${index}`}>
                          <Form.Label>Quantity</Form.Label>
                          <Form.Control
                            type="number"
                            name="quantity"
                            min="1"
                            max={material.available_qty}
                            value={material.quantity}
                            onChange={(e) => handleMaterialChange(index, e)}
                            isInvalid={!!stockErrors[index]}
                          />
                          <Form.Control.Feedback type="invalid">
                            {stockErrors[index]}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group controlId={`materialUnitPrice${index}`}>
                          <Form.Label>Unit Price (LKR)</Form.Label>
                          <Form.Control
                            type="number"
                            name="unit_price"
                            value={material.unit_price}
                            onChange={(e) => handleMaterialChange(index, e)}
                            step="0.01"
                            min="0"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2}>
                        <Form.Group>
                          <Form.Label>Subtotal</Form.Label>
                          <Form.Control
                            plaintext
                            readOnly
                            value={`LKR ${(
                              material.quantity * material.unit_price
                            ).toFixed(2)}`}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={1} className="text-end">
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (invoiceItems.length > 1) {
                              setInvoiceItems(
                                invoiceItems.filter((_, i) => i !== index)
                              );
                              setStockErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors[index];
                                return newErrors;
                              });
                            } else {
                              alert("You must have at least one material item");
                            }
                          }}
                          disabled={invoiceItems.length <= 1}
                        >
                          ×
                        </Button>
                      </Col>
                    </Row>
                  </div>
                ))}

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button
                    variant="success"
                    onClick={() => {
                      if (materials.length > 0) {
                        const availableMaterials = materials.filter(
                          (m) => m.availableQty > 0
                        );
                        if (availableMaterials.length > 0) {
                          setInvoiceItems([
                            ...invoiceItems,
                            {
                              material_name: availableMaterials[0].itemName,
                              quantity: 1,
                              unit_price: availableMaterials[0].unitPrice,
                              material_id: availableMaterials[0].id,
                              available_qty: availableMaterials[0].availableQty,
                            },
                          ]);
                        } else {
                          alert("No materials with available stock to add");
                        }
                      } else {
                        alert("No materials available to add");
                      }
                    }}
                  >
                    Add Material
                  </Button>
                  {/* Subtotal, Labor, Machine, and Total Cost Display */}
                  <div>
                    <div>
                      <strong>Subtotal:</strong> LKR{" "}
                      {calculateSubTotal().toFixed(2)}
                    </div>
                    <div>
                      <strong>Labor Cost (10%):</strong> LKR{" "}
                      {calculateLaborCost().toFixed(2)}
                    </div>
                    <div>
                      <strong>Machine Cost (8%):</strong> LKR{" "}
                      {calculateMachineCost().toFixed(2)}
                    </div>
                    <div>
                      <strong>Total Cost:</strong> LKR{" "}
                      {calculateTotalCost().toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (status === "Approved" && Object.keys(stockErrors).length > 0)
            }
            style={{
              backgroundColor: "#1a2142",
              borderColor: "#1a2142",
            }}
          >
            {isSubmitting
              ? "Processing..."
              : status === "Approved"
              ? "Send Quotation to Customer"
              : status === "Rejected"
              ? "Reject Quotation"
              : "Update"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminQuotations;