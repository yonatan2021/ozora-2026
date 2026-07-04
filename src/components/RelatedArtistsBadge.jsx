import { Link2 } from 'lucide-react';
import { getArtistConnections } from '../utils/connections';
import { translations } from '../utils/lang';

export default function RelatedArtistsBadge({ artistName, lang }) {
  const connections = getArtistConnections(artistName);
  if (!connections || connections.additionalShowsCount === 0) return null;

  const t = translations[lang];
  const count = connections.additionalShowsCount;

  const label = count === 1
    ? t.connectedToSingle
    : t.connectedToMulti.replace('{count}', count);

  return (
    <div className="connection-badge" title={label}>
      <Link2 size={10} className="connection-badge-icon" />
      <span>{label}</span>
    </div>
  );
}
