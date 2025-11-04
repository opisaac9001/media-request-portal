FROM node:20-alpine

WORKDIR /app

# Install Tailscale
RUN apk add --no-cache ca-certificates iptables iproute2 && \
    wget https://pkgs.tailscale.com/stable/tailscale_1.56.1_amd64.tgz && \
    tar xzf tailscale_1.56.1_amd64.tgz --strip-components=1 && \
    mv tailscale /usr/local/bin/ && \
    mv tailscaled /usr/local/bin/ && \
    rm tailscale_1.56.1_amd64.tgz

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create data directory for user storage
RUN mkdir -p /app/data

# Create tailscale state directory
RUN mkdir -p /var/lib/tailscale

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Start tailscaled and the application
CMD ["/start.sh"]
