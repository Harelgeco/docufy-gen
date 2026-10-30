# Homepage upgrade (focused redesign, no product changes)

Only the public homepage and its pieces change. Sign-up, login, routing, document creation, admin and backend stay untouched. Blue #00226B stays the main action color.

## Page order
1. Top bar: logo, language button, "התחברות" as a quiet link, "הרשמה" as an outline (not blue) button.
2. Hero (text right, illustration left on desktop; stacked on mobile)
   - Title: "אותה תבנית. מסמכים מותאמים, בלי למלא הכול מחדש."
   - Subtitle: "מעלים תבנית Word וקובץ Excel עם הנתונים, בוחרים רשומות ומפיקים מסמך מותאם לכל רשומה."
   - One blue "התחל עכשיו" (same destination as today) + quiet link "איך זה עובד" that scrolls down.
   - Remove the background video and the "צפה בהדגמה" button (it only opens "coming soon").
   - Static illustration labeled "המחשה": Word template + Excel rows -> several filled documents, with made-up sample names only.
3. Problem / Solution / Result: three static cards side by side (stacked on mobile), large clear headings, no auto-rotation, timers or progress bars. Wording avoids claims like "one click", "in a minute", "no mistakes".
4. How it works: the existing three numbered steps kept visible together, wording checked against what the app really does (upload, choose records or fill manually, download PDF or Word).
5. FAQ (keyboard-accessible accordion), only answers verified in the app: which files to prepare, how to mark fields (<<field>>), choosing only some records, manual fill without Excel, download formats.
6. Closing band: short benefit line + blue "התחל עכשיו".
7. Simple footer: product name, links to existing pages, year.

## Design
- Calm off-white background, neutral tones, blue for actions, aqua only as a small accent.
- One Hebrew font family (Heebo or Assistant) with clear weights; no heavy gradients, glows or glass.
- Subtle entry fades only, disabled for reduced-motion users; reserved sizes so nothing jumps.
- Touch targets at least 44px, no horizontal scroll.

## Checks
- Screenshots at 320, 390, 768, 1440 widths and with enlarged text.
- Every button/link reaches its target; sign-up/login dialog still opens; no new console errors.

## Will report as still needed from you
Privacy/file-retention policy, contact details, pricing, a real demo video, confirmed target audience.

## Technical notes
- Edit `src/pages/Landing.tsx`; rewrite `src/components/ProblemSolution.tsx` as static; new `HeroIllustration`, `LandingFaq` (shadcn Accordion), `LandingFooter` components.
- Font via Google Fonts link in `index.html` + `fontFamily` in `tailwind.config.ts`; small token tweaks in `src/index.css` (keep primary).
- Remove hero video usage (asset pointer file can stay unused or be deleted).
- Update the demo-animation memory, since autoplay is now rejected for the homepage.
