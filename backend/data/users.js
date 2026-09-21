import bcrypt from 'bcryptjs';

// Seed accounts for Juttax. Run `npm run data:import` in /backend to load
// these into the database. Change these passwords before deploying anywhere
// public — they are meant for local development / demo use only.
const users = [
  {
    name: 'Juttax Admin',
    email: 'admin@juttax.com',
    password: bcrypt.hashSync('Juttax@Admin123', 10),
    isAdmin: true,
  },
  {
    name: 'Demo User',
    email: 'demo@juttax.com',
    password: bcrypt.hashSync('Demo@1234', 10),
    isAdmin: false,
  },
];

export default users;
