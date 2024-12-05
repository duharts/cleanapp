# Meal Tracking Application

This application helps track meal orders and details, built with a ReactJS client and a NodeJS server.

## Project Structure
- **Client Folder**: Contains the code for the ReactJS frontend.
- **Server Folder**: Contains the code for the NodeJS backend.
- **App Folder**: Contains the applications for windows/macOS.

## Getting Started

1. Add .env file to server root file and add the following in the given format: 
   ACCESS_KEY=accesskey 
   SECRETACCESSKEY=secretaccesskey 
   after creating a role IAM for DynamoDB and S3 Access.

2. Create your s3 bucket and add it to code cleanapp/server/src/routes
/mealAPI.js mealtrackerbucket (Change this to your bucket name)* Also Change: cleanapp\server\src\index.js Line 176 to(Change this to your bucket name) mealtrackerbucket1
3. http://localhost:3000/analytics
4. http://localhost:5000/api/orders
2.  **Install Dependencies**  
   At the root level, install all dependencies for both the client and server by running:
   ```bash
   npm run install:all
3. **Start the Application**  
   To start both the client and server simultaneously, run the command in the root directory:
   ```bash
   npm start
4. **To build and package the Application**  
   To start both the client and server simultaneously, run the command in the root directory:
   ```bash
   npm run build
   npm run electron:package

This will launch the React frontend and the Node.js backend server, allowing you to access the full functionality of the Meal Tracking Application.

