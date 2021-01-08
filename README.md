# botyto
Botyto is a Twitch chatbot for those users that have not reached yet the affiliate level. Botyto is GDPR compliant, usernames are always hashed before saving them on the local database.

# Setting up the environment

Use the `yarn` command to install all required dependencies.

Botyto can be started using the `yarn start` command.

`yarn package` can be runned to package the project into the `out` folder.

# About Botyto main's goal

Botyto's goal is to serve as a bridge between non-affiliate streamers and their audience to increase interactivity.
Botyto deploys a reward system that gives channel points to the audience as a reward for viewing the stream, and the audience can use these points to interact with the streamer.

# GDPR concerns

Botyto uses the username as the main identifier to relate how many points a specific user has, and their identity. As the username is considered personal data, Botyto hashes it before saving anything on the database. That means that you won't be storing personal data without the user permission.

# How to add this to OBS or OBS StreamLabs

Simply add a new browser source font from the following url: `http://localhost:3000`.
This will show visual alerts to your stream when someone uses botyto interactity commands.

# How to customize visual alerts

Visual alerts are displayed using a very basic frontend (believe me, it's very, very basic). Frontend app receives sockets when is the moment to show alerts, so its customization can be achieved editing the web application container inside the `public` directory.

# Hey! Commands are in Spanish

Yes. Apologies but Botyto doesn't have a i18n system. TIt's a very basic ElectronJS application specifically written for a Spanish Twitch channel. Fortunatelly is basic enought to easilly translate commands to the English language, and even allow to configure them from the configuration dialog.
