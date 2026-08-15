# Security Policy

## Supported versions

I maintain this project on my own. I fix security problems on `main` and in the
next release. I do not backport fixes to older tags.

## Reporting a problem

**Please do not open a public issue for a security problem.**

Email me at <samuelbharti.io@gmail.com>. Tell me what you found and, if you
can, how to reproduce it. I will acknowledge your report within a few days and
tell you what I plan to do about it.

## Worth knowing before you report

- The app needs no key. Every dataset it shows is bundled in the repository, so
  it runs offline.
- The chat assistant is bring your own key and advice-only: it has no tools, so
  it cannot control the app. A key you paste stays in server memory for the life
  of the session, and is never written to disk.
- The genome browser page streams its reference from the igv.js data servers,
  and the Gosling page loads its library from a CDN. Both are third-party hosts.
- If you deploy the app yourself, the keys and the environment you deploy into
  are yours to secure. Serve it over HTTPS, since a pasted key travels from the
  browser to the server.
