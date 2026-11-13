#!/bin/sh
# Kept for projects that wired this path by hand before 0.3.0. The constitution guard is now one
# gate of the harness runner, which also reads the payload and applies the configured mode.
exec sh "$(dirname "$0")/../harness/hook.sh" pre
