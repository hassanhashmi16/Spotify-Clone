# Spotify Clone

A Spotify-inspired music player built with HTML, CSS and vanilla JavaScript. An earlier frontend learning project, with album cards, a playlist sidebar, playback controls and a responsive mobile drawer.

## Run locally

Requires Python 3 and a browser. From this repository's root:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173/**. Use an HTTP server with directory listings; opening `index.html` as a file or hosting it on GitHub Pages will not provide the directory index the player uses to discover audio files.

No npm packages, Spotify credentials or external music service are required.

## Local audio

The source includes four album folders, their cover images and display metadata. Commercial recordings are excluded from Git. Add your own MP3 files that you have permission to use into a folder under `songs/`, then refresh the page. An album with no MP3 files shows an empty state.

To add an album, create a folder under `songs/` containing `cover.jpg`, MP3 files and an `info.json` like:

```json
{
  "title": "My playlist",
  "description": "A collection of local tracks"
}
```

## Features

- Album selection and track lists discovered from the local server.
- Play/pause, previous/next, seeking, volume and mute controls.
- Track duration and playback progress.
- Responsive playlist drawer on smaller screens.
- Relative URLs, so the app can run on a port separate from other projects.

Sign Up, Log In, Home and Search are interface elements from the visual study; they do not implement Spotify accounts, authentication or search. This is an educational interface study and is not affiliated with Spotify.
