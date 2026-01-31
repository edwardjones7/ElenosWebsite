# Form Submissions Without Running a Server (Formspree)

The contact and waitlist forms are set up to send submissions to **Formspree** so you don't have to run `server.js` for the site to collect data. Submissions are stored in your Formspree account and you can export them as CSV anytime.

## Setup (one-time)

1. **Sign up** at [formspree.io](https://formspree.io) (free tier: 50 submissions/month).
2. **Create two forms** in the Formspree dashboard:
   - One for **Contact** (project intake)
   - One for **Waitlist** (Assistant+ email)
3. **Get each form ID** from the form’s integration/embed page (e.g. `https://formspree.io/f/xyzabc` → the ID is `xyzabc`).
4. **Put the IDs in `script.js`** at the top:
   - Replace `YOUR_CONTACT_FORM_ID` with your Contact form ID.
   - Replace `YOUR_WAITLIST_FORM_ID` with your Waitlist form ID.
5. **Verify** each form when Formspree asks (they’ll email you a link).

## Getting your data as CSV

- In the Formspree dashboard, open a form and use **Export** or **Submissions** to download submissions as CSV.
- You can also get email notifications for each submission in Formspree settings.

## Optional: keep using your local server

If you prefer to run `node server.js` locally and write to `contact.csv` and `waitlist.csv`, change the two Formspree URLs at the top of `script.js` back to:

- Contact: `http://localhost:3000/api/contact`
- Waitlist: `http://localhost:3000/api/waitlist`

and revert the success checks to use `data.success` if needed.
