# Nodejs Process Launcher
[![CircleCI](https://circleci.com/gh/01alchemist/launcher.svg?style=svg)](https://circleci.com/gh/01alchemist/launcher) 

This is small app to launch processes in nodejs using spawn.
By default it will try to load environment variables from `./env/${USER}.env`
Then try to load from `./.env`
