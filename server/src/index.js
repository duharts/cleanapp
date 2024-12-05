const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const router = require('./routes/index.js');
const errorHandler = require('./middleware/errorHandler.js')
const logger = require('./utils/logger.js')
const mealAPI = require('./routes/mealAPI.js')
const metricsAPI = require('./routes/metricsAPI.js')
const sqlite3 = require('sqlite3')
const AWS = require('aws-sdk')
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

dotenv.config()

// Configure the SDK with your AWS region
AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRETACCESSKEY,
    region: 'us-east-1'
});

const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRETACCESSKEY,
    region: 'us-east-1'
});

// Create a DynamoDB DocumentClient instance
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// const syncToDynamoDB = () => {
//     db.all('SELECT * FROM Orders', [], (err, rows) => {
//         if (err) {
//             console.error('Error fetching data from SQLite:', err.message);
//             return;
//         }
//         rows.forEach((order) => {
//             const params = {
//                 TableName: 'mealtracker', // DynamoDB table name
//                 Item: {
//                     id: order.id,
//                     name: order.name,
//                     language: order.language,
//                     meals: order.meals,
//                     roomNumber: order.roomNumber,
//                     signS3url: order.signS3url,
//                     created_at: order.created_at
//                 },
//             };
//             dynamoDB.put(params, (err) => {
//                 if (err) {
//                     console.error('Error adding data to DynamoDB:', err.message);
//                 } else {
//                     console.log(`Order ${order.id} synchronized to DynamoDB.`);
//                 }
//             });
//         });
//     });
// };

const db = new sqlite3.Database('./local.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the local SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            meal TEXT NOT NULL,
            mealCount TEXT NOT NULL,
            roomNumber TEXT NOT NULL,
            signS3url TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Schedule synchronization every hour
// setInterval(syncToDynamoDB, 60 * 1000);


const app = express()

//security middleware
// app.use(helmet())
app.use(cors({
    origin: process.env.frontend_url || 'http://localhost:3000'
}))

//Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//routes
app.use('/api', mealAPI(db))
app.use('/api', metricsAPI(db))
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});
app.get('/', (req, res) => {
    res.send('Welcome to the Meal Tracking Application server!');
});

const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleString(); // e.g., "11/21/2024, 4:35:00 PM"
};

function getDataFromSQLite(query) {
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

async function updateDynamoDB(tableName, data) {
    const params = {
        TableName: tableName,
        Item: data,
    };

    try {
        await dynamoDB.put(params).promise();
        // console.log('Data inserted/updated in DynamoDB');
        db.run(
            // updating the records after syncing with dynamodb
            'UPDATE orders SET status = "synced" WHERE id = ?',
            [data.id],
            (updateErr) => {
                if (updateErr) {
                    console.error("Error updating order sync status:", updateErr);
                } else {
                    console.log(`Order ${data.id} synced to DynamoDB and updated in SQLite`);
                }
            }
        );

    } catch (error) {
        console.error('Error updating DynamoDB:', error);
        throw new Error('DynamoDB update failed');
    }
}

async function clearDB() {
    try {
        db.run('DELETE FROM orders WHERE status = "synced"', (err) => {
            if (err) {
                console.error(`Failed to delete synced orders from SQLite:`, err);
            } else {
                console.log(`Synced records successfully deleted from SQLite at [${getTimestamp()}]`);
            }
        });
    } catch (error) {
        console.error('Error deleting records from SQLite:', error);
        throw new Error('SQLite cleaning failed');
    }
}

async function syncSQLiteToDynamoDB() {
    const sqliteData = await getDataFromSQLite(`SELECT * FROM orders WHERE status = 'uploaded'`);

    for (const record of sqliteData) {
        await updateDynamoDB('mealtracker', record);
    }
}

async function uploadPendingSignaturesToS3() {
    db.all("SELECT * FROM orders WHERE status = 'pending'", async (err, rows) => {
        if (err) {
            console.error("Error fetching pending records:", err);
            return;
        }

        for (const row of rows) {
            try {
                const fileContent = fs.readFileSync(row.signS3url);
                const s3Params = {
                    Bucket: 'mealtrackerbucket',
                    Key: `signatures/${path.basename(row.signS3url)}`, // Use local file name
                    Body: fileContent,
                    ContentType: 'image/png',
                };

                // Upload to S3
                const s3Response = await s3.upload(s3Params).promise();

                // Update SQLite with S3 URL and mark as "uploaded"
                db.run(
                    'UPDATE orders SET signS3url = ?, status = "uploaded" WHERE id = ?',
                    [s3Response.Location, row.id],
                    (updateErr) => {
                        if (updateErr) {
                            console.error("Error updating order sync status:", updateErr);
                        } else {
                            console.log(`Order ${row.id} synced to S3 and updated in SQLite`);
                            // deleting the local file after upload
                            fs.unlinkSync(row.signS3url);
                        }
                    }
                );

            } catch (uploadErr) {
                console.error(`Failed to upload order ${row.id} to S3:`, uploadErr);
                // Keep status as "pending" for retry
            }
        }
    });
};

// Schedule to sync images to S3 every 3 hours
cron.schedule('0 */3 * * *', () => {

    uploadPendingSignaturesToS3().then(() => {
        console.log(`Signature sync to S3 completed at [${getTimestamp()}]`);
    }).catch((error) => {
        console.error('Signature sync to S3 failed:', error);
    });
});

// Schedule to sync records to DynamoDB every 3 hours staggered by 1 hour
cron.schedule('0 1-23/3 * * *', () => {

    syncSQLiteToDynamoDB().then(() => {
        console.log(`Data sync to DynamoDB completed at [${getTimestamp()}]`);
    }).catch((error) => {
        console.error('Data sync to DynamoDB failed:', error);
    });
});

// Schedule to clean local database every 3 hours staggered by 2 hours
cron.schedule('0 2-23/3 * * *', () => {

    clearDB().then(() => {
        console.log(`Data removal from SQLite completed at [${getTimestamp()}]`);
    }).catch((error) => {
        console.error('Data removal from SQLite failed:', error);
    });
});

//error handling
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
})
