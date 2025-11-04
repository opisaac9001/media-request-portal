#!/bin/sh

# Start tailscaled in the background
tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &

# Wait for tailscaled to start
sleep 2

# Connect to Tailscale using the auth key if provided
if [ -n "$TAILSCALE_AUTHKEY" ]; then
    echo "Authenticating with Tailscale..."
    tailscale up --authkey="$TAILSCALE_AUTHKEY" --accept-routes
else
    echo "No TAILSCALE_AUTHKEY provided. Please set this environment variable."
    echo "You can generate an auth key at: https://login.tailscale.com/admin/settings/keys"
fi

# Wait for Tailscale to be ready
sleep 3

# Start the Next.js application
exec npm start
