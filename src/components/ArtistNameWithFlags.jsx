import artistOrigins from '../data/artistOrigins.json';
import { getCountryName, getRenderableOrigin } from '../utils/countryFlags';

function OriginFlag({ country, flag }) {
  return (
    <span className="artist-origin-flag" role="img" aria-label={`Origin: ${getCountryName(country)}`}>
      {flag}
    </span>
  );
}

export default function ArtistNameWithFlags({ artist, className = '', origins = artistOrigins }) {
  const origin = getRenderableOrigin(origins[artist]);
  const classes = ['artist-name-with-flags', className].filter(Boolean).join(' ');

  if (!origin) {
    return <span className={classes}>{artist}</span>;
  }

  const flags = origin.countries.map((country, index) => (
    <OriginFlag key={country} country={country} flag={origin.flags[index]} />
  ));

  if (origin.countries.length === 1) {
    return (
      <span className={`${classes} one-country`}>
        <span className="artist-name-text">{artist}</span>
        <span className="artist-origin-flags">{flags}</span>
      </span>
    );
  }

  if (origin.countries.length === 2) {
    return (
      <span className={`${classes} two-countries`}>
        {flags[0]}
        <span className="artist-name-text">{artist}</span>
        {flags[1]}
      </span>
    );
  }

  return (
    <span className={`${classes} multi-country`}>
      <span className="artist-name-text">{artist}</span>
      <span className="artist-origin-flags multi">{flags}</span>
    </span>
  );
}
