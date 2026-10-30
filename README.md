# Apertura CX website

The public website for Apertura CX, a Melbourne customer experience and retail growth practice.

## Pages

- `index.html` Home, with the opening aperture hero
- `approach.html` The method, the customer journey and ways to work together
- `about.html` Principles and the team
- `begin.html` Snapshot request form
- `contact.html` General enquiry form
- `privacy.html` Privacy notice

Shared styles live in `site.css` and the header menu in `site.js`.

## Connecting the forms

Both forms send through Web3Forms. Create a free access key at web3forms.com using the inbox that should receive enquiries, then paste it into `ACCESS_KEY` in the form script near the end of `begin.html` and `contact.html`. Until a key is added, the forms validate but tell the visitor nothing has been sent.

## Hosting

Served by GitHub Pages from the `main` branch, root folder. Once a domain is purchased, add it under Settings, Pages, Custom domain, and enforce HTTPS.
