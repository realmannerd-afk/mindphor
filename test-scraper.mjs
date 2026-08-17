async function test() {
    const id = "324684580"; // Spotify
    const usUrl = `https://itunes.apple.com/us/rss/customerreviews/page=1/id=${id}/sortBy=mostRecent/json`;
    const ukUrl = `https://itunes.apple.com/gb/rss/customerreviews/page=1/id=${id}/sortBy=mostRecent/json`;
    
    const usRes = await fetch(usUrl).then(r => r.json());
    const ukRes = await fetch(ukUrl).then(r => r.json());
    
    console.log("US Feed Entries:", usRes.feed.entry ? usRes.feed.entry.length : "None");
    console.log("GB Feed Entries:", ukRes.feed.entry ? ukRes.feed.entry.length : "None");
    
    if (usRes.feed.entry && ukRes.feed.entry) {
        console.log("US Author:", usRes.feed.entry[1].author.name.label);
        console.log("GB Author:", ukRes.feed.entry[1].author.name.label);
    }
}
test();
