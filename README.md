# sRSSly

A minimalistic self-hosted RSS reader that actually works how you'd expect.

<p align="center">
  <img src="./screenshot.png" alt="sRSSly Screenshot" width="400">
</p>

## What's this?

This is just a straightforward feed reader.

- Works great on mobile (desktop is coming, I promise)
- Install it as an app on your phone (aka PWA)
- Dark mode because obviously
- Just paste any URL and it'll find the feed
- Pretty fast

## Try it

I'm running it at [app.srssly.com](https://app.srssly.com/) for myself and friends. You can make an account if you want to check it out.

## Host it

### Docker (easiest way)

Make an `env.prod` file:

```bash
NODE_ENV=production
DB_HOST=db
DB_NAME=srssly_production
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_PORT=5432
```

Then just:

```bash
docker compose up -d
docker compose run --rm app init-db # set up the database
```

Set up a cron to fetch new entries every 15 minutes:

```bash
*/15 * * * * docker compose run --rm app fetch-entries
```

### Local development

```bash
npm run dev              # runs everything
npm run init-db          # set up the database
npm run fetch-entries    # pull new feed entries
```

## Contributing

PRs welcome. Keep it simple. Use AI. Just make sure to write tests.

## License

MIT
