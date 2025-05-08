#!/bin/bash

# Start json-server with routes and watch options
npx json-server db.json -p 3001 -r routes.json
