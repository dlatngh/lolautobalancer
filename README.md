This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

- Download [node.js](https://nodejs.org/) or later.
- Install [Homebrew](https://brew.sh/) (Homebrew installs the stuff you need that Apple)
- Install yarn with brew (on the command line): `brew install yarn`
- Install next.js and all its required packages with: `npm install next@latest react@latest react-dom@latest
` 
- Type `yarn install` to install dependencies.

## Next

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure
- **`app/api/`**: 
    - Contains code that handle communication between our app's frontend/backend.
         - ex: textbox content from frontend gets sent to `app/api/process-chat/route.js` for backend to handle data.

- **`lib/`**: 
  - Contains business logic
    - ex: `parsePlayerMessages.js`: Parses the player names and discriminators from the chat log.

```
autobalancer/
├── app/                         
│   └── api/                     # API routes for handling backend requests
│       └── process-chat/        # API route for processing the chat log
│           └── route.js
├── page.js                      # Main page 
├── components/                  # Reusable UI components for the frontend
├── lib/                         # Business logic and helper functions
│   ├── parsePlayerMessages.js   # Logic for parsing player names from the chat log
│   ├── fetchElo.js              # Logic for fetching Elo from Riot Games API
│   └── teamBalancer.js          # Logic for balancing teams based on Elo
│
├── public/                      # Static assets (images, fonts, etc.)
└── .env                         # Environment variables (e.g., Riot API key)
```

## Project Flow
1. copy paste chat log into app
2. chat log parses from the join logs and adds people to a list of participating players (ignores messages, pops them out of list if player left the lobby)
3. for each player in list: send to riot to get their puuid, use that to get summonerid, use that to get their rank, division, lp, level
4. for each player, calculate their inhouse rating given rank division lp accountlevel and map it to another object
5. balance that shit and put it in a 2 list for each team
6. send that list to front end and have it display the teams

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
