# runk.io

A backend hosted at api.runk.nl to support the app at runk.nl

## Info

This project is built using the serverless framework. The API manages 3 
different sections:

- Leagues
- Matches
- Users

### Leagues

A league is a collection of users that want to compete with each other. Users 
can be admins, or just normal users. Admins have the ability to administer the 
group, changeg the settings of a league, etc.

Users start off in a league with 1000 points. Any user in a league can create a 
a match between two players in the league. When a match is submitted, the 
rankings of each player will be adjusted inside the league

### Matches

A match belongs to a league. The match defines which players are playing, and 
acts as a historical object for the matches that take place. When a match is 
submitted, the scores of the relevant users are adjusted in the league

### Users

A user is able to sign up using a Google Authenticated account. A user is able 
to belong to many different leagues. No information is retrieved from the google 
account, except the name which is used to default the users display name (which 
can be changed later).

## Developing

Install all dependencies

    npm install
    npm run init

Note: the init script is an alias for sls dynamodb install which installs a 
local running version of dynamodb

Test using jest with

    npm run test

If doing TDD, then this might help:

    npm run test -- --verbose --watch

If you want to run everything locally (can use to test the app)

    npm run dev

Linting so easy as

    npm run lint

And to deploy(dev/prod stages)

    npm run deploy:dev
    npm run deploy:prod
