# Astar-Token-API

This repository provides an API that offers various information about the Astar network.

## Getting Started

### API Route

You can find the API documentation and explore available endpoints using the Swagger UI at [api.astar.network](https://api.astar.network/).

### Running the Application

To start the app locally, follow these steps:

1. Install dependencies:

```bash
yarn
```

2. Serve the app using Firebase:

```bash
yarn serve:firebase
```

3. Now you can send requests to the local server. For instance:

```bash
http://localhost:5001/astar-token-api/us-central1/app/api/v1/token/price/ASTR
```

## Notes

-   **No Hot-Reload**: This application does not support hot-reloading. After making changes to the code, you will need to restart the local server for the changes to take effect.
