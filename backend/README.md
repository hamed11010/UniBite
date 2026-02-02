# UniBite Backend

NestJS backend for the UniBite food ordering platform.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL Database

The project uses Docker Compose to run PostgreSQL. Start the database:

```bash
docker-compose up -d
```

This will start a PostgreSQL container on port 5432 with:
- Database: `unibite_db`
- User: `unibite`
- Password: `unibite_password`

### 3. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://unibite:unibite_password@localhost:5432/unibite_db?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:3001"
```

**Important:** Change `JWT_SECRET` to a strong, random string in production.

### 4. Database Migrations

Generate and apply Prisma migrations:

```bash
# Generate migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 5. Run the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## Authentication

### How Cookies Work

The backend uses **httpOnly cookies** to store JWT tokens for security:

- **httpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: Prevents CSRF attacks
- **MaxAge**: 24 hours

### Authentication Endpoints

- `POST /auth/signup` - Student signup only
- `POST /auth/login` - Login and receive JWT cookie
- `POST /auth/logout` - Clear authentication cookie
- `GET /auth/me` - Get current authenticated user (requires valid cookie)

### User Roles

- `STUDENT` - Can sign up, browse restaurants, place orders
- `RESTAURANT_ADMIN` - Manages restaurant menu and orders
- `SUPER_ADMIN` - Platform administration

## Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── dto/           # Data transfer objects
│   │   ├── strategies/    # JWT strategy
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/             # Users module
│   │   ├── dto/
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── prisma/            # Prisma service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/            # Shared utilities
│   │   ├── guards/        # Authentication & role guards
│   │   └── decorators/    # Custom decorators (e.g., @Roles)
│   ├── app.module.ts
│   └── main.ts
└── prisma/
    └── schema.prisma      # Database schema
```

## Database Management

### View Database

```bash
npx prisma studio
```

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

### Create New Migration

```bash
npx prisma migrate dev --name migration_name
```

## API Documentation

### Signup (Student Only)

```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "student@miuegypt.edu.eg",
  "password": "password123"
}
```

### Login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: Sets httpOnly cookie with JWT token
```

### Get Current User

```bash
GET /auth/me
Cookie: access_token=<jwt_token>

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "STUDENT"
}
```

### Logout

```bash
POST /auth/logout
Cookie: access_token=<jwt_token>

Response: Clears authentication cookie
```

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Security Notes

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens stored in httpOnly cookies (not localStorage)
- CORS configured for frontend origin
- Input validation using class-validator
- Role-based access control (RBAC) via guards

## Troubleshooting

### Database Connection Issues

1. Ensure Docker is running
2. Check if PostgreSQL container is up: `docker ps`
3. Verify DATABASE_URL in `.env` matches docker-compose.yml

### Prisma Client Not Found

Run: `npx prisma generate`

### Migration Issues

Reset and reapply:
```bash
npx prisma migrate reset
npx prisma migrate dev
```

## License

MIT
