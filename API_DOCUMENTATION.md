# Chat Application API Documentation

## Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "string (3-30 chars, unique)",
  "email": "string (valid email, unique)", 
  "password": "string (min 6 chars)",
  "name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "username",
      "email": "email",
      "name": "name",
      "rooms": [],
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    },
    "token": "jwt_token"
  }
}
```

### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "string OR username", 
  "username": "string OR email",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token"
  }
}
```

### GET /api/auth/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "username", 
      "email": "email",
      "name": "name",
      "rooms": [
        {
          "_id": "room_id",
          "roomId": "123456",
          "name": "Room Name",
          "inviteLink": "https://myapp.com/join/123456",
          "participants": ["user_id1", "user_id2"]
        }
      ]
    }
  }
}
```

## Chatroom Endpoints

### POST /api/chatrooms
Create a new chatroom (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string (3-100 chars)",
  "password": "string (min 4 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chatroom created successfully",
  "data": {
    "chatRoom": {
      "_id": "room_id",
      "roomId": "123456",
      "name": "Room Name",
      "inviteLink": "https://myapp.com/join/123456",
      "participants": [
        {
          "_id": "user_id",
          "username": "username",
          "name": "name",
          "email": "email"
        }
      ],
      "messages": [],
      "createdBy": {
        "_id": "user_id",
        "username": "username",
        "name": "name"
      },
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
}
```

### POST /api/chatrooms/join
Join an existing chatroom (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "roomId": "string (6 digits)",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined the room",
  "data": {
    "chatRoom": { /* chatroom object with populated participants */ }
  }
}
```

### GET /api/chatrooms/{roomId}/messages
Get last 50 messages from a chatroom (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "type": "text|image|audio|video|file",
        "text": "message text (for text messages)",
        "mediaFileId": "file_id (for media messages)",
        "fileName": "filename",
        "fileSize": 1234,
        "mimeType": "mime/type",
        "sender": {
          "_id": "user_id",
          "username": "username",
          "name": "name"
        },
        "isEdited": false,
        "editedTimeDisplay": "2m ago (if edited)",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ],
    "room": {
      "_id": "room_id",
      "roomId": "123456",
      "name": "Room Name",
      "participantCount": 5
    }
  }
}
```

## Message Endpoints

### POST /api/messages/room/{roomId}
Send a message to a chatroom (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**For Text Messages:**
```json
{
  "type": "text",
  "text": "string (max 5000 chars)"
}
```

**For Media Messages (multipart/form-data):**
```
file: File (max 25MB)
data: {
  "type": "image|audio|video|file"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "_id": "message_id",
      "type": "text|image|audio|video|file",
      "text": "message text",
      "mediaFileId": "file_id",
      "fileName": "filename", 
      "fileSize": 1234,
      "mimeType": "mime/type",
      "sender": {
        "_id": "user_id",
        "username": "username",
        "name": "name"
      },
      "chatRoom": "room_id",
      "createdAt": "timestamp"
    }
  }
}
```

### PUT /api/messages/{id}
Edit a text message (requires authentication, only within 5 minutes).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "text": "string (max 5000 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message updated successfully",
  "data": {
    "message": {
      "_id": "message_id",
      "text": "updated text",
      "isEdited": true,
      "editedTimeDisplay": "just now",
      "updatedAt": "timestamp"
    }
  }
}
```

### GET /api/messages/file/{fileId}
Download or stream a media file (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
- File stream with appropriate headers
- Content-Type: file's MIME type
- Content-Disposition: inline for viewable files, attachment for downloads

## Socket.io Events

### Client to Server Events

#### Authentication
```javascript
// Connect with JWT token
const socket = io({
  auth: {
    token: "jwt_token"
  }
});
```

#### Room Management
```javascript
// Join all user's rooms
socket.emit('join-rooms');

// Join specific room  
socket.emit('join-room', roomId);

// Leave room
socket.emit('leave-room', roomId);
```

#### Messaging
```javascript
// Send message (after creating via API)
socket.emit('send-message', {
  roomId: "room_id",
  messageId: "message_id"
});

// Edit message (after editing via API)
socket.emit('edit-message', {
  messageId: "message_id", 
  roomId: "room_id"
});
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing-start', { roomId: "room_id" });

// Stop typing  
socket.emit('typing-stop', { roomId: "room_id" });
```

### Server to Client Events

#### Messages
```javascript
// New message received
socket.on('new-message', (data) => {
  const { message, roomId } = data;
  // Handle new message
});

// Message edited
socket.on('message-edited', (data) => {
  const { message, roomId } = data;
  // Handle message edit with editedTimeDisplay
});
```

#### User Presence
```javascript
// User joined room
socket.on('user-joined', (data) => {
  const { userId, username, name, roomId } = data;
});

// User left room
socket.on('user-left', (data) => {
  const { userId, username, name, roomId } = data;
});
```

#### Typing Indicators
```javascript
// User started typing
socket.on('user-typing', (data) => {
  const { userId, username, roomId } = data;
});

// User stopped typing
socket.on('user-stopped-typing', (data) => {
  const { userId, username, roomId } = data;
});
```

#### Errors
```javascript
// Handle errors
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

## File Upload Constraints

- **Maximum file size:** 25MB
- **Supported file types:**
  - Images: JPEG, PNG, GIF, WebP, SVG
  - Audio: MP3, WAV, OGG, MP4, WebM
  - Video: MP4, WebM, OGG, AVI, MOV
  - Documents: PDF, TXT, DOC, DOCX, XLS, XLSX
  - Archives: ZIP, RAR, 7Z

## Message Edit Rules

- Only the sender can edit their messages
- Only text messages can be edited
- Messages can only be edited within 5 minutes of creation
- Edited messages show "(Edited {time})" tag
- Edit history is tracked with `isEdited` flag and `updatedAt` timestamp

## Error Handling

All API endpoints return consistent error format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden  
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## Security Features

- JWT authentication for all protected routes
- Password hashing with bcrypt (12 salt rounds)
- Socket.io authentication middleware
- File type validation
- File size limits
- Room membership validation
- Message ownership validation for edits