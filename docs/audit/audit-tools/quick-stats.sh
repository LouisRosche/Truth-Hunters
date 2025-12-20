#!/bin/bash
# quick-stats.sh - Quick repository statistics for audit
# Usage: ./quick-stats.sh [path-to-repo]

REPO_PATH="${1:-.}"

cd "$REPO_PATH" || exit 1

echo "========================================"
echo "  Repository Quick Stats"
echo "========================================"
echo ""

# Git stats
if [ -d ".git" ]; then
    echo "📊 Git Metrics:"
    echo "  Total commits:        $(git log --oneline | wc -l)"
    echo "  Contributors:         $(git shortlog -sn --all | wc -l)"
    echo "  Last commit:          $(git log -1 --format='%cd' --date=relative)"
    echo "  Recent activity (30d): $(git log --since='30 days ago' --oneline | wc -l) commits"
    echo ""

    echo "👥 Top Contributors:"
    git shortlog -sn --all | head -5
    echo ""
else
    echo "⚠️  Not a git repository"
    echo ""
fi

# File counts
echo "📁 File Statistics:"
echo "  Test files:           $(find . -name '*.test.*' -o -name '*_test.*' -o -name 'test_*.py' 2>/dev/null | wc -l)"
echo "  Documentation files:  $(find . -name '*.md' 2>/dev/null | wc -l)"
echo "  Source files (approx): $(find . -type f -name '*.js' -o -name '*.ts' -o -name '*.py' -o -name '*.go' -o -name '*.rs' -o -name '*.java' 2>/dev/null | wc -l)"
echo ""

# Lines of code
echo "📝 Lines of Code:"
if command -v cloc &> /dev/null; then
    cloc --quiet .
else
    echo "  (Install 'cloc' for detailed breakdown)"
    total_lines=$(find . -type f \( -name '*.js' -o -name '*.ts' -o -name '*.py' -o -name '*.go' -o -name '*.rs' \) -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
    echo "  Approximate total:    $total_lines lines"
fi
echo ""

# Check for key files
echo "📋 Key Files:"
for file in "README.md" "LICENSE" "CONTRIBUTING.md" "SECURITY.md" "CODE_OF_CONDUCT.md" "CHANGELOG.md"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (missing)"
    fi
done
echo ""

# Check for CI/CD
echo "🔄 CI/CD:"
if [ -d ".github/workflows" ]; then
    echo "  ✓ GitHub Actions ($(find .github/workflows -name '*.yml' -o -name '*.yaml' | wc -l) workflows)"
elif [ -f ".gitlab-ci.yml" ]; then
    echo "  ✓ GitLab CI"
elif [ -f ".travis.yml" ]; then
    echo "  ✓ Travis CI"
elif [ -f "circle.yml" ] || [ -f ".circleci/config.yml" ]; then
    echo "  ✓ Circle CI"
else
    echo "  ✗ No CI/CD configuration detected"
fi
echo ""

# Check for dependency files
echo "📦 Dependency Management:"
if [ -f "package.json" ]; then
    echo "  ✓ npm/yarn (Node.js)"
fi
if [ -f "requirements.txt" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
    echo "  ✓ pip/poetry (Python)"
fi
if [ -f "go.mod" ]; then
    echo "  ✓ go modules"
fi
if [ -f "Cargo.toml" ]; then
    echo "  ✓ cargo (Rust)"
fi
if [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
    echo "  ✓ Maven/Gradle (Java)"
fi
echo ""

echo "========================================"
echo "  Analysis complete!"
echo "========================================"
