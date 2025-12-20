#!/bin/bash
# doc-coverage.sh - Documentation coverage checker
# Usage: ./doc-coverage.sh [path-to-repo]

REPO_PATH="${1:-.}"

cd "$REPO_PATH" || exit 1

echo "========================================"
echo "  Documentation Coverage"
echo "========================================"
echo ""

# Essential documentation
echo "📚 Essential Documentation:"

docs=(
    "README.md:Required:Describes project purpose and basic usage"
    "LICENSE:Required:Legal terms for use and distribution"
    "CONTRIBUTING.md:Recommended:Guide for contributors"
    "SECURITY.md:Recommended:Security policy and reporting"
    "CODE_OF_CONDUCT.md:Recommended:Community standards (for public projects)"
    "CHANGELOG.md:Recommended:Version history and changes"
)

for doc in "${docs[@]}"; do
    IFS=':' read -r file importance description <<< "$doc"

    if [ -f "$file" ]; then
        size=$(wc -l < "$file")
        echo "  ✓ $file ($size lines) - $description"
    else
        echo "  ✗ $file [$importance] - $description"
    fi
done
echo ""

# Check for docs directory
echo "📁 Documentation Structure:"
if [ -d "docs" ] || [ -d "doc" ]; then
    docs_dir=$([ -d "docs" ] && echo "docs" || echo "doc")
    doc_count=$(find "$docs_dir" -name "*.md" | wc -l)
    echo "  ✓ $docs_dir/ directory exists ($doc_count markdown files)"

    echo ""
    echo "  Documentation files:"
    find "$docs_dir" -name "*.md" | sed 's/^/    /' | head -10
    if [ "$doc_count" -gt 10 ]; then
        echo "    ... and $((doc_count - 10)) more"
    fi
else
    echo "  ℹ️  No docs/ directory (acceptable for simple projects)"
fi
echo ""

# Check README quality
echo "📖 README.md Quality:"
if [ -f "README.md" ]; then
    readme_lines=$(wc -l < README.md)

    echo "  Length: $readme_lines lines"

    # Check for key sections
    sections=(
        "install"
        "usage"
        "example"
        "quick start"
        "getting started"
    )

    found_sections=0
    for section in "${sections[@]}"; do
        if grep -iq "$section" README.md; then
            ((found_sections++))
        fi
    done

    if [ $found_sections -ge 2 ]; then
        echo "  ✓ Contains installation/usage information"
    else
        echo "  ⚠️  May be missing installation or usage sections"
    fi

    # Check for code examples
    if grep -q '```' README.md; then
        example_count=$(grep -c '```' README.md)
        echo "  ✓ Contains $((example_count / 2)) code examples"
    else
        echo "  ⚠️  No code examples found"
    fi

    # Check for badges
    if grep -q '!\[' README.md; then
        badge_count=$(grep -c '!\[' README.md)
        echo "  ✓ Contains $badge_count badges/images"
    fi

    # Check last update
    if [ -d ".git" ]; then
        last_update=$(git log -1 --format='%cd' --date=relative -- README.md)
        echo "  Last updated: $last_update"
    fi
else
    echo "  ✗ README.md missing!"
fi
echo ""

# Check for inline code documentation
echo "💬 Inline Code Documentation:"

if command -v grep &> /dev/null; then
    # Count comment density (approximate)
    if [ -f "package.json" ]; then
        js_files=$(find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l)
        js_comments=$(find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -exec grep -h '//' {} \; 2>/dev/null | grep -v node_modules | wc -l)

        if [ "$js_files" -gt 0 ]; then
            echo "  JavaScript/TypeScript files: $js_files"
            echo "  Comment lines: $js_comments"
        fi
    fi

    if [ -f "requirements.txt" ] || [ -f "setup.py" ]; then
        py_files=$(find . -name "*.py" | wc -l)
        py_comments=$(find . -name "*.py" -exec grep -h '#' {} \; 2>/dev/null | wc -l)
        py_docstrings=$(find . -name "*.py" -exec grep -h '"""' {} \; 2>/dev/null | wc -l)

        if [ "$py_files" -gt 0 ]; then
            echo "  Python files: $py_files"
            echo "  Comment lines: $py_comments"
            echo "  Docstrings: $((py_docstrings / 2))"
        fi
    fi
fi
echo ""

# Check for API documentation
echo "📡 API Documentation:"

api_docs=(
    "docs/api:API documentation directory"
    "docs/API.md:API reference file"
    "api.md:API reference file"
    "openapi.yaml:OpenAPI specification"
    "swagger.json:Swagger specification"
)

found_api_docs=0
for api_doc in "${api_docs[@]}"; do
    IFS=':' read -r path description <<< "$api_doc"

    if [ -e "$path" ]; then
        echo "  ✓ $path - $description"
        ((found_api_docs++))
    fi
done

if [ $found_api_docs -eq 0 ]; then
    echo "  ℹ️  No dedicated API documentation found"
    echo "     (Acceptable for applications; libraries should document APIs)"
fi
echo ""

# Documentation score
echo "📊 Documentation Score:"

score=0
max_score=10

[ -f "README.md" ] && ((score+=3))
[ -f "LICENSE" ] && ((score+=1))
[ -f "CONTRIBUTING.md" ] && ((score+=1))
[ -f "CHANGELOG.md" ] && ((score+=1))
[ -d "docs" ] || [ -d "doc" ] && ((score+=2))
[ $found_sections -ge 2 ] && ((score+=1))
grep -q '```' README.md 2>/dev/null && ((score+=1))

percentage=$((score * 100 / max_score))

echo "  Score: $score/$max_score ($percentage%)"

if [ $percentage -ge 80 ]; then
    echo "  ✓ Excellent documentation coverage"
elif [ $percentage -ge 60 ]; then
    echo "  ✓ Good documentation coverage"
elif [ $percentage -ge 40 ]; then
    echo "  ⚠️  Adequate documentation, could be improved"
else
    echo "  ✗ Poor documentation coverage"
fi
echo ""

echo "========================================"
echo "  Documentation audit complete!"
echo ""
echo "  Recommendations:"
if [ ! -f "README.md" ]; then
    echo "  - Add README.md with usage instructions"
fi
if [ ! -f "LICENSE" ]; then
    echo "  - Add LICENSE file"
fi
if [ ! -f "CONTRIBUTING.md" ]; then
    echo "  - Add CONTRIBUTING.md for contributors"
fi
if [ ! -d "docs" ]; then
    echo "  - Consider creating docs/ directory"
fi
echo "========================================"
