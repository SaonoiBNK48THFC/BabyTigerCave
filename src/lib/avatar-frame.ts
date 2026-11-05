// Use the sheet's actual rank, including ties, rather than a donor's list position.
export function avatarFrameForRank(rank: number): string | undefined {
  if (rank >= 1 && rank <= 3) return '/images/frame/frame-crown.png';
  if (rank >= 4 && rank <= 10) return '/images/frame/frame-no-crown.png';
  return undefined;
}
