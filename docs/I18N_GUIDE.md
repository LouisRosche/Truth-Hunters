# Internationalization (i18n) Guide

---

## ⚠️ **IMPORTANT: i18n Infrastructure Status**

**Current Implementation:** Infrastructure configured, component integration **NOT YET COMPLETE**

### What Exists ✅
- react-i18next configured in `/src/i18n/config.js`
- Translation files: `en.json`, `es.json` (complete)
- `LanguageSelector` component implemented
- i18n dependencies installed

### What's Missing ❌
- **i18n NOT initialized in application** - `/src/main.jsx` does not import/initialize i18next
- **Components NOT using translations** - Only 2 of 36 components use `useTranslation()`
- **Application runs in English only** - Translation files exist but are not loaded
- **Language selector NOT rendered** - Component exists but not imported in main app

### Integration Required Before Use

**Estimated work:** 120-180 hours to externalize 1,418+ hardcoded strings across 31 files

**To complete i18n integration:**
1. Initialize i18next in `/src/main.jsx`
2. Import and render `LanguageSelector` component
3. Replace hardcoded strings in all components with `t()` function calls
4. Test all screens in both English and Spanish
5. Verify pluralization and variable interpolation

**Current Status:** Translation infrastructure ready, implementation in progress

See [COMPREHENSIVE_AUDIT_SUMMARY.md](../COMPREHENSIVE_AUDIT_SUMMARY.md) lines 48-55 for details.

---

Truth Hunters is building multilingual support to make epistemic education accessible to non-English speaking students.

## Language Implementation Status

| Language | Translation Files | Component Integration | Status |
|----------|-------------------|----------------------|--------|
| **English (en)** | ✅ Complete | ❌ Hardcoded in components | Infrastructure only |
| **Spanish (es)** | ✅ Complete | ❌ Not integrated | Infrastructure only |
| **French (fr)** | ❌ Not started | ❌ Not integrated | Planned |
| **Chinese (zh)** | ❌ Not started | ❌ Not integrated | Planned |
| **Arabic (ar)** | ❌ Not started | ❌ Not integrated | Planned |

## Adding a New Language

### 1. Create Translation File

Create a new JSON file in `src/i18n/locales/` named after the language code:

```bash
# Example for French
src/i18n/locales/fr.json
```

### 2. Copy English Template

Copy the contents of `src/i18n/locales/en.json` as your starting point:

```bash
cp src/i18n/locales/en.json src/i18n/locales/fr.json
```

### 3. Translate All Keys

Translate all values (right side of colons) while keeping keys (left side) unchanged:

```json
{
  "appName": "Chasseurs de Vérité",  // Translate this
  "tagline": "Formation épistémique basée sur la recherche pour les collégiens",

  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "retry": "Réessayer",
    ...
  }
}
```

**Important Translation Guidelines:**
- Keep `{{variable}}` placeholders unchanged (e.g., `{{count}}`, `{{current}}`)
- Maintain HTML tags if present
- Use appropriate formality level for middle school students (ages 11-14)
- Test all translations in context before submitting

### 4. Register Language

Add your language to `src/i18n/config.js`:

```javascript
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },  // Add this
];

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },  // Add this
};
```

### 5. Import Translation File

At the top of `src/i18n/config.js`:

```javascript
import frTranslations from './locales/fr.json';
```

### 6. Test Your Translation

```bash
npm run dev
```

- Click the language selector in the header
- Select your new language
- Navigate through all screens (Setup, Playing, Debrief, Teacher Dashboard)
- Check for:
  - Truncated text (too long for UI)
  - Missing translations (English fallback appearing)
  - Formatting issues with plurals or variables

## Translation Best Practices

### Pluralization

Use i18next plural forms for countable nouns:

```json
{
  "points": "{{count}} point",
  "points_other": "{{count}} points"
}
```

**Language-specific plural rules:**
- English: `_other` for != 1
- Spanish: `_other` for != 1
- French: `_other` for > 1
- Arabic: Has 6 plural forms (zero, one, two, few, many, other)
- Chinese: No plural form (same for all counts)

See [i18next plurals documentation](https://www.i18next.com/translation-function/plurals) for your language.

### Gender and Formality

Some languages require gender agreement or formality levels:

**Spanish:**
```json
{
  "welcome": "Bienvenido",        // Masculine
  "welcome_female": "Bienvenida"  // Feminine
}
```

**Japanese:**
```json
{
  "submit": "提出する",        // Polite form appropriate for students
  "submit_casual": "出す"      // Casual form (avoid in educational context)
}
```

### Cultural Adaptation

Beyond direct translation, consider:

1. **Examples**: Use culturally relevant examples
   - US: "Bald Eagle" → Japan: "Cranes" or "Cherry Blossoms"

2. **Units**: Adapt measurement units if needed
   - Metric vs. Imperial
   - Date formats (MM/DD vs. DD/MM)

3. **Subject Names**: Translate subject categories appropriately
   ```json
   {
     "subjects": {
       "science": "Ciencias",         // Spanish
       "history": "Historia",
       "geography": "Geografía"
     }
   }
   ```

4. **Educational Terminology**: Use terms familiar to the target education system
   - "Middle school" → "Collège" (French) or "Secundaria" (Spanish)
   - "Grade 6-8" → "6º-8º grado" or "年6-8" (Japanese)

## Using Translations in Components

### Basic Usage

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('setup.title')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### With Variables

```javascript
const { t } = useTranslation();

<p>{t('gameplay.roundProgress', { current: 3, total: 10 })}</p>
// Output: "Round 3 of 10" (English)
// Output: "Ronda 3 de 10" (Spanish)
```

### With Plurals

```javascript
const { t } = useTranslation();

<p>{t('gameplay.points', { count: score })}</p>
// score = 1: "1 point" (English) / "1 punto" (Spanish)
// score = 5: "5 points" (English) / "5 puntos" (Spanish)
```

### With Default Fallback

```javascript
const { t } = useTranslation();

<p>{t('newKey', 'Default text if key missing')}</p>
```

## Testing Translations

### Manual Testing

1. **Switch language** via language selector
2. **Navigate all screens**:
   - Home/Setup
   - Gameplay (play a full game)
   - Debrief
   - Teacher Dashboard
   - Leaderboard
3. **Check edge cases**:
   - Long team names
   - Maximum rounds (99)
   - Zero score
   - 100% accuracy
4. **Test on mobile** (text truncation is more common)

### Automated Testing

Add translation completeness test:

```javascript
// src/i18n/__tests__/completeness.test.js
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';

test('Spanish translations are complete', () => {
  const enKeys = getAllKeys(enTranslations);
  const esKeys = getAllKeys(esTranslations);

  expect(esKeys).toEqual(expect.arrayContaining(enKeys));
});
```

## Translation Workflow

### For Community Contributors

1. Fork the repository
2. Create translation file: `src/i18n/locales/[code].json`
3. Translate all keys
4. Test locally: `npm run dev`
5. Submit Pull Request with:
   - Translation file
   - Updated `config.js`
   - Screenshots of tested screens
   - Note any culturally adapted content

### For Maintainers

**Review checklist:**
- [ ] All keys from `en.json` are present
- [ ] No English text in translation file (except proper nouns)
- [ ] Pluralization rules are correct for the language
- [ ] Screenshots show proper rendering (no truncation)
- [ ] Translator is native or fluent speaker
- [ ] Added to `SUPPORTED_LANGUAGES` array
- [ ] Imports added to `config.js`
- [ ] Updated this guide's "Supported Languages" list

## Translation Status

| Language | Status | Translator(s) | Last Updated | Completeness |
|----------|--------|---------------|--------------|--------------|
| English (en) | ✅ Complete | Core team | 2025-12-17 | 100% (reference) |
| Spanish (es) | ✅ Complete | Core team | 2025-12-17 | 100% |
| French (fr) | 🚧 In Progress | - | - | 0% |
| Chinese (zh) | 📋 Planned | - | - | 0% |
| Arabic (ar) | 📋 Planned | - | - | 0% |

Want to contribute a translation? See [CONTRIBUTING.md](../CONTRIBUTING.md)!

## Common Pitfalls

### 1. Translating Variable Names

❌ **Wrong:**
```json
{
  "roundProgress": "Ronda {{corriente}} de {{total}}"
  // Changed variable names!
}
```

✅ **Correct:**
```json
{
  "roundProgress": "Ronda {{current}} de {{total}}"
  // Keep variable names in English
}
```

### 2. Missing Plural Forms

❌ **Wrong:**
```json
{
  "points": "{{count}} punto"
  // No plural form!
}
```

✅ **Correct:**
```json
{
  "points": "{{count}} punto",
  "points_other": "{{count}} puntos"
}
```

### 3. Overly Formal Language

Remember: Target audience is 11-14 year-olds. Use age-appropriate, friendly language.

❌ **Too formal (Spanish):**
```json
{
  "welcome": "Le damos la bienvenida a nuestro programa educativo"
}
```

✅ **Appropriate:**
```json
{
  "welcome": "¡Bienvenido a Cazadores de la Verdad!"
}
```

### 4. Inconsistent Terminology

Create a glossary for your language to maintain consistency:

| English | Spanish | Notes |
|---------|---------|-------|
| Claim | Afirmación | NOT "demanda" or "reclamo" |
| Confidence | Confianza | NOT "seguridad" |
| Verdict | Veredicto | NOT "decisión" |
| Round | Ronda | NOT "vuelta" |

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [React i18next Guide](https://react.i18next.com/)
- [i18next Pluralization Rules](https://www.i18next.com/translation-function/plurals)
- [Unicode CLDR Language Plural Rules](https://www.unicode.org/cldr/charts/43/supplemental/language_plural_rules.html)
- [Google Translate](https://translate.google.com/) - Use as starting point, NOT final translation
- [DeepL](https://www.deepl.com/) - Generally more natural translations than Google

## Questions?

Open an issue on GitHub with the `i18n` label or ask in Discussions!
