const express = require('express');
const router = express.Router();
const moment = require('moment-timezone')
const { v4: uuidv4 } = require('uuid'); // To generate unique file names
const path = require('path');
const fs = require('fs');
// const uploadSignatureToS3 = async (signatureDataUrl) => {
//     const s3 = new AWS.S3({
//         accessKeyId: process.env.ACCESS_KEY,
//         secretAccessKey: process.env.SECRETACCESSKEY,
//         region: 'us-east-1'
//     });

//     // Removing the base64 prefix from the signature data URL
//     const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');

//     // Convert the base64 string to a Uint8Array buffer
//     const binaryString = atob(base64Data);
//     const length = binaryString.length;
//     const buffer = new Uint8Array(length);

//     for (let i = 0; i < length; i++) {
//         buffer[i] = binaryString.charCodeAt(i);
//     }
//     const fileName = `signatures/${Date.now()}.png`;

//     const params = {
//         Bucket: 'mealtrackerbucket',
//         Key: fileName,
//         Body: buffer,
//         ContentEncoding: 'base64',
//         ContentType: 'image/png',
//     };

//     try {
//         const data = await s3.upload(params).promise();
//         return data.Location;
//     } catch (err) {
//         console.error('Error uploading signature:', err);
//         return '';
//     }
// };



module.exports = (db) => {
    // GET endpoint to retrieve users
    router.get('/orders', (req, res) => {
        db.all('SELECT * FROM orders', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const orders = rows.map(row => ({
                id: row.id,
                firstName: row.firstName,
                lastName: row.lastName,
                mealCount: row.mealCount,
                meal: row.meal,
                roomNumber: row.roomNumber,
                signS3url: row.signS3url,
                status: row.status,
                created_at: moment.utc(row.created_at).tz("America/New_York").format('MMMM Do YYYY, h:mm:ss a')
            }));
            res.json(orders);
        });
    });

    // POST endpoint to create a new order
    router.post('/submit-order', async (req, res) => {
        // const { firstName, lastName, roomNumber, meal, mealCount, signatureUrl } = req.body.data;
        // // console.log("frontend data - ", firstName, lastName, roomNumber, meal, mealCount, signatureUrl)
        // if (!firstName || !lastName || !roomNumber || !meal || !mealCount || !roomNumber || !signatureUrl) {
        //     res.status(400).json({ error: 'All fields (language, meal, mealCount, roomNumber, signS3url) are required' });
        //     return;
        // }
        // const signS3url = await uploadSignatureToS3(signatureUrl)
        // console.log("s3url, ", signS3url)
        // // const mealsString = JSON.stringify(meals);

        // db.run('INSERT INTO orders (firstName, lastName, roomNumber, meal, mealCount, signS3url) VALUES (?, ?, ?, ?, ?, ?)', [firstName, lastName, roomNumber, meal, mealCount, signS3url], function (err) {
        //     if (err) {
        //         res.status(500).json({ error: err.message });
        //         return;
        //     }
        //     res.status(200).json({ message: 'Order created!', order: { id: this.lastID, firstName, lastName, meal, mealCount, roomNumber } });
        // });
        // const status = "pending"
        // const { firstName, lastName, roomNumber, meal, mealCount, signatureUrl } = req.body.data;
        // console.log(req.body.data, "Asdf", !firstName, !lastName, !roomNumber, !meal, !mealCount, !signatureUrl)
        // if (!firstName || !lastName || !roomNumber || !meal || !mealCount || !signatureUrl || !status) {
        //     res.status(400).json({ error: 'All fields are required!' });
        //     return;
        // }

        // // Define the directory path for signatures
        // console.log(__dirname)
        // const signaturesDir = path.join(__dirname, '../signatures');

        // // Ensure the directory exists
        // if (!fs.existsSync(signaturesDir)) {
        //     fs.mkdirSync(signaturesDir, { recursive: true });
        // }

        // // Generate a unique filename and full path for the signature image
        // const fileName = `${uuidv4()}.png`;
        // const filePath = path.join(signaturesDir, fileName);

        // // // Generate unique filename and save signature locally
        // // const fileName = `signatures/${uuidv4()}.png`;
        // // const filePath = path.join(__dirname, fileName);

        // try {
        //     // Remove base64 prefix and decode the image data
        //     const base64Data = signatureUrl.replace(/^data:image\/\w+;base64,/, '');
        //     const binaryData = Buffer.from(base64Data, 'base64');

        //     // Save the image locally
        //     fs.writeFileSync(filePath, binaryData);

        //     // Insert the order into SQLite with local file path and "pending" sync status
        //     db.run(
        //         'INSERT INTO orders (firstName, lastName, roomNumber, meal, mealCount, signS3url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        //         [firstName, lastName, roomNumber, meal, mealCount, filePath, status],
        //         function (err) {
        //             if (err) {
        //                 res.status(500).json({ error: err.message });
        //                 return;
        //             }
        //             res.status(200).json({
        //                 message: 'Order created!',
        //                 order: { id: this.lastID, firstName, lastName, meal, mealCount, roomNumber },
        //             });
        //         }
        //     );
        // } catch (error) {
        //     console.error('Error saving signature locally:', error);
        //     res.status(500).json({ error: 'Failed to save signature locally' });
        // }
        const status = "pending"; // Default sync status
        const { firstName, lastName, roomNumber, meal, mealCount, signatureUrl } = req.body.data;

        if (!firstName || !lastName || !roomNumber || !meal || !mealCount || !signatureUrl || !status) {
            res.status(400).json({ error: 'All fields are required!' });
            return;
        }

        // Generate a shorter ID using NanoID
        const orderId = uuidv4().split('-')[0]; // Generates a 10-character unique ID

        // Define directory for saving signatures
        const signaturesDir = path.join(__dirname, '../signatures');

        if (!fs.existsSync(signaturesDir)) {
            fs.mkdirSync(signaturesDir, { recursive: true });
        }

        const fileName = `${orderId}.png`;
        const filePath = path.join(signaturesDir, fileName);

        try {
            const base64Data = signatureUrl.replace(/^data:image\/\w+;base64,/, '');
            const binaryData = Buffer.from(base64Data, 'base64');

            fs.writeFileSync(filePath, binaryData);

            db.run(
                'INSERT INTO orders (id, firstName, lastName, roomNumber, meal, mealCount, signS3url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [orderId, firstName, lastName, roomNumber, meal, mealCount, filePath, status],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    res.status(200).json({
                        message: 'Order created!',
                        order: {
                            id: orderId,
                            firstName,
                            lastName,
                            roomNumber,
                            meal,
                            mealCount,
                            signS3url: filePath,
                            status,
                        },
                    });
                }
            );
        } catch (error) {
            console.error('Error saving signature locally:', error);
            res.status(500).json({ error: 'Failed to save signature locally' });
        }
    });

    // DELETE endpoint to delete all orders
    router.delete('/delete-orders', (req, res) => {
        db.run('DELETE FROM orders', [], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(200).json({ message: 'All orders deleted' });
        });
    });


    return router;
};

