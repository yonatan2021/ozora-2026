import connectionsData from '../data/artistConnections.json';
import timetableData from '../data/timetable.json';

const performingArtists = new Set(timetableData.map(s => s.artist));
const setsByArtist = timetableData.reduce((acc, set) => {
  if (!acc[set.artist]) acc[set.artist] = [];
  acc[set.artist].push(set);
  return acc;
}, {});

export function getArtistConnections(artistName) {
  if (!artistName) return null;

  // Find all people associated with this project
  const members = connectionsData.filter(person => 
    person.projects.includes(artistName)
  );

  if (members.length === 0) return null;

  const membersInfo = members.map(member => {
    const otherProjects = member.projects.filter(proj => 
      proj !== artistName && performingArtists.has(proj)
    );
    return {
      name: member.name,
      otherProjects
    };
  });

  const hasOtherProjects = membersInfo.some(m => m.otherProjects.length > 0);
  if (!hasOtherProjects) return null;

  const allOtherProjects = new Set();
  membersInfo.forEach(m => {
    m.otherProjects.forEach(proj => allOtherProjects.add(proj));
  });

  let additionalShowsCount = 0;
  allOtherProjects.forEach(proj => {
    additionalShowsCount += (setsByArtist[proj] || []).length;
  });

  return {
    isEnsemble: members.length > 1,
    members: membersInfo,
    additionalShowsCount,
    allOtherProjects: Array.from(allOtherProjects)
  };
}

export function getSetsForArtist(artistName) {
  return setsByArtist[artistName] || [];
}
