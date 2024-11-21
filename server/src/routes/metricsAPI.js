const express = require('express');
const router = express.Router();
const moment = require('moment-timezone')
const AWS = require('aws-sdk')

// Configure the SDK with your AWS region
AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRETACCESSKEY,
    region: 'us-east-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Helper function to get the start and end dates for different time intervals
const getDateRange = (interval) => {
    const now = new Date();
    let startDate;

    if (interval === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (interval === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (interval === 'year') {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    } else {
        throw new Error("Invalid interval; please use 'week', 'month', or 'year'");
    }

    // Format dates as 'YYYY-MM-DD HH:MM:SS'
    const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

    return { startDate: formatDate(startDate), endDate: formatDate(new Date()) };
};

// Helper function to calculate default weekly range
const getDefaultDateRange = () => {
    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);

    const formatDate = (date) => date.toISOString();
    return { startDate: formatDate(lastWeek), endDate: formatDate(now) };
};

module.exports = (db) => {
    // GET endpoint to retrieve users
    router.get('/analytics', (req, res) => {
        const query = `
            SELECT meal, SUM(mealCount) as total
            FROM orders
            GROUP BY meal
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error querying the database:', err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                const mealCounts = {
                    breakfast: 0,
                    lunch: 0,
                    dinner: 0
                };

                rows.forEach(row => {
                    if (row.meal === 'breakfast') {
                        mealCounts.breakfast = row.total;
                    } else if (row.meal === 'lunch') {
                        mealCounts.lunch = row.total;
                    } else if (row.meal === 'dinner') {
                        mealCounts.dinner = row.total;
                    }
                });

                res.json(mealCounts);
            }
        });
    });

    router.get('/meal-count/:interval', async (req, res) => {
        const { interval } = req.params;
        const { startDate, endDate } = getDateRange(interval);

        // Define DynamoDB Scan parameters with FilterExpression
        const params = {
            TableName: 'mealtracker', // Your DynamoDB table name
            FilterExpression: 'created_at BETWEEN :start AND :end',
            ExpressionAttributeValues: {
                ':start': startDate,
                ':end': endDate,
            },
        };

        try {
            // Perform the scan operation
            const data = await dynamoDB.scan(params).promise();

            // Aggregate meal counts by meal type
            const mealCounts = data.Items.reduce((acc, item) => {
                const meal = item.meal;
                const mealCount = Number(item.mealCount) || 0; // Convert to number
                acc[meal] = (acc[meal] || 0) + mealCount;      // Ensure numeric addition
                return acc;
            }, {});

            // Respond with the result
            res.json({
                interval,
                startDate,
                endDate,
                mealCounts
            });
        } catch (err) {
            console.error("Error fetching meal counts from DynamoDB:", err);
            res.status(500).json({ error: "Failed to fetch meal counts" });
        }
    });

    router.get('/meal-analytics', async (req, res) => {
        try {
            const { startDate, endDate, limit = 10, lastEvaluatedKey } = req.query;

            // Use default weekly range if startDate or endDate is not provided
            const range = getDefaultDateRange();
            const queryStartDate = startDate || range.startDate;
            const queryEndDate = endDate || range.endDate;

            // Define the DynamoDB query parameters
            const params = {
                TableName: 'mealtracker',
                FilterExpression: 'created_at BETWEEN :startDate AND :endDate',
                ExpressionAttributeValues: {
                    ':startDate': queryStartDate,
                    ':endDate': queryEndDate,
                },
                Limit: parseInt(limit, 10),
            };
            // const params = {
            //     TableName: 'mealtracker', // Your DynamoDB table name
            //     FilterExpression: 'created_at BETWEEN :start AND :end',
            //     ExpressionAttributeValues: {
            //         ':start': startDate,
            //         ':end': endDate,
            //     },
            // };

            // Query the DynamoDB table
            const data = await dynamoDB.scan(params).promise();

            res.status(200).json({
                orders: data.Items,
                lastEvaluatedKey: data.LastEvaluatedKey ? JSON.stringify(data.LastEvaluatedKey) : null,
                startDate: queryStartDate,
                endDate: queryEndDate,
                limit: parseInt(limit, 10),
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    return router;
};

