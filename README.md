# VertiClipper

A web application to create vertical video clips with custom backgrounds and overlays.

[Watch a demo video on Loom](https://www.loom.com/share/1c69447564454f2fa2a505dc503cff35?sid=91d9c246-6a8a-469a-9c82-12139576a3be)

## Setup

### Backend Setup

The backend is a Node.js/Express application responsible for handling file uploads and video composition.

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` directory (if it doesn't exist) and set the `PORT` (e.g., `PORT=8000`).
4.  Build the TypeScript code:
    ```bash
    npm run build
    ```
5.  Start the backend server:
    ```bash
    npm start
    ```
The backend should start and listen on the specified port (defaulting to 3001 if PORT is not set).

### Frontend Setup

The frontend is a Next.js application.

1.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
The frontend should start and be accessible at `http://localhost:3000`.

## API Endpoints

### 1. Upload Assets (`POST /api/upload`)

This endpoint handles the upload of video, background image, and overlay images.

-   **URL:** `http://localhost:8000/api/upload`
-   **Method:** `POST`
-   **Request Body:** `multipart/form-data`
    -   `video`: The video file (mandatory). Should be horizontal.
    -   `background`: The background image file (mandatory). Should be vertical.
    -   `overlays`: One or more overlay image files (optional, max 2). Can be sent as multiple fields with the same name or an array.

-   **Success Response (Status 200):**
    ```json
    {
        "success": true,
        "data": {
            "sessionId": "<generated-session-id>",
            "video": { ...video metadata ... },
            "background": { ...background metadata ... },
            "overlays": [ ...overlay metadata ... ]
        }
    }
    ```
    The `sessionId` is crucial for subsequent composition requests.

-   **Error Responses (Status 400):**
    ```json
    {
        "success": false,
        "error": "<validation-error-message>"
    }
    ```
    Validation errors include missing mandatory files, incorrect orientation (handled by backend), or exceeding the maximum number of overlays.

### 2. Compose Video (`POST /api/compose`)

This endpoint triggers the video composition process using the uploaded assets and specified parameters.

-   **URL:** `http://localhost:8000/api/compose`
-   **Method:** `POST`
-   **Request Body:** `application/json`
    ```json
    {
        "sessionid": "<session-id-from-upload>",
        "clip": {
          "start": <clip-start-time-in-seconds>,
          "end": <clip-end-time-in-seconds>
        },
        "overlays": [
          {
            "x": <x-position>,
            "y": <y-position>,
            "width": <width>,
            "height": <height>
          }
          // ... potentially a second overlay object
        ]
    }
    ```
    Positions (`x`, `y`) and dimensions (`width`, `height`) for overlays should be integers corresponding to the target 1080x1920 resolution.

-   **Success Response (Status 200):**
    ```json
    {
        "success": true,
        "data": {
            "videoUrl": "/outputs/<final-video-filename>.mp4",
            "duration": <clip-duration>,
            "fileSize": <output-file-size>,
            "processingTime": <time-taken-in-ms>
        }
    }
    ```
    The `videoUrl` is the path to the final composed video, relative to the server's static file directory.

-   **Error Responses (Status 400 or 500):**
    ```json
    {
        "success": false,
        "error": "<error-message>"
    }
    ```
    Errors can be due to validation failures (e.g., invalid clip times, session not found) or internal server issues during composition.

## Application Flow

The application guides the user through a 4-step process:

1.  **Upload Assets:** The user uploads a horizontal video (mandatory), a vertical background image (mandatory), and optionally up to two overlay images. Clicking "Next" sends these files to the backend's `/api/upload` endpoint. The frontend displays an "Uploading..." state. Upon successful upload, the backend returns a `sessionId` and metadata. The frontend stores the `sessionId` and proceeds to Step 2.

2.  **Timestamp Selector:** The user views the uploaded video and uses a time range slider to select the start and end points of the desired clip. Clicking "Next" updates the `clipStart` and `clipEnd` state and proceeds to Step 3.

3.  **Overlay Positioning:** The user sees a portrait preview canvas showing the background and the video clip centered. Any uploaded overlays are also shown on this canvas. The user can drag and resize the overlays to position them visually. The positions and sizes are stored in the frontend state, mapped to the backend's 1080x1920 resolution space. Clicking "Generate Video" sends the `sessionId`, selected clip times, and the final overlay positions/sizes to the backend's `/api/compose` endpoint. The frontend displays a "Composing..." state.

4.  **Composed Video:** Upon successful composition, the backend returns the URL of the final vertical video. The frontend displays this video using an HTML5 video player and provides a download button. The user can view and download the final composed vertical video clip. A "Start Over" button allows the user to return to Step 1. 