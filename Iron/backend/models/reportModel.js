import pool from "../config/db.js";



const getTopSellingItems = async (startDate, endDate) => {
    const TOP_SELLING_QUERY = `
        SELECT FoodID, SUM(quantity) AS totalQuantity
        FROM report
        WHERE DATE(date) BETWEEN ? AND ?
        GROUP BY FoodID
        ORDER BY totalQuantity DESC
        LIMIT 32;
    `;

    try {
        const [rows] = await pool.query(TOP_SELLING_QUERY, [startDate, endDate]);
        return rows;
    } catch (error) {
        console.error('Error fetching top selling items:', error);
        throw error;
    }
};
export { getTopSellingItems };
