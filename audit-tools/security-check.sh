#!/bin/bash
# security-check.sh - Basic security audit
# Usage: ./security-check.sh [path-to-repo]

REPO_PATH="${1:-.}"

cd "$REPO_PATH" || exit 1

echo "========================================"
echo "  Security Audit"
echo "========================================"
echo ""

# Check for secrets in git history
echo "🔒 Checking for potential secrets in git history..."
if [ -d ".git" ]; then
    SECRET_PATTERNS="password|api_key|secret|token|private_key|aws_access"

    matches=$(git log -p | grep -iE "$SECRET_PATTERNS" | head -10)

    if [ -n "$matches" ]; then
        echo "  ⚠️  Found potential secrets (showing first 10 matches):"
        echo "$matches" | head -10
        echo "  ⚠️  Review git history for exposed credentials!"
    else
        echo "  ✓ No obvious secrets found in git history"
    fi
else
    echo "  ⚠️  Not a git repository, skipping history check"
fi
echo ""

# Check for .env files
echo "🔑 Checking for environment files..."
if find . -name ".env" -o -name "*.env" | grep -q .; then
    echo "  ⚠️  Found .env files:"
    find . -name ".env" -o -name "*.env"
    echo "  ⚠️  Ensure these are in .gitignore!"
else
    echo "  ✓ No .env files found in repository"
fi

if [ -f ".env.example" ]; then
    echo "  ✓ .env.example template exists"
fi
echo ""

# Check .gitignore
echo "🚫 Checking .gitignore..."
if [ -f ".gitignore" ]; then
    echo "  ✓ .gitignore exists"

    # Check for common secrets patterns
    if grep -qE "\.env|node_modules|secrets|credentials" .gitignore; then
        echo "  ✓ Contains common secret patterns"
    else
        echo "  ⚠️  May be missing common secret patterns (.env, credentials, etc.)"
    fi
else
    echo "  ✗ No .gitignore file"
fi
echo ""

# Check for SECURITY.md
echo "📄 Checking security policy..."
if [ -f "SECURITY.md" ]; then
    echo "  ✓ SECURITY.md exists"
else
    echo "  ✗ No SECURITY.md (consider adding responsible disclosure policy)"
fi
echo ""

# Dependency audit (if tools available)
echo "📦 Dependency Security:"

if [ -f "package.json" ] && command -v npm &> /dev/null; then
    echo "  Running npm audit..."
    npm audit --json 2>/dev/null | jq -r '.metadata | "  Vulnerabilities: \(.vulnerabilities.total) total (\(.vulnerabilities.critical) critical, \(.vulnerabilities.high) high)"' || echo "  (Run 'npm audit' manually for details)"
fi

if [ -f "requirements.txt" ] && command -v pip-audit &> /dev/null; then
    echo "  Running pip-audit..."
    pip-audit --desc || echo "  (Install pip-audit for Python vulnerability scanning)"
fi

if [ -f "Cargo.toml" ] && command -v cargo &> /dev/null; then
    echo "  Running cargo audit..."
    cargo audit 2>/dev/null || echo "  (Install cargo-audit for Rust vulnerability scanning)"
fi

if [ -f "go.mod" ] && command -v govulncheck &> /dev/null; then
    echo "  Running govulncheck..."
    govulncheck ./... || echo "  (Install govulncheck for Go vulnerability scanning)"
fi

echo ""

# Check for hardcoded IPs or URLs
echo "🌐 Checking for hardcoded IPs/URLs..."
hardcoded=$(grep -rE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b|https?://[a-zA-Z0-9.-]+' --include="*.js" --include="*.py" --include="*.go" --include="*.ts" . 2>/dev/null | grep -v "node_modules" | grep -v "127.0.0.1" | grep -v "localhost" | head -5)

if [ -n "$hardcoded" ]; then
    echo "  ⚠️  Found hardcoded IPs/URLs (review if these should be configurable):"
    echo "$hardcoded"
else
    echo "  ✓ No obvious hardcoded IPs/URLs"
fi
echo ""

# Check for common insecure patterns
echo "🔍 Checking for insecure code patterns..."

# Check for eval usage (dangerous in most contexts)
if grep -rE '\beval\(' --include="*.js" --include="*.py" . 2>/dev/null | grep -v "node_modules" | grep -q .; then
    echo "  ⚠️  Found 'eval()' usage (potential code injection risk)"
fi

# Check for exec usage
if grep -rE '\bexec\(' --include="*.py" --include="*.js" . 2>/dev/null | grep -v "node_modules" | grep -q .; then
    echo "  ⚠️  Found 'exec()' usage (potential code injection risk)"
fi

# Check for SQL concatenation (potential SQL injection)
if grep -rE 'SELECT.*\+|INSERT.*\+|UPDATE.*\+' --include="*.js" --include="*.py" --include="*.java" . 2>/dev/null | grep -v "node_modules" | grep -q .; then
    echo "  ⚠️  Found potential SQL concatenation (use parameterized queries)"
fi

echo "  ✓ Basic pattern check complete"
echo ""

echo "========================================"
echo "  Security audit complete!"
echo ""
echo "  Recommendations:"
echo "  - Review any flagged items above"
echo "  - Run language-specific security tools"
echo "  - Enable Dependabot/Renovate for updates"
echo "  - Add SECURITY.md with disclosure policy"
echo "========================================"
