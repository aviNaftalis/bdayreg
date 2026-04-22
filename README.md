# bdayreg

A free, fast, nerdy birthday gift registry. No accounts. No apps. Just a link + PIN.

```
 _         _
| |__   __| | __ _ _   _
| '_ \ / _` |/ _` | | | |
| |_) | (_| | (_| | |_| |
|_.__/ \__,_|\__,_|\__, |
                    |___/  reg
```

## What is this?

A birthday gift registry hosted on GitHub Pages. Share a link and a PIN with friends — they can claim gifts, split costs, and leave messages. Everything updates in real time.

## Features

- **Fast** — ~8KB total, renders in milliseconds. ASCII/Unicode-first design.
- **PIN-protected** — Simple PIN gate keeps randos out.
- **Gift claiming** — Full claim, partial claim (split costs), or suggest new gifts.
- **Multi-registry** — Anyone can create their own registry.
- **Admin panel** — Token-protected panel to add/edit/delete gifts.
- **No accounts** — Just enter your name to claim gifts.
- **Real-time sync** — Data synced via JSONBin.io, updates every 15 seconds.
- **Zero dependencies** — Vanilla JS, no frameworks, no build step.

## How it works

1. Create a registry (30 seconds)
2. Share the link + PIN with friends & family
3. They enter the PIN, claim gifts — everyone sees who's getting what

## Gift states

```
[ ] unclaimed     — up for grabs
[x] claimed       — someone's getting this
[/] partially     — one or more people splitting the cost
[~] suggested     — guest suggestion, pending admin approval
```

## Tech stack

- **Frontend**: Vanilla JS, inline CSS, single HTML page
- **Backend**: JSONBin.io (free JSON storage with REST API)
- **Hosting**: GitHub Pages (free)
- **Auth**: PIN for visitors, admin token for registry owners

## Live

**https://avinaftalis.github.io/bdayreg/**
