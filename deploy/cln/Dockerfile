ARG BITCOIN_IMAGE=bitcoin/bitcoin:latest

# Extract bitcoin-cli from the Bitcoin image. This is needed to allow CLN
# to interact with a Bitcoin node via the bitcoin-* options in the config.
# This is done to avoid installing a full Bitcoin node in the final image.
FROM ${BITCOIN_IMAGE} AS bitcoin-cli
RUN set -e; set -- /opt/bitcoin-*/bin/bitcoin-cli; cp "$1" /bitcoin-cli

FROM debian:bookworm AS builder

ARG CLN_GIT_REF=v25.09.3
ARG CLN_GIT_REPO=https://github.com/ElementsProject/lightning.git

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates jq autoconf automake build-essential git libtool libsqlite3-dev libffi-dev \
  python3 python3-pip net-tools zlib1g-dev libsodium-dev gettext python3-pip curl \
  && rm -rf /var/lib/apt/lists/* \
  && curl -LsSf https://astral.sh/uv/install.sh | env UV_NO_MODIFY_PATH=1 UV_INSTALL_DIR=/usr/local/bin sh

ENV PATH="$PATH:/root/.local/bin"

RUN curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /src
RUN git clone --depth 1 --branch "${CLN_GIT_REF}" --recursive "${CLN_GIT_REPO}"

WORKDIR /src/lightning
RUN uv sync --all-extras --all-groups --frozen
RUN ./configure --prefix=/usr/local
RUN RUST_PROFILE=release uv run make -j$(nproc)
RUN RUST_PROFILE=release make install DESTDIR=/out

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  bash ca-certificates gettext-base libsqlite3-0 \
  libsodium23 zlib1g libgmp10 libssl3 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=bitcoin-cli /bitcoin-cli /usr/local/bin/bitcoin-cli
COPY --from=builder /out/usr/local/ /usr/local/
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/bitcoin-cli /usr/local/bin/entrypoint.sh \
  && useradd -m -u 1000 -s /bin/bash lightning

ENTRYPOINT ["entrypoint.sh"]
