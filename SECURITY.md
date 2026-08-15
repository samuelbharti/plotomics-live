# Security Policy

## Supported versions

Fixes land on `main` and go out with the next release. Older tags are not
patched.

## Reporting a problem

Please do not open a public issue for a security problem. Email
<samuelbharti.io@gmail.com> instead, describing what you found and, where you
can, the steps to reproduce it. You will get an acknowledgement within a few
days, along with what happens next.

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
