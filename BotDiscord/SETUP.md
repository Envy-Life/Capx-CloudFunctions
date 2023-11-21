# Setup

## Fetching Discord Bot Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click on `New Application`
3. Give it a name and click on `Create`
4. Click on `Bot` on the left side
5. Click on `Add Bot` (or) Click on `Reset Token`
6. Click on `Copy` under `Token`
7. Paste the token in the `token` field in the `./secrets.json` file

## Setting up mongodb
`Skip to step 10 if you already have a mongodb cluster running locally or on a cloud provider`
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click on `Build a Database`
3. Select a cloud provider and region
4. Select a cluster tier
5. Click on `Create Cluster`
6. Set up a username and password for the cluster and other security settings
7. Click on `Connect`
8. Click on `Connect your application` / `Connect using a driver` / `Drivers`
9. Select `Node.js` as driver
10. Copy the connection string and replace `<password>` with the password you set up in step 6
11. Paste the connection string in the `mongoUrl` field in the `./secrets.json` file


## Running

1. Install dependencies using `npm install`
2. Run the bot using `npm start`