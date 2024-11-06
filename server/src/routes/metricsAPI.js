const express = require('express');
const router = express.Router();
const moment = require('moment-timezone')
const AWS = require('aws-sdk')


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

    return router;
};

