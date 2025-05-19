import { getTopSellingItems } from "../models/reportModel.js";


export const getTodayTopSellingItems = async (req, res) => {
    try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const topSellingItems = await getTopSellingItems(startDate, endDate);
        res.status(200).json(topSellingItems);
    } catch (error) {
        console.error('Error getting top selling items for today:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getLast3DaysTopSellingItems = async (req, res) => {
    try {
        const today = new Date();
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
        const topSellingItems = await getTopSellingItems(startDate, endDate);
        res.status(200).json(topSellingItems);
    } catch (error) {
        console.error('Error getting top selling items for last 3 days:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getLastWeekTopSellingItems = async (req, res) => {
    try {
        const today = new Date();
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        const topSellingItems = await getTopSellingItems(startDate, endDate);
        res.status(200).json(topSellingItems);
    } catch (error) {
        console.error('Error getting top selling items for last week:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};