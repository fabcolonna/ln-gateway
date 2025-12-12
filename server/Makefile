# Name of the binary crate exposed by the server package.
SERVER_PKG      := ln-server

# Workspace used to run a local lightningd instance for manual testing.
LN_DIR	    := .lightning
# PID file used to manage the lifecycle of lightningd.
LN_PID_FILE     := $(LN_DIR)/lightningd.pid
# Override to point at a different lightningd binary if needed.
LN_CMD   	?= lightningd

# Commands are overridable to inject extra flags (e.g. BUILD_CMD="cargo build --release").
BUILD_CMD       ?= cargo build --bin $(SERVER_PKG)
RUN_CMD         ?= cargo run --bin $(SERVER_PKG)

.PHONY: build run clean lightningd-start lightningd-stop lightningd-status

# Build the server binary (debug by default unless BUILD_CMD is overridden).
build:
	$(BUILD_CMD)

# Build and run the HTTP server with the current configuration.
run:
	$(RUN_CMD)

# Remove cargo artefacts and any local lightningd state directory.
clean:
	cargo clean
	$(RM) -r $(LN_DIR)

# Start lightningd inside LN_DIR; useful for exercising callbacks locally.
lightningd-start:
	@mkdir -p $(LN_DIR)
	@$(LN_CMD) >/dev/null 2>&1 & echo $$! > $(LN_PID_FILE)

# Stop the managed lightningd instance, ignoring failures when it is not running.
lightningd-stop:
	@test -f $(LN_PID_FILE) && kill `cat $(LN_PID_FILE)` && rm -rf $(LN_DIR) || echo "lightningd not running"

# Report whether the managed lightningd instance is alive or the PID file is stale.
lightningd-status:
	@if test -f $(LN_PID_FILE); then \
		if kill -0 `cat $(LN_PID_FILE)` 2>/dev/null; then \
			echo "lightningd running (pid `cat $(LN_PID_FILE)`)"; \
		else \
			echo "stale pid file"; \
		fi; \
	else \
		echo "lightningd not running"; \
	fi
