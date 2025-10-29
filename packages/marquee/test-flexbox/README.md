# Flexbox Direction Tests

This directory contains test pages for the CSS flexbox-driven direction feature.

## Quick Start

### 1. Build the library
```bash
cd .. # Go to marquee root directory
npm run build
```

### 2. Start a local server
```bash
cd test-flexbox
python3 -m http.server 8080
# or
npx http-server -p 8080
```

### 3. Run test helper
```bash
node run-tests.cjs
```

This will display test URLs and create a test checklist in `test-report.txt`.

## Test Pages

### 1. Media Query Test
**File:** `test-media-query.html`
**URL:** http://localhost:8080/test-media-query.html

**Tests:**
- Horizontal → Vertical transition at 768px breakpoint
- Vertical → Horizontal transition at 768px breakpoint
- Automatic direction switching via CSS media queries

**How to test:**
1. Open in browser with DevTools console open (F12)
2. Resize browser window to cross 768px width
3. Watch console for `[Marquee Direction Change]` logs
4. Verify marquee direction switches automatically
5. Check `data-marquee-active-direction` attribute updates

**Expected behavior:**
- Above 768px: Test 1 = horizontal, Test 2 = vertical
- Below 768px: Test 1 = vertical, Test 2 = horizontal
- Smooth transition with no visual jumps
- Console logs showing CSS reads and direction changes

---

### 2. Reverse Direction Test
**File:** `test-reverse.html`
**URL:** http://localhost:8080/test-reverse.html

**Tests:**
- `row` → horizontal, normal
- `row-reverse` → horizontal, auto-reversed
- `column` → vertical, normal
- `column-reverse` → vertical, auto-reversed

**How to test:**
1. Open in browser with DevTools console open (F12)
2. Click buttons to dynamically change flex-direction
3. Watch console for `[Marquee CSS Read]` logs
4. Verify animation direction reverses for `-reverse` variants
5. Check `data-marquee-active-reverse` attribute updates

**Expected behavior:**
- Normal variants: `data-marquee-active-reverse="false"`
- Reverse variants: `data-marquee-active-reverse="true"`
- Animation direction matches expected flow
- Smooth transitions when switching directions

---

## Console Output

### Expected Logs

#### CSS Read (on init and direction check)
```
[Marquee CSS Read]
  Container: <div>
  flex-direction: row
  justify-content: flex-start
  → Computed direction: horizontal
  → Auto-reversed: false
```

#### Direction Change (on transition)
```
[Marquee Direction Change]
  Container: <div>
  Old: horizontal
  New: vertical
  Source: CSS change detected
```

#### Timeline Rebuild (after direction change)
```
[Marquee Timeline Rebuild]
  Container: <div>
  Direction: vertical
  Reason: Manual rebuild
```

## Debugging

### Enable/Disable Debug Logs
Edit `src/marquee.js` line 8:
```javascript
const DEBUG = {
  enabled: true, // Set to false to disable
  // ...
};
```

### Inspect Live State
Use browser DevTools to inspect data attributes:
```html
<div
  data-marquee
  data-marquee-active-direction="horizontal"
  data-marquee-active-reverse="false"
  style="display: flex; flex-direction: row;"
>
```

### Common Issues

**Problem:** Marquee doesn't initialize
**Solution:** Check that:
- GSAP is loaded before marquee.js
- Container has `data-marquee` attribute
- Container has `display: flex` in CSS
- Items have `data-marquee-item="true"`

**Problem:** Direction doesn't change on resize
**Solution:**
- Verify ResizeObserver is supported (modern browsers)
- Check that flex-direction actually changes in computed styles
- Look for console errors

**Problem:** Animation jumps when direction changes
**Solution:**
- This is expected briefly during timeline rebuild
- Playhead position is preserved proportionally
- Check console for rebuild logs

## Manual Testing Checklist

Use `test-report.txt` for a printable checklist.

### Media Query Test
- [ ] Desktop view (>768px) shows horizontal marquee
- [ ] Mobile view (<768px) shows vertical marquee
- [ ] Transition is smooth when resizing
- [ ] Console logs show direction changes
- [ ] `data-marquee-active-direction` updates correctly

### Reverse Direction Test
- [ ] `row` → horizontal, normal direction
- [ ] `row-reverse` → horizontal, reversed
- [ ] `column` → vertical, normal direction
- [ ] `column-reverse` → vertical, reversed
- [ ] `data-marquee-active-reverse="true"` for reverse variants
- [ ] Console logs show CSS auto-detection

## Browser Compatibility

Tested in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

**Requirements:**
- CSS Flexbox support
- `window.getComputedStyle()`
- `ResizeObserver` API
- GSAP 3.12+

## Next Steps

After manual testing:
1. Document any visual issues or unexpected behavior
2. Test across different viewport sizes
3. Verify performance with many items
4. Test rapid resize scenarios
5. Check mobile device behavior (not just browser resize)

## Questions?

See `FLEXBOX-IMPLEMENTATION.md` in the parent directory for full technical documentation.
