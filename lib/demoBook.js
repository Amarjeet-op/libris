// Built-in demo "book" so the interface has something to show immediately.
// This is original placeholder prose (not a rendered PDF, not copyrighted
// text) — it is rendered through the same page/typography treatment as a
// real PDF, but the reader UI never claims it came from a PDF file.

export const DEMO_BOOK_ID = "demo-the-lighthouse-keeper";

const PAGES = [
  "The lighthouse stood at the edge of the world, or so it seemed to anyone who had never travelled further than the harbor road. Its light turned through the fog every eleven seconds, patient as a held breath, and had done so for longer than anyone in the village could remember.",
  "Mara had kept the lamp for six winters now, ever since her father's hands grew too unsteady for the climb. She knew the one hundred and forty-two steps by feel alone, knew which ones creaked and which ones held their silence, and knew exactly how the wind changed its voice before a storm arrived.",
  "On the night the ship went quiet, the sea had been strangely calm. That was the thing no one talked about afterward — how still the water was, how the fog rolled in without a breath of wind to carry it, as if the night itself were holding something back.",
  "She lit the lamp at the usual hour and climbed to the gallery to watch it sweep the dark, as she had ten thousand times before. But this time, far out past the point where the light usually dissolved into nothing, she saw an answering flicker. Small. Deliberate. Three short, three long, three short.",
  "It took her four minutes to remember the old signal, the one her father had taught her when she was young enough to still think the lighthouse was a kind of magic rather than a kind of duty. Four minutes, and then her hands were already moving, already reaching for the shutter that could answer light with light.",
  "By dawn there were six of them wrapped in every blanket the keeper's cottage owned, sitting too close to a fire that could not possibly be built high enough. None of them spoke much. There is a particular kind of quiet that follows a night at sea gone wrong, and Mara had learned long ago not to fill it.",
  "Her father used to say that a lighthouse doesn't save anyone. It only tells the truth about where the rocks are, and lets the rest of the world decide what to do with that truth. Mara had never quite believed him. Standing in the gallery that morning, watching six strangers sleep by her fire, she believed him even less.",
  "The fishing boats went out again three days later, as they always did, because the sea did not care what it had almost taken. Mara climbed the one hundred and forty-two steps that evening as she always did, lit the lamp at the usual hour, and watched it sweep the dark in its slow, patient turn.",
  "Some nights, when the fog was thick enough, she thought she could still see the small deliberate flicker out past the point — three short, three long, three short — though she knew by then it was only ever the light finding its own reflection in the mist. She watched for it anyway. It seemed like the least a keeper could do.",
];

export function getDemoBook() {
  return {
    id: DEMO_BOOK_ID,
    title: "The Lighthouse Keeper's Daughter",
    author: "A Libris Original",
    isDemo: true,
    pageCount: PAGES.length,
    pageTexts: PAGES.map((text, i) => ({ page: i + 1, text })),
  };
}
