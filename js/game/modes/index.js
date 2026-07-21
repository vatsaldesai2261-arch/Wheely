import classic from './classic.js';
import family from './family.js';
import classroom from './classroom.js';
import animal from './animal.js';
import story from './story.js';
import daily from './daily.js';

const MODES = { classic, family, classroom, animal, story, daily };
export const MODE_LIST = [classic, animal, story, daily, family, classroom];

export function getMode(id) { return MODES[id] || classic; }
export default { getMode, MODE_LIST };
