# CyberFlap Game

A pixel art game with Supabase integration for user authentication and progress saving.

## Features

- Pixel art game with a player character that navigates through obstacles
- Red chainsaw collectibles that appear randomly every 3-5 buildings
- User authentication system with login/signup functionality
- Game progress saving to Supabase database
- Auto-save functionality that saves progress every 30 seconds and on game over

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: Supabase (PostgreSQL)
- Authentication: JWT tokens

## Setup Instructions

1. Clone the repository:
```
git clone https://github.com/toibenoit/trumpelon.git
cd trumpelon
```

2. Install dependencies:
```
npm install
```

3. Set up Supabase:
   - Create a Supabase account at https://supabase.com
   - Create a new project
   - Run the SQL queries in `schema.sql` to create the necessary tables
   - Update the Supabase URL and key in `api.js` with your project credentials

4. Start the server:
```
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Game Controls

- Press SPACE to jump
- Navigate through obstacles to earn points
- Collect red chainsaws for bonus points

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login a user
- `POST /api/save-progress` - Save game progress
- `GET /api/get-progress` - Get saved game progress

## Project Structure

- `index.html` - Main game page
- `login.html` - Login/signup page
- `game.js` - Game logic
- `server.js` - Express server
- `api.js` - API endpoints
- `schema.sql` - Database schema

## License

MIT 