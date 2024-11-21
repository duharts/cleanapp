const { contextBridge } = require('electron');
console.log(process.env.ACCESS_KEY)
contextBridge.exposeInMainWorld('env', {
    getAWSKeys: () => ({
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRETACCESSKEY,
        region: 'us-east-1'
    }),
});
