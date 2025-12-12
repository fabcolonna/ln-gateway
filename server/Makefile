SERVER_PKG      := ln-server

LN_DIR		    := .lightning
LN_PID_FILE     := $(LN_DIR)/lightningd.pid
LN_CMD   		?= lightningd

BUILD_CMD       ?= cargo build --bin $(SERVER_PKG)
RUN_CMD         ?= cargo run --bin $(SERVER_PKG)

.PHONY: build run clean lightningd-start lightningd-stop lightningd-status

build:
	$(BUILD_CMD)

run:
	$(RUN_CMD)

clean:
	cargo clean
	$(RM) -r $(LN_DIR)

lightningd-start:
	@mkdir -p $(LN_DIR)
	@$(LN_CMD) >/dev/null 2>&1 & echo $$! > $(LN_PID_FILE)

lightningd-stop:
	@test -f $(LN_PID_FILE) && kill `cat $(LN_PID_FILE)` && rm -rf $(LN_DIR) || echo "lightningd not running"

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
