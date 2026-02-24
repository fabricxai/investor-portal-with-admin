import Badge from '@/components/ui/Badge'

interface TierBadgeProps {
  tier: number
}

export default function TierBadge({ tier }: TierBadgeProps) {
  switch (tier) {
    case 0:
      return <Badge variant="tier0">Tier 0</Badge>
    case 1:
      return <Badge variant="tier1">Tier 1</Badge>
    case 2:
      return <Badge variant="tier2">Tier 2</Badge>
    default:
      return <Badge variant="default">Unknown</Badge>
  }
}
