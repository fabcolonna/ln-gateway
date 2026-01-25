FROM rust:1.93-bookworm AS builder

WORKDIR /app

COPY server/Cargo.toml server/Cargo.lock ./server/
COPY server/src ./server/src

WORKDIR /app/server
RUN cargo build --release --bin ln-server

# Final stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy the compiled binary from the builder stage
COPY --from=builder /app/server/target/release/ln-server /usr/local/bin/ln-server

# Expose the port the server will run on
EXPOSE 3000
ENV SERVER_PORT=3000

CMD ["ln-server"]
