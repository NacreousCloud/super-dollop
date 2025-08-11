import { Badge } from "./ui/badge";

interface QualityBadgeProps {
  type: 'A11y' | 'CSS' | 'testid';
  quality?: 'high' | 'medium' | 'low';
}

export function QualityBadge({ type, quality = 'high' }: QualityBadgeProps) {
  const getVariant = () => {
    switch (quality) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'destructive';
      default: return 'default';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'A11y': return quality === 'high' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
      case 'CSS': return quality === 'high' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
      case 'testid': return quality === 'high' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800';
    }
  };

  return (
    <Badge variant={getVariant()} className={`text-xs ${getColor()}`}>
      {type}
    </Badge>
  );
}