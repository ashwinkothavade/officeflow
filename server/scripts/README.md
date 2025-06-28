# Admin Scripts

This directory contains utility scripts for administrative tasks.

## makeAdmin.ts

A script to update a user's role to admin.

### Prerequisites

- Node.js installed
- MongoDB running locally or accessible via the connection string in `.env`
- Dependencies installed (`npm install` in the server directory)

### Usage

1. Make sure your `.env` file has the correct `MONGODB_URI` set
2. Run the script with the following command:

```bash
# Using npx
npx ts-node scripts/makeAdmin.ts user@example.com

# Or if you have ts-node installed globally
ts-node scripts/makeAdmin.ts user@example.com
```

### Example

```bash
ts-node scripts/makeAdmin.ts madhur@mplgaming.com
```

### Output

On success, you should see output similar to:

```
MongoDB Connected: localhost
Successfully updated madhur@mplgaming.com to admin role
```

### Troubleshooting

- **User not found**: Make sure the email address is correct and the user exists in the database
- **Connection issues**: Verify your MongoDB connection string in the `.env` file
- **Permission denied**: Ensure the database user has write permissions
