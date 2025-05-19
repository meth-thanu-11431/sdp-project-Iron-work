import pool from '../config/db.js';

// Function to add a material
export const addMaterial = async (req, res) => {
  try {
    const { itemName, availableQty, unitPrice } = req.body;

    // Validation
    if (!itemName || !availableQty || !unitPrice) {
      return res.status(400).json({ 
        success: false, 
        message: 'Material name, quantity, and price are required.' 
      });
    }

    // Insert material information into the database
    const [materialResult] = await pool.query(
      'INSERT INTO materials (item_name, available_qty, unit_price) VALUES (?, ?, ?)',
      [itemName, availableQty, unitPrice]
    );

    const materialId = materialResult.insertId;

    // Insert images into the database (if any)
    if (req.files && req.files.length > 0) {
      const imageDetails = req.files.map((file) => ({
        path: file.path,
        type: file.mimetype,
        filename: file.filename,
      }));

      for (const image of imageDetails) {
        await pool.query(
          'INSERT INTO material_images (material_id, file_path, file_type, file_name) VALUES (?, ?, ?, ?)',
          [materialId, image.path, image.type, image.filename]
        );
      }
    }

    res.json({
      success: true,
      message: 'Material added successfully!',
      material: {
        id: materialId,
        itemName,
        availableQty,
        unitPrice,
        images: req.files ? req.files.map((file) => file.path) : [],
      },
    });
  } catch (error) {
    console.error('Error adding material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add the material. Please try again.',
      error: error.message,
    });
  }
};


export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Material ID is required.' });
    }
    
    const [material] = await pool.query('SELECT * FROM materials WHERE id = ?', [id]);
    
    if (material.length === 0) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }
    
    res.json({
      success: true,
      material: {
        id: material[0].id,
        itemName: material[0].item_name,
        availableQty: material[0].available_qty,
        unitPrice: material[0].unit_price
      }
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch material. Please try again.',
      error: error.message,
    });
  }
};

// Function to list all materials
export const getAllMaterials = async (req, res) => {
  try {
    // Updated query to remove item_id reference
    const [materialsData] = await pool.query(`
      SELECT 
        m.id, 
        m.item_name, 
        m.available_qty, 
        m.unit_price, 
        mi.file_name 
      FROM 
        materials m 
      LEFT JOIN 
        material_images mi ON m.id = mi.material_id
    `);

    // Group materials with their images
    const groupedMaterials = materialsData.reduce((acc, material) => {
      if (!acc[material.id]) {
        acc[material.id] = {
          id: material.id,
          itemName: material.item_name,
          availableQty: material.available_qty,
          unitPrice: material.unit_price,
          images: [],
        };
      }

      if (material.file_name) {
        acc[material.id].images.push(material.file_name);
      }

      return acc;
    }, {});

    const materialsList = Object.values(groupedMaterials);

    res.json({
      success: true,
      message: 'Materials fetched successfully',
      materials: materialsList,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials. Please try again.',
      error: error.message,
    });
  }
};

// Function to update material's quantity and unit price
export const updateMaterial = async (req, res) => {
  try {
    const { id, availableQty, unitPrice } = req.body;

    if (!id || availableQty === undefined || unitPrice === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID, Quantity, and Price are required.' 
      });
    }

    // Update material details
    const [updateResult] = await pool.query(
      'UPDATE materials SET available_qty = ?, unit_price = ? WHERE id = ?',
      [availableQty, unitPrice, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Material not found.' 
      });
    }

    res.json({
      success: true,
      message: 'Material updated successfully!',
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material. Please try again.',
      error: error.message,
    });
  }
};

// Function to delete a material
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID is required to delete material.' 
      });
    }

    // Delete associated images first
    await pool.query('DELETE FROM material_images WHERE material_id = ?', [id]);

    // Delete the material
    const [deleteResult] = await pool.query('DELETE FROM materials WHERE id = ?', [id]);

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Material not found.' 
      });
    }

    res.json({
      success: true,
      message: 'Material deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete material. Please try again.',
      error: error.message,
    });
  }
};

// Fetch all materials (simplified version for dropdowns/lists)
export const fetchAllMaterials = async (req, res) => {
  try {
    // Updated query to remove item_id
    const [materials] = await pool.query(
      'SELECT id, item_name, available_qty, unit_price FROM materials'
    );

    // Transform field names to camelCase for frontend consistency
    const formattedMaterials = materials.map(material => ({
      id: material.id,
      itemName: material.item_name,
      availableQty: material.available_qty,
      unitPrice: material.unit_price
    }));

    res.json({
      success: true,
      message: 'Materials fetched successfully',
      materials: formattedMaterials,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials. Please try again.',
      error: error.message,
    });
  }
};

// Update only material quantity
export const updateMaterialQuantity = async (req, res) => {
  try {
    const { id, availableQty } = req.body;

    if (!id || availableQty === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID and Quantity are required.' 
      });
    }

    // Update only the quantity
    const [updateResult] = await pool.query(
      'UPDATE materials SET available_qty = ? WHERE id = ?',
      [availableQty, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Material not found.' 
      });
    }

    res.json({
      success: true,
      message: 'Material quantity updated successfully!',
    });
  } catch (error) {
    console.error('Error updating material quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material quantity. Please try again.',
      error: error.message,
    });
  }
};