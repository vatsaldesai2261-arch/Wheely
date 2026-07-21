import classic from './classic.js';
import family from './family.js';
import classroom from './classroom.js';
import animal from './animal.js';
import story from './story.js';
import daily from './daily.js';
import beltTest from './belt-test.js';
import team from './team.js';
import freeze from './freeze.js';
import balanceBoss from './balance-boss.js';
import speedy from './speedy.js';
import buddy from './buddy.js';
import journey from './journey.js';

const MODES = { classic, family, classroom, animal, story, daily, 'belt-test': beltTest, team, freeze, 'balance-boss': balanceBoss, speedy, buddy, journey };
export const MODE_LIST = [classic, animal, story, daily, beltTest, team, freeze, balanceBoss, speedy, buddy, journey, family, classroom];

export function getMode(id) { return MODES[id] || classic; }
export default { getMode, MODE_LIST };
