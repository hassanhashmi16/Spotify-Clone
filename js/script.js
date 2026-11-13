const currentSong = new Audio();
let songs = [];
let currFolder = "songs/Coldplay";
let currentTrack = "";
let previousVolume = 0.5;
const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const volumeInput = document.querySelector(".range input");
const volumeIcon = document.querySelector(".volume > img");
currentSong.volume = 0.5;

function secondsToMinutesSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function updateProgress() {
    document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    const percent = currentSong.duration ? currentSong.currentTime / currentSong.duration * 100 : 0;
    document.querySelector(".circle").style.left = `${percent}%`;
}

async function directoryLinks(folder) {
    const url = new URL(`${folder.replace(/\/$/, "")}/`, document.baseURI);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Cannot load ${folder}: HTTP ${response.status}`);
    const listingDocument = new DOMParser().parseFromString(await response.text(), "text/html");
    return { url, links: Array.from(listingDocument.querySelectorAll("a[href]"), link => new URL(link.getAttribute("href"), url)) };
}

async function getSongs(folder) {
    currFolder = folder;
    const { links } = await directoryLinks(folder);
    songs = links.filter(link => /\.mp3$/i.test(link.pathname)).map(link => decodeURIComponent(link.pathname.split("/").pop()));
    const list = document.querySelector(".songList ul");
    list.replaceChildren();
    for (const song of songs) {
        const item = document.createElement("li");
        item.innerHTML = `<img class="invert" src="img/music.svg" alt=""><div class="info"><div></div><div>Hassan</div></div><div class="playnow"><span>Play Now</span><img class="invert" src="img/play.svg" alt=""></div>`;
        item.querySelector(".info > div").textContent = song;
        item.addEventListener("click", () => playMusic(song));
        list.append(item);
    }
    if (!songs.length) {
        const empty = document.createElement("li");
        empty.textContent = "Add your own MP3 files to this album folder, then refresh.";
        list.append(empty);
    }
    return songs;
}

async function playMusic(track, pause = false) {
    currentSong.pause();
    if (!track) {
        currentTrack = "";
        currentSong.removeAttribute("src");
        currentSong.load();
        document.querySelector(".songinfo").textContent = "No tracks in this album";
        playButton.src = "img/play.svg";
        updateProgress();
        return;
    }
    currentTrack = track;
    currentSong.src = new URL(`${currFolder}/${encodeURIComponent(track)}`, document.baseURI).href;
    document.querySelector(".songinfo").textContent = track;
    playButton.src = "img/play.svg";
    updateProgress();
    if (!pause) {
        try { await currentSong.play(); } catch { playButton.src = "img/play.svg"; }
    }
}

async function displayAlbums() {
    const { url, links } = await directoryLinks("songs");
    const container = document.querySelector(".cardContainer");
    container.replaceChildren();
    for (const link of links) {
        if (!link.pathname.startsWith(url.pathname) || link.pathname === url.pathname || !link.pathname.endsWith("/")) continue;
        const metadata = await fetch(new URL("info.json", link));
        if (!metadata.ok) continue;
        const album = await metadata.json();
        const folder = `songs/${decodeURIComponent(link.pathname.split("/").filter(Boolean).pop())}`;
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.folder = folder;
        card.innerHTML = `<div class="play"><img src="img/play.svg" alt="Play album"></div><img class="album-cover" alt=""><h2></h2><p></p>`;
        const cover = card.querySelector(".album-cover");
        cover.src = new URL("cover.jpg", link).href;
        cover.alt = `${album.title} album cover`;
        card.querySelector("h2").textContent = album.title;
        card.querySelector("p").textContent = album.description;
        card.addEventListener("click", async () => {
            try { await getSongs(folder); await playMusic(songs[0]); }
            catch (error) { document.querySelector(".songinfo").textContent = error.message; }
        });
        container.append(card);
    }
}

playButton.addEventListener("click", async () => {
    if (!currentTrack) return;
    if (currentSong.paused) {
        try { await currentSong.play(); } catch { document.querySelector(".songinfo").textContent = "Audio could not play. Check that the local MP3 file is available."; }
    } else currentSong.pause();
});
previousButton.addEventListener("click", () => {
    const index = songs.indexOf(currentTrack);
    if (index > 0) playMusic(songs[index - 1]);
});
nextButton.addEventListener("click", () => {
    const index = songs.indexOf(currentTrack);
    if (index >= 0 && index + 1 < songs.length) playMusic(songs[index + 1]);
});
currentSong.addEventListener("ended", () => {
    const index = songs.indexOf(currentTrack);
    if (index >= 0 && index + 1 < songs.length) playMusic(songs[index + 1]);
});
currentSong.addEventListener("play", () => { playButton.src = "img/pause.svg"; });
currentSong.addEventListener("pause", () => { playButton.src = "img/play.svg"; });
currentSong.addEventListener("timeupdate", updateProgress);
currentSong.addEventListener("loadedmetadata", updateProgress);
document.querySelector(".seekbar").addEventListener("click", event => {
    if (!Number.isFinite(currentSong.duration) || currentSong.duration <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    currentSong.currentTime = currentSong.duration * percent;
    updateProgress();
});
volumeInput.addEventListener("input", () => {
    currentSong.volume = Number(volumeInput.value) / 100;
    if (currentSong.volume > 0) previousVolume = currentSong.volume;
    volumeIcon.src = currentSong.volume === 0 ? "img/mute.svg" : "img/volume.svg";
});
volumeIcon.addEventListener("click", () => {
    if (currentSong.volume > 0) { previousVolume = currentSong.volume; currentSong.volume = 0; }
    else currentSong.volume = previousVolume || 0.5;
    volumeInput.value = String(currentSong.volume * 100);
    volumeIcon.src = currentSong.volume === 0 ? "img/mute.svg" : "img/volume.svg";
});
document.querySelector(".hamburger").addEventListener("click", () => { document.querySelector(".left").style.left = "0"; });
document.querySelector(".close").addEventListener("click", () => { document.querySelector(".left").style.left = "-120%"; });

async function main() {
    try {
        await getSongs(currFolder);
        await playMusic(songs[0], true);
        await displayAlbums();
    } catch (error) {
        document.querySelector(".songinfo").textContent = `${error.message}. Run the app with the HTTP server described in README.md.`;
    }
}
main();
